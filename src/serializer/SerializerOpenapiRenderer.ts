import Dream from '../Dream.js'
import { openapiShorthandPrimitiveTypes } from '../dream/constants.js'
import snakeify from '../helpers/snakeify.js'
import openapiShorthandToOpenapi from '../openapi/openapiShorthandToOpenapi.js'
import { OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from '../types/openapi.js'
import { dreamColumnOpenapiShape } from './helpers/dreamAttributeOpenapiShape.js'
import { DreamSerializerBuilder } from './index.js'

export default class SerializerOpenapiRenderer {
  private _casing: 'camel' | 'snake' = 'camel'

  constructor(
    private serializer: ($data?: any, $passthroughData?: any) => DreamSerializerBuilder<any, any, any>
  ) {}

  public get serializerName() {
    const openapiName = (this.serializer as unknown as { openapiName: string }).openapiName
    if (!openapiName)
      throw new Error(`openapiName is not set on serializer:\n\n${this.serializer.toString()}`)
    return openapiName
  }

  private _serializerBuilder: DreamSerializerBuilder<any, any, any>
  private get serializerBuilder(): DreamSerializerBuilder<any, any, any> {
    if (this._serializerBuilder) return this._serializerBuilder
    this._serializerBuilder = this.serializer()
    return this._serializerBuilder
  }

  public casing(casing: 'camel' | 'snake') {
    this._casing = casing

    return this
  }

  public get renderedOpenapi() {
    const openapiShape = {
      type: this.serializerBuilder['_maybeNull'] ? ['object', 'null'] : 'object',
      required: [
        ...this.serializerBuilder['attributes'].map(obj => obj.name),
        ...this.serializerBuilder['delegatedAttributes'].map(obj => obj.name),
        ...this.serializerBuilder['attributeFunctions'].map(obj => obj.name),
        ...this.serializerBuilder['rendersOnes'].map(obj => obj.name),
        ...this.serializerBuilder['rendersManys'].map(obj => obj.name),
      ],
    }

    return openapiShape
  }

  private get renderedOpenapiAttributes(): Record<string, OpenapiSchemaBodyShorthand> {
    const $typeForOpenapi = this.serializerBuilder['$typeForOpenapi']
    const dreamClass = $typeForOpenapi as typeof Dream
    let renderedOpenapi: Record<string, OpenapiSchemaBodyShorthand> = {}

    renderedOpenapi = [
      ...this.serializerBuilder['attributes'],
      ...this.serializerBuilder['attributeFunctions'],
    ].reduce((accumulator, attribute) => {
      const openapi = attribute.openapi

      accumulator[this.setCase(attribute.name)] = dreamClass?.isDream
        ? dreamColumnOpenapiShape(dreamClass, attribute.name, openapi)
        : openapiShorthandPrimitiveTypes.includes(openapi as any)
          ? openapiShorthandToOpenapi(openapi as OpenapiShorthandPrimitiveTypes)
          : (openapi as OpenapiSchemaBodyShorthand)
      return accumulator
    }, renderedOpenapi)

    renderedOpenapi = this.serializerBuilder['delegatedAttributes'].reduce((accumulator, attribute) => {
      const openapi = attribute.openapi
      accumulator[this.setCase(attribute.name)] = openapiShorthandPrimitiveTypes.includes(openapi as any)
        ? openapiShorthandToOpenapi(openapi as OpenapiShorthandPrimitiveTypes)
        : (openapi as OpenapiSchemaBodyShorthand)
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
