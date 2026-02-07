import Dream from '../Dream.js'
import RendersManyMustReceiveArray from '../errors/serializers/RendersManyMustReceiveArray.js'
import compact from '../helpers/compact.js'
import { TIME_WITH_TIMEZONE_COLUMN_CHECK_REGEXP } from '../helpers/db/types/helpers.js'
import round from '../helpers/round.js'
import snakeify from '../helpers/snakeify.js'
import { ViewModel } from '../types/dream.js'
import {
  DreamModelSerializerType,
  InternalAnyRendersOneOrManyOpts,
  NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption,
  SerializerCasing,
  SimpleObjectSerializerType,
} from '../types/serializer.js'
import CalendarDate from '../utils/datetime/CalendarDate.js'
import ClockTime from '../utils/datetime/ClockTime.js'
import { DateTime } from '../utils/datetime/DateTime.js'
import DreamSerializerBuilder from './builders/DreamSerializerBuilder.js'
import ObjectSerializerBuilder from './builders/ObjectSerializerBuilder.js'
import inferSerializerFromDreamOrViewModel from './helpers/inferSerializerFromDreamOrViewModel.js'
import { serializerForAssociatedClass } from './helpers/serializerForAssociatedClass.js'

export interface SerializerRendererOpts {
  casing?: SerializerCasing
}

interface StandardizedSerializerRendererOpts {
  casing: SerializerCasing
}

export default class SerializerRenderer {
  private serializerBuilder: DreamSerializerBuilder<any, any> | null
  private passthroughData: object
  private renderOpts: StandardizedSerializerRendererOpts

  constructor(
    serializerBuilder:
      | DreamSerializerBuilder<any, any>
      | ObjectSerializerBuilder<any, any>
      | null
      | undefined,
    passthroughData: object = {},
    { casing = 'camel' }: SerializerRendererOpts = {}
  ) {
    this.serializerBuilder = (serializerBuilder ?? null) as DreamSerializerBuilder<any, any> | null
    this.passthroughData = passthroughData
    this.renderOpts = { casing }
  }

  public render() {
    if (this.serializerBuilder === null) return null
    const data = this.serializerBuilder['data']
    if (!data) return null

    // passthrough data must be passed both into the serializer and render
    // because, if the serializer does accept passthrough data, then passing it in is how
    // it gets into the serializer, but if it does not accept passthrough data, and therefore
    // does not pass it into the call to DreamSerializer/ObjectSerializer,
    // then it would be lost to serializers rendered via rendersOne/Many, and SerializerRenderer
    // handles passing its passthrough data into those
    const passthroughData = { ...this.passthroughData, ...this.serializerBuilder['passthroughData'] }

    let renderedAttributes: Record<string, any> = {}

    renderedAttributes = this.serializerBuilder['attributes'].reduce((accumulator, attribute) => {
      const attributeType = attribute.type
      switch (attributeType) {
        ////////////////
        // attributes //
        ////////////////
        case 'attribute': {
          const outputAttributeName = this.setCase(attribute.options?.as ?? attribute.name)
          const value = data[attribute.name] ?? attribute.options?.default
          if (value === undefined && attribute.options?.required === false) return accumulator
          accumulator[outputAttributeName] = applyRenderingOptionsToAttribute(
            data,
            value,
            attribute.name,
            attribute.options,
            this.passthroughData,
            this.renderOpts
          )

          return accumulator
        }
        /////////////////////
        // end: attributes //
        /////////////////////

        /////////////////////////
        // delegatedAttributes //
        /////////////////////////
        case 'delegatedAttribute': {
          const outputAttributeName = this.setCase(attribute.options?.as ?? attribute.name)
          const target = data[attribute.targetName]
          const value = target?.[attribute.name] ?? attribute.options?.default
          if (value === undefined && attribute.options?.required === false) return accumulator
          accumulator[outputAttributeName] = applyRenderingOptionsToAttribute(
            target,
            value,
            attribute.name,
            attribute.options,
            this.passthroughData,
            this.renderOpts
          )
          return accumulator
        }
        //////////////////////////////
        // end: delegatedAttributes //
        //////////////////////////////

        //////////////////////
        // customAttributes //
        //////////////////////
        case 'customAttribute': {
          // customAttributes don't support `as` since they are already custom and there is nothing to override
          const outputAttributeName = this.setCase(attribute.name)
          // customAttributes don't support rendering options since the custom function should handle all
          // manipulation of the value

          const value = attribute.fn()
          if (value === undefined && attribute.options?.required === false) return accumulator

          if (attribute.options.flatten) {
            return {
              ...accumulator,
              ...applyRenderingOptionsToAttribute(
                null,
                value,
                attribute.name,
                {},
                this.passthroughData,
                this.renderOpts
              ),
            }
          } else {
            accumulator[outputAttributeName] = applyRenderingOptionsToAttribute(
              null,
              value,
              attribute.name,
              {},
              this.passthroughData,
              this.renderOpts
            )
            return accumulator
          }
        }
        ///////////////////////////
        // end: customAttributes //
        ///////////////////////////

        /////////////////
        // rendersOnes //
        /////////////////
        case 'rendersOne': {
          const outputAttributeName = this.setCase(attribute.options.as ?? attribute.name)
          const associatedObject = data[attribute.name]

          let serializer: DreamModelSerializerType | SimpleObjectSerializerType | null = null

          if (associatedObject) {
            serializer = serializerForAssociatedObject(associatedObject, attribute.options)
          } else if (attribute.options.flatten) {
            /**
             * Only used when flatten: true, and the associated model is null, in which case,
             * we need something to determine the keys that will be flattened into the
             * rendering serializer
             */
            serializer = serializerForAssociatedClass(data, attribute.name, attribute.options)
          }

          const serializerBuilder = serializer?.(
            attribute.options.flatten ? (associatedObject ?? {}) : associatedObject,
            // passthrough data going into the serializer is the argument that gets
            // used in the custom attribute callback function
            passthroughData
          )

          if (attribute.options.flatten) {
            return {
              ...accumulator,
              // passthrough data must be passed both into the serializer and render
              // because, if the serializer does accept passthrough data, then passing it in is how
              // it gets into the serializer, but if it does not accept passthrough data, and therefore
              // does not pass it into the call to DreamSerializer/ObjectSerializer,
              // then it would be lost to serializers rendered via rendersOne/Many, and SerializerRenderer
              // handles passing its passthrough data into those
              ...serializerBuilder?.render(passthroughData, this.renderOpts),
            }
          } else {
            // passthrough data must be passed both into the serializer and render
            // because, if the serializer does accept passthrough data, then passing it in is how
            // it gets into the serializer, but if it does not accept passthrough data, and therefore
            // does not pass it into the call to DreamSerializer/ObjectSerializer,
            // then it would be lost to serializers rendered via rendersOne/Many, and SerializerRenderer
            // handles passing its passthrough data into those
            accumulator[outputAttributeName] =
              serializerBuilder?.render(passthroughData, this.renderOpts) ?? null
            return accumulator
          }
        }
        //////////////////////
        // end: rendersOnes //
        //////////////////////

        //////////////////
        // rendersManys //
        //////////////////
        case 'rendersMany': {
          const outputAttributeName = this.setCase(attribute.options?.as ?? attribute.name)
          const associatedObjects = data[attribute.name]

          if (!associatedObjects) throw new RendersManyMustReceiveArray(attribute, associatedObjects)

          accumulator[outputAttributeName] = compact(associatedObjects as ViewModel[]).map(
            associatedObject => {
              const serializer = serializerForAssociatedObject(associatedObject, attribute.options)

              return (
                // passthrough data going into the serializer is the argument that gets
                // used in the custom attribute callback function
                serializer(associatedObject, passthroughData)
                  // passthrough data must be passed both into the serializer and render
                  // because, if the serializer does accept passthrough data, then passing it in is how
                  // it gets into the serializer, but if it does not accept passthrough data, and therefore
                  // does not pass it into the call to DreamSerializer/ObjectSerializer,
                  // then it would be lost to serializers rendered via rendersOne/Many, and SerializerRenderer
                  // handles passing its passthrough data into those
                  .render(passthroughData)
              )
            }
          )

          return accumulator
        }
        ///////////////////////
        // end: rendersManys //
        ///////////////////////

        default: {
          // protection so that if a new ValidationType is ever added, this will throw a type error at build time
          const _never: never = attributeType
          throw new Error(`Unhandled serializer attribute type: ${_never as string}`)
        }
      }
    }, renderedAttributes)
    return renderedAttributes
  }

