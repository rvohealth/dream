import Dream from '../Dream.js'
import RendersManyMustReceiveArray from '../errors/serializers/RendersManyMustReceiveArray.js'
import CalendarDate from '../helpers/CalendarDate.js'
import { DateTime } from '../helpers/DateTime.js'
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
import DreamSerializerBuilder from './builders/DreamSerializerBuilder.js'
import ObjectSerializerBuilder from './builders/ObjectSerializerBuilder.js'
import inferSerializerFromDreamOrViewModel, {
  inferSerializersFromDreamClassOrViewModelClass,
} from './helpers/inferSerializerFromDreamOrViewModel.js'

export default class SerializerRenderer {
  private casing: SerializerCasing
  private serializerBuilder: DreamSerializerBuilder<any, any, any> | null
  private passthroughData: object

  constructor(
    serializerBuilder:
      | DreamSerializerBuilder<any, any, any>
      | ObjectSerializerBuilder<any, any>
      | null
      | undefined,
    passthroughData: object = {},
    {
      casing = 'camel',
    }: {
      casing?: SerializerCasing
    } = {}
  ) {
    this.serializerBuilder = (serializerBuilder ?? null) as DreamSerializerBuilder<any, any, any> | null
    this.passthroughData = passthroughData
    this.casing = casing
  }

  public render() {
    if (this.serializerBuilder === null) return null
    const data = this.serializerBuilder['data']
    if (!data) return null

    // passthroughData will be passed into the SerializerRenderer by Psychic, but the user may
    // be explicitly calling the serializer, in which case, passthrough data will need to be
    // sent into the serializer itself
    const passthroughData = { ...this.passthroughData, ...this.serializerBuilder['passthroughData'] }

    let renderedAttributes: Record<string, any> = {}

    ////////////////
    // attributes //
    ////////////////
    renderedAttributes = this.serializerBuilder['attributes'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.options?.as ?? attribute.name)
      const value = data[attribute.name]
      accumulator[outputAttributeName] = applyRenderingOptionsToAttribute(value, attribute.options)

      return accumulator
    }, renderedAttributes)
    /////////////////////
    // end: attributes //
    /////////////////////

    /////////////////////////
    // delegatedAttributes //
    /////////////////////////
    renderedAttributes = this.serializerBuilder['delegatedAttributes'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.options?.as ?? attribute.name)
      const target = data[attribute.targetName]
      const value = target[attribute.name]
      accumulator[outputAttributeName] = applyRenderingOptionsToAttribute(value, attribute.options)
      return accumulator
    }, renderedAttributes)
    //////////////////////////////
    // end: delegatedAttributes //
    //////////////////////////////

    //////////////////////
    // customAttributes //
    //////////////////////
    renderedAttributes = this.serializerBuilder['customAttributes'].reduce((accumulator, attribute) => {
      // customAttributes don't support `as` since they are already custom and there is nothing to override
      const outputAttributeName = this.setCase(attribute.name)
      // customAttributes don't support rendering options since the custom function should handle all
      // manipulation of the value

      if (attribute.options.flatten) {
        return {
          ...accumulator,
          ...applyRenderingOptionsToAttribute(attribute.fn(), {}),
        }
      } else {
        accumulator[outputAttributeName] = applyRenderingOptionsToAttribute(attribute.fn(), {})
        return accumulator
      }
    }, renderedAttributes)
    ///////////////////////////
    // end: customAttributes //
    ///////////////////////////

    /////////////////
    // rendersOnes //
    /////////////////
    renderedAttributes = this.serializerBuilder['rendersOnes'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.options.as ?? attribute.name)
      const associatedObject = data[attribute.name]

      let serializer: DreamModelSerializerType | SimpleObjectSerializerType | null

      if (associatedObject) {
        serializer = serializerForAssociatedObject(associatedObject, attribute.options)
      } else {
        serializer = serializerForAssociatedClass(data, attribute.name, attribute.options)
      }

      const serializerRenderer = new SerializerRenderer(
        serializer?.(
          attribute.options.flatten ? (associatedObject ?? {}) : associatedObject,
          // passthrough data going into the serializer is the argument that gets
          // used in the custom attribute callback function
          passthroughData
        ),
        // passthrough data must be passed both into the serializer and the SerializerRenderer
        // because, if the serializer does accept passthrough data, then passing it in is how
        // it gets into the serializer, but if it does not accept passthrough data, and therefore
        // does not pass it into the call to DreamSerializer/ObjectSerializer,
        // then it would be lost to serializers rendered via rendersOne/Many, and SerializerRenderer
        // handles passing its passthrough data into those
        passthroughData
      )

      if (attribute.options.flatten) {
        return {
          ...accumulator,
          ...serializerRenderer.render(),
        }
      } else {
        accumulator[outputAttributeName] = serializerRenderer.render()
        return accumulator
      }
    }, renderedAttributes)
    //////////////////////
    // end: rendersOnes //
    //////////////////////

    //////////////////
    // rendersManys //
    //////////////////
    renderedAttributes = this.serializerBuilder['rendersManys'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.options?.as ?? attribute.name)
      const associatedObjects = data[attribute.name]

      if (!associatedObjects) throw new RendersManyMustReceiveArray(attribute, associatedObjects)

      accumulator[outputAttributeName] = (associatedObjects as ViewModel[]).map(associatedObject => {
        const serializer = serializerForAssociatedObject(associatedObject, attribute.options)

        const serializerRenderer = new SerializerRenderer(
          // passthrough data going into the serializer is the argument that gets
          // used in the custom attribute callback function
          serializer?.(associatedObject, passthroughData),
          // passthrough data must be passed both into the serializer and the SerializerRenderer
          // because, if the serializer does accept passthrough data, then passing it in is how
          // it gets into the serializer, but if it does not accept passthrough data, and therefore
          // does not pass it into the call to DreamSerializer/ObjectSerializer,
          // then it would be lost to serializers rendered via rendersOne/Many, and SerializerRenderer
          // handles passing its passthrough data into those
          passthroughData
        )
        return serializerRenderer.render()
      })

      return accumulator
    }, renderedAttributes)
    ///////////////////////
    // end: rendersManys //
    ///////////////////////

    return renderedAttributes
  }

  private setCase(attr: string) {
    switch (this.casing) {
      case 'camel':
        return attr
      case 'snake':
        return snakeify(attr)
      default: {
        // protection so that if a new Casing is ever added, this will throw a type error at build time
        const _never: never = this.casing
        throw new Error(`Unhandled Casing: ${_never as string}`)
      }
    }
  }
}

