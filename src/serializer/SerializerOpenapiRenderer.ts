import Dream from '../Dream.js'
import { isOpenapiShorthand } from '../dream/constants.js'
import snakeify from '../helpers/snakeify.js'
import uniq from '../helpers/uniq.js'
import { dreamColumnOpenapiShape } from '../openapi/dreamAttributeOpenapiShape.js'
import expandStiSerializersInDreamsOrSerializers from '../openapi/expandStiSerializersInDreamsOrSerializers.js'
import openapiShorthandToOpenapi from '../openapi/openapiShorthandToOpenapi.js'
import { OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from '../types/openapi.js'
import { SerializerAttribute, SerializerRendersMany, SerializerType } from '../types/serializer.js'
import { inferSerializerFromDreamClassOrViewModelClass } from './helpers/inferSerializerFromDreamOrViewModel.js'
import { DreamSerializerBuilder } from './index.js'

export default class SerializerOpenapiRenderer {
  private _casing: 'camel' | 'snake' = 'camel'

  constructor(private serializer: SerializerType) {}

  public get serializerName() {
    const globalName = (this.serializer as unknown as { globalName: string }).globalName
    if (!globalName) throw new Error(`globalName is not set on serializer:\n\n${this.serializer.toString()}`)
    return globalName.replace(/\//g, '_')
  }

  private _serializerBuilder: DreamSerializerBuilder<any, any, any>
  private get serializerBuilder(): DreamSerializerBuilder<any, any, any> {
    if (this._serializerBuilder) return this._serializerBuilder
    this._serializerBuilder = this.serializer(undefined as any, undefined as any)
    return this._serializerBuilder
  }

  public casing(casing: 'camel' | 'snake') {
    this._casing = casing

    return this
  }

  public get renderedOpenapi(): OpenapiSchemaBodyShorthand {
    return {
      type: this.serializerBuilder['_maybeNull'] ? ['object', 'null'] : 'object',
      required: [
        ...this.serializerBuilder['attributes'].map(obj => obj.name),
        ...this.serializerBuilder['delegatedAttributes'].map(obj => obj.name),
        ...this.serializerBuilder['attributeFunctions'].map(obj => obj.name),
        ...this.serializerBuilder['rendersOnes'].map(obj => obj.name),
        ...this.serializerBuilder['rendersManys'].map(obj => obj.name),
      ],
      properties: this.renderedOpenapiAttributes,
    }
  }

  private get renderedOpenapiAttributes(): Record<string, OpenapiSchemaBodyShorthand> {
    const $typeForOpenapi = this.serializerBuilder['$typeForOpenapi']
    const dreamClass = $typeForOpenapi as typeof Dream
    let renderedOpenapi: Record<string, OpenapiSchemaBodyShorthand> = {}

    renderedOpenapi = [
      ...this.serializerBuilder['attributes'],
      ...this.serializerBuilder['attributeFunctions'],
    ].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(
        (attribute as SerializerAttribute<any>).renderOptions?.as ?? attribute.name
      )
      const openapi = attribute.openapi

      accumulator[outputAttributeName] = dreamClass?.isDream
        ? dreamColumnOpenapiShape(dreamClass, attribute.name, openapi)
        : isOpenapiShorthand(openapi)
          ? openapiShorthandToOpenapi(openapi as OpenapiShorthandPrimitiveTypes)
          : (openapi as OpenapiSchemaBodyShorthand)
      return accumulator
    }, renderedOpenapi)

    renderedOpenapi = this.serializerBuilder['delegatedAttributes'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.renderOptions?.as ?? attribute.name)
      const openapi = attribute.openapi
      accumulator[outputAttributeName] = isOpenapiShorthand(openapi)
        ? openapiShorthandToOpenapi(openapi as OpenapiShorthandPrimitiveTypes)
        : (openapi as OpenapiSchemaBodyShorthand)
      return accumulator
    }, renderedOpenapi)

    this.serializerBuilder['rendersOnes'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.options.as ?? attribute.name)
      accumulator[outputAttributeName] = associationOpenapi(attribute, dreamClass)
      return accumulator
    }, renderedOpenapi)

    this.serializerBuilder['rendersManys'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.options.as ?? attribute.name)
      accumulator[outputAttributeName] = {
        type: 'array',
        items: associationOpenapi(attribute, dreamClass),
      }

      return accumulator
    }, renderedOpenapi)

    return renderedOpenapi
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

function associationOpenapi(
  attribute: SerializerRendersMany<any, string>,
  dreamClass: typeof Dream
): OpenapiSchemaBodyShorthand {
  const serializerOverride = attribute.options.serializer?.()
  if (serializerOverride) {
    const customSerializerRefPath = attribute.openapi.customSerializerRefPath
    if (customSerializerRefPath) return { $ref: `#/components/schemas/${customSerializerRefPath}` }
    return new SerializerOpenapiRenderer(serializerOverride).renderedOpenapi
  }

  const associationMetadataMap = dreamClass['associationMetadataMap']()
  const association = associationMetadataMap[attribute.name]
  const associatedClassOrClasses = expandStiSerializersInDreamsOrSerializers(association!.modelCB())

  const serializersOpenapi = uniq(
    associatedClassOrClasses.map(associatedClass =>
      inferSerializerFromDreamClassOrViewModelClass(associatedClass, attribute.options.serializerKey)
    ),
    serializer => (serializer as any)['globalName']
  )

  if (serializersOpenapi.length === 0)
    throw new Error(`No serializer found to render  \`${dreamClass.sanitizedName}\` \`${attribute.name}\``)
  if (serializersOpenapi.length === 1) return serializerToRef(serializersOpenapi[0]!)

  return {
    anyOf: serializersOpenapi.map(serializer => serializerToRef(serializer)),
  }
}

function serializerToRef(serializer: SerializerType): OpenapiSchemaBodyShorthand {
  return {
    $ref: `#/components/schemas/${((serializer as any)['globalName'] ?? '').replace(/\//g, '_')}`,
  }
}
