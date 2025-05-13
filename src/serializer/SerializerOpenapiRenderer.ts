import Dream from '../Dream.js'
import { openapiShorthandPrimitiveTypes } from '../dream/constants.js'
import snakeify from '../helpers/snakeify.js'
import openapiShorthandToOpenapi from '../openapi/openapiShorthandToOpenapi.js'
import { OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from '../types/openapi.js'
import { dreamColumnOpenapiShape } from './helpers/dreamAttributeOpenapiShape.js'
import { NamedDreamSerializerBuilder } from './index.js'

export default class SerializerOpenapiRenderer {
  private _casing: 'camel' | 'snake' = 'camel'

  constructor(private serializer: NamedDreamSerializerBuilder<any, any, any>) {}

  public casing(casing: 'camel' | 'snake') {
    this._casing = casing

    return this
  }

  public get serializerName() {
    return this.serializer['serializerName']
  }

  public get renderedOpenapi() {
    const openapiShape = {
      type: this.serializer['_maybeNull'] ? ['object', 'null'] : 'object',
      required: [
        ...this.serializer['attributes'].map(obj => obj.name),
        ...this.serializer['delegatedAttributes'].map(obj => obj.name),
        ...this.serializer['attributeFunctions'].map(obj => obj.name),
        ...this.serializer['rendersOnes'].map(obj => obj.name),
        ...this.serializer['rendersManys'].map(obj => obj.name),
      ],
    }

    return openapiShape
  }

  private get renderedOpenapiAttributes(): Record<string, OpenapiSchemaBodyShorthand> {
    const $typeForOpenapi = this.serializer['$typeForOpenapi']
    const dreamClass = $typeForOpenapi as typeof Dream
    let renderedOpenapi: Record<string, OpenapiSchemaBodyShorthand> = {}

    renderedOpenapi = [...this.serializer['attributes'], ...this.serializer['attributeFunctions']].reduce(
      (accumulator, attribute) => {
        const openapi = attribute.openapi

        accumulator[this.setCase(attribute.name)] = dreamClass?.isDream
          ? dreamColumnOpenapiShape(dreamClass, attribute.name, openapi)
          : openapiShorthandPrimitiveTypes.includes(openapi as any)
            ? openapiShorthandToOpenapi(openapi as OpenapiShorthandPrimitiveTypes)
            : (openapi as OpenapiSchemaBodyShorthand)
        return accumulator
      },
      renderedOpenapi
    )

    renderedOpenapi = this.serializer['delegatedAttributes'].reduce((accumulator, attribute) => {
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