function applyRenderingOptionsToAttribute(
  value: any,
  options:
    | NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption
    | Partial<NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption>
    | undefined
) {
  if (Array.isArray(value)) return value.map(val => _applyRenderingOptionsToAttribute(val, options))
  return _applyRenderingOptionsToAttribute(value, options)
}

function _applyRenderingOptionsToAttribute(
  value: any,
  options:
    | NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption
    | Partial<NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption>
    | undefined
) {
  if (value instanceof DateTime) return value.toISO()
  if (value instanceof CalendarDate) return value.toISO()
  const precision = options?.precision
  if (typeof value === 'number' && typeof precision === 'number') return round(value, precision)
  return value ?? null
}

function serializerForAssociatedObject<ObjectType extends Dream | ViewModel>(
  associatedObject: ObjectType,
  options: InternalAnyRendersOneOrManyOpts
): DreamModelSerializerType | SimpleObjectSerializerType | null {
  if (options.serializerCallback) return options.serializerCallback()
  return inferSerializerFromDreamOrViewModel(associatedObject, options.serializerKey)
}

/**
 * Only used when flatten: true, and the associated model is null, in which case,
 * we need something to determine the keys that will be flattened into the
 * rendering serializer
 */
function serializerForAssociatedClass<ObjectType extends Dream | ViewModel>(
  object: ObjectType,
  associationName: string,
  options: InternalAnyRendersOneOrManyOpts
): DreamModelSerializerType | SimpleObjectSerializerType | null {
  if (options.serializerCallback) return options.serializerCallback()
  if (!(object as Dream).isDreamInstance) return null

  const dream = object as Dream
  const association = dream['getAssociationMetadata'](associationName)
  const associatedClasses = association!.modelCB()
  const associatedClass = Array.isArray(associatedClasses) ? associatedClasses[0] : associatedClasses
  return inferSerializersFromDreamClassOrViewModelClass(associatedClass, options.serializerKey)[0] ?? null
}
