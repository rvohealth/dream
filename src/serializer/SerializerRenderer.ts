import Dream from '../Dream.js'
import round from '../helpers/round.js'
import snakeify from '../helpers/snakeify.js'
import expandStiSerializersInDreamsOrSerializers from '../openapi/expandStiSerializersInDreamsOrSerializers.js'
import { ViewModel } from '../types/dream.js'
import {
  InternalAnyRendersOneOrManyOpts,
  NonAutomaticSerializerAttributeOptionsWithPossibleDecimalRenderOption,
} from '../types/serializer.js'
import inferSerializerFromDreamOrViewModel, {
  inferSerializerFromDreamClassOrViewModelClass,
} from './helpers/inferSerializerFromDreamOrViewModel.js'
import { DreamSerializerBuilder, SimpleObjectSerializerBuilder, ViewModelSerializerBuilder } from './index.js'

export default class SerializerRenderer {
  private _casing: 'camel' | 'snake' = 'camel'
  private serializerBuilder: DreamSerializerBuilder<any, any, any> | null
  private passthroughData: object | undefined

  constructor(
    serializerBuilder:
      | DreamSerializerBuilder<any, any, any>
      | ViewModelSerializerBuilder<any, any, any>
      | SimpleObjectSerializerBuilder<any, any>
      | null
      | undefined,
    passthroughData?: object
  ) {
    this.serializerBuilder = (serializerBuilder ?? null) as DreamSerializerBuilder<any, any, any> | null
    this.passthroughData = passthroughData
  }

  public casing(casing: 'camel' | 'snake') {
    this._casing = casing

    return this
  }

  public render() {
    if (this.serializerBuilder === null) return null
    const data = this.serializerBuilder['data']
    if (!data) return null

    // passthroughData will be passed into the SerializerRenderer by Psychic, but the user may also pass
    // passthrough data into an Serializer explicitly. We apply both, prioritizing values from the
    // passthroughData passed into the Serializer
    const passthroughData = { ...this.passthroughData, ...this.serializerBuilder['passthroughData'] }

    let renderedAttributes: Record<string, any> = {}

    renderedAttributes = this.serializerBuilder['attributes'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.options?.as ?? attribute.name)
      const value = data[attribute.name]
      accumulator[outputAttributeName] = applyRenderingOptionsToAttribute(value, attribute.options)

      return accumulator
    }, renderedAttributes)

    renderedAttributes = this.serializerBuilder['delegatedAttributes'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.options?.as ?? attribute.name)
      const target = data[attribute.targetName]
      const value = target[attribute.name]
      accumulator[outputAttributeName] = applyRenderingOptionsToAttribute(value, attribute.options)
      return accumulator
    }, renderedAttributes)

    renderedAttributes = this.serializerBuilder['customAttributes'].reduce((accumulator, attribute) => {
      // customAttributes don't support `as` since they are already custom and there is nothing to override
      const outputAttributeName = this.setCase(attribute.name)
      // customAttributes don't support rendering options since the custom function should handle all
      // manipulation of the value
      accumulator[outputAttributeName] = attribute.fn(data, passthroughData)
      return accumulator
    }, renderedAttributes)

    renderedAttributes = this.serializerBuilder['rendersOnes'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.options?.as ?? attribute.name)
      const value = data[attribute.name]

      const serializer = serializerForAssociatedModel(data, value, attribute.name, attribute.options)

      // Normally, would only need to pass passthroughData into the SerializerRenderer—
      // since not every Serializer handles passthrough data—
      // however, since serializers are functions, it is possible for someone to build
      // a serializer that leverages the passthroughData being passed in prior to passing it
      // into the serializer builder, so we pass passthroughData into _both_ the SerializerRenderer
      // and the SerializerRenderer
      const serializerRenderer = new SerializerRenderer(
        serializer?.(attribute.options.flatten ? (value ?? {}) : value, passthroughData),
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

    renderedAttributes = this.serializerBuilder['rendersManys'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.options?.as ?? attribute.name)
      const values = data[attribute.name]

      accumulator[outputAttributeName] = (values as ViewModel[]).map(value => {
        const serializer = serializerForAssociatedModel(data, value, attribute.name, attribute.options)

        // Normally, would only need to pass passthroughData into the SerializerRenderer—
        // since not every Serializer handles passthrough data—
        // however, since serializers are functions, it is possible for someone to build
        // a serializer that leverages the passthroughData being passed in prior to passing it
        // into the serializer builder, so we pass passthroughData into _both_ the SerializerRenderer
        // and the SerializerRenderer
        const serializerRenderer = new SerializerRenderer(
          serializer?.(value, passthroughData),
          passthroughData
        )
        return serializerRenderer.render()
      })

      return accumulator
    }, renderedAttributes)

    return renderedAttributes
  }

  private setCase(attr: string) {
    switch (this._casing) {
      case 'camel':
        return attr
      case 'snake':
        return snakeify(attr)
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
  const precision = options?.precision
  if (typeof value === 'number' && typeof precision === 'number') return round(value, precision)
  return value ?? null
}

function serializerForAssociatedModel<
  ObjectType extends Dream | ViewModel,
  AssociatedObjectType extends Dream | ViewModel,
>(
  object: ObjectType,
  associatedObject: AssociatedObjectType,
  associationName: string,
  options: InternalAnyRendersOneOrManyOpts
) {
  if (options.serializerCallback) return options.serializerCallback()
  if (associatedObject) return inferSerializerFromDreamOrViewModel(associatedObject, options.serializerKey)
  if (!(object as Dream).isDreamInstance) return null

  const dream = object as Dream
  const association = dream['getAssociationMetadata'](associationName)
  const associatedClasses = expandStiSerializersInDreamsOrSerializers(association!.modelCB())
  const associatedClass = associatedClasses[0]
  if (!associatedClass) return null

  return inferSerializerFromDreamClassOrViewModelClass(associatedClass, options.serializerKey)
}