  private setCase(attr: string) {
    switch (this.renderOpts.casing) {
      case 'camel':
        return attr
      case 'snake':
        return snakeify(attr)
      default: {
        // protection so that if a new Casing is ever added, this will throw a type error at build time
        const _never: never = this.renderOpts.casing
        throw new Error(`Unhandled Casing: ${_never as string}`)
      }
    }
  }
}

function applyRenderingOptionsToAttribute(
  data: Dream | object | null,
  value: any,
  attributeName: string,
  options:
    | NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption
    | Partial<NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption>
    | undefined,
  passthroughData: object,
  renderOptions: SerializerRendererOpts
) {
  if (Array.isArray(value))
    return value.map(val =>
      _applyRenderingOptionsToAttribute(data, val, attributeName, options, passthroughData, renderOptions)
    )
  return _applyRenderingOptionsToAttribute(
    data,
    value,
    attributeName,
    options,
    passthroughData,
    renderOptions
  )
}

function _applyRenderingOptionsToAttribute(
  data: Dream | object | null,
  value: any,
  attributeName: string,
  options:
    | NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption
    | Partial<NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption>
    | undefined,
  passthroughData: object,
  renderOptions: SerializerRendererOpts
) {
  if (value instanceof DreamSerializerBuilder || value instanceof ObjectSerializerBuilder)
    return value.render(passthroughData, renderOptions)
  if (value instanceof DateTime) return value.toISO()
  if (value instanceof CalendarDate) return value.toISO()
  if (value instanceof ClockTime) {
    if (
      data instanceof Dream &&
      TIME_WITH_TIMEZONE_COLUMN_CHECK_REGEXP.test(
        (data.constructor as typeof Dream)['cachedTypeFor'](attributeName)
      )
    ) {
      return value.toISOTime({ includeOffset: true })
    } else {
      return value.toISOTime({ includeOffset: false })
    }
  }
  if (typeof value === 'bigint') return value.toString()
  const precision = options?.precision
  if (typeof value === 'number' && typeof precision === 'number') return round(value, precision)
  return value ?? null
}

function serializerForAssociatedObject<ObjectType extends Dream | ViewModel>(
  associatedObject: ObjectType,
  options: InternalAnyRendersOneOrManyOpts
): DreamModelSerializerType | SimpleObjectSerializerType {
  if (options.serializer) return options.serializer
  return inferSerializerFromDreamOrViewModel(associatedObject, options.serializerKey)
}
