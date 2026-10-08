import Dream from '../Dream.js'
import RendersManyMustReceiveArray from '../errors/serializers/RendersManyMustReceiveArray.js'
import compact from '../helpers/compact.js'
import round from '../helpers/round.js'
import snakeify from '../helpers/snakeify.js'
import { ViewModel } from '../types/dream.js'
import {
  DreamModelSerializerType,
  InternalAnyRendersOneOrManyOpts,
  NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption,
  SerializerCasing,
  SerializerResolutionContext,
  SerializerResolutionEdge,
  SimpleObjectSerializerType,
} from '../types/serializer.js'
import BaseClockTime from '../utils/datetime/BaseClockTime.js'
import CalendarDate from '../utils/datetime/CalendarDate.js'
import { DateTime } from '../utils/datetime/DateTime.js'
import DreamSerializerBuilder from './builders/DreamSerializerBuilder.js'
import ObjectSerializerBuilder from './builders/ObjectSerializerBuilder.js'
import inferSerializerFromDreamOrViewModel from './helpers/inferSerializerFromDreamOrViewModel.js'
import { serializersForAssociatedClass } from './helpers/serializersForAssociatedClass.js'

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

          if (!associatedObject && attribute.options.flatten) {
            return {
              ...accumulator,
              ...this.nullFlattenedAttributes(
                serializersForAssociatedClass(
                  data instanceof Dream ? (data.constructor as typeof Dream) : null,
                  attribute.name,
                  attribute.options
                ),
                passthroughData
              ),
            }
          }

          const serializer = associatedObject
            ? serializerForAssociatedObject(
                associatedObject,
                attribute.options,
                renderTimeResolutionContext(attribute.options, 'rendersOne', attribute.name)
              )
            : null

          const serializerBuilder = serializer?.(
            associatedObject,
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

          // Hoisted out of the map: the context is identical for every element, is immutable, and is
          // read only while an error message is being built, so one object serves the whole
          // collection rather than one per element.
          const resolutionContext = renderTimeResolutionContext(
            attribute.options,
            'rendersMany',
            attribute.name
          )

          accumulator[outputAttributeName] = compact(associatedObjects as ViewModel[]).map(
            associatedObject => {
              const serializer = serializerForAssociatedObject(
                associatedObject,
                attribute.options,
                resolutionContext
              )

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
                  .render(passthroughData, this.renderOpts)
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

  /**
   * The keys a flattened `rendersOne` adds to the parent's payload when its associated object is
   * null: each key any of `serializers` declares, set to `null`. There are several serializers when
   * the association is a polymorphic BelongsTo, one for each target class, and their keys are
   * unioned.
   *
   * Each serializer is built over an empty object to read its declarations, so a serializer that
   * reads a property of its data while being built still builds, and nothing is rendered: no
   * attribute callback runs and no association of the missing object is read. A flattened
   * `rendersOne` it declares adds its own serializers' keys the same way. A flattened
   * `customAttribute` adds none, since only its callback knows its keys.
   */
  private nullFlattenedAttributes(
    serializers: (DreamModelSerializerType | SimpleObjectSerializerType)[],
    passthroughData: object,
    serializersBeingFlattened: Set<DreamModelSerializerType | SimpleObjectSerializerType> = new Set()
  ): Record<string, null> {
    return serializers.reduce<Record<string, null>>((flattenedKeys, serializer) => {
      // a serializer reached again, e.g. one that flattens itself directly or through others, or
      // one that two polymorphic targets both flatten, adds no keys the first walk through it did not
      if (serializersBeingFlattened.has(serializer)) return flattenedKeys
      serializersBeingFlattened.add(serializer)

      const serializerBuilder = serializer({}, passthroughData) as DreamSerializerBuilder<any, any>
      const dreamClass =
        serializerBuilder instanceof DreamSerializerBuilder
          ? (serializerBuilder['$typeForOpenapi'] as typeof Dream)
          : null

      return serializerBuilder['attributes'].reduce<Record<string, null>>((keys, attribute) => {
        const attributeType = attribute.type
        switch (attributeType) {
          case 'attribute':
          case 'delegatedAttribute':
          case 'rendersMany':
            keys[this.setCase(attribute.options?.as ?? attribute.name)] = null
            return keys

          case 'customAttribute':
            if (!attribute.options.flatten) keys[this.setCase(attribute.name)] = null
            return keys

          case 'rendersOne':
            if (!attribute.options.flatten) {
              keys[this.setCase(attribute.options.as ?? attribute.name)] = null
              return keys
            }

            return {
              ...keys,
              ...this.nullFlattenedAttributes(
                serializersForAssociatedClass(dreamClass, attribute.name, attribute.options),
                passthroughData,
                serializersBeingFlattened
              ),
            }

          default: {
            // protection so that if a new ValidationType is ever added, this will throw a type error at build time
            const _never: never = attributeType
            throw new Error(`Unhandled serializer attribute type: ${_never as string}`)
          }
        }
      }, flattenedKeys)
    }, {})
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

  if (value instanceof DateTime || value instanceof CalendarDate || value instanceof BaseClockTime) {
    return value.toISO()
  }

  if (typeof value === 'bigint') return value.toString()
  const precision = options?.precision
  if (typeof value === 'number' && typeof precision === 'number') return round(value, precision)
  return value ?? null
}

/**
 * `resolutionContext` is error-only: it names the rendersOne/rendersMany this object is being
 * rendered through, so that a serializer that cannot be resolved for it says which association led
 * here rather than only which class failed. It is `undefined` whenever no resolution will happen —
 * see `renderTimeResolutionContext`.
 */
function serializerForAssociatedObject<ObjectType extends Dream | ViewModel>(
  associatedObject: ObjectType,
  options: InternalAnyRendersOneOrManyOpts,
  resolutionContext: SerializerResolutionContext | undefined
): DreamModelSerializerType | SimpleObjectSerializerType {
  if (options.serializer) return options.serializer
  return inferSerializerFromDreamOrViewModel(associatedObject, options.serializerKey, resolutionContext)
}

/**
 * Builds the error-only resolution context for one rendered association, or `undefined` when the
 * render will not resolve a serializer at all.
 *
 * Rendering is a hot path — once per rendered association per request, and `rendersMany` renders one
 * element at a time from a collection — so this deliberately allocates nothing it cannot use:
 * `serializerForAssociatedObject` returns `options.serializer` before resolving anything when the
 * association declares its own serializer, and in that case there is no resolution to describe.
 * Callers build this once per rendered association and share it across every element.
 *
 * The renderer holds no serializer object, so the edge carries no `declaredBy` — see
 * `SerializerResolutionContext`.
 */
function renderTimeResolutionContext(
  options: InternalAnyRendersOneOrManyOpts,
  type: SerializerResolutionEdge['type'],
  associationName: string
): SerializerResolutionContext | undefined {
  if (options.serializer) return undefined
  return { edge: { type, associationName } }
}
