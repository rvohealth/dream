import Dream from '../Dream.js'
import { openapiShorthandPrimitiveTypes } from '../dream/constants.js'
import openapiShorthandToOpenapi from '../openapi/openapiShorthandToOpenapi.js'
import { OpenapiShorthandPrimitiveTypes } from '../types/openapi.js'
import { dreamAttributeOpenapiShape } from './helpers/dreamAttributeOpenapiShape.js'
import { DreamSerializerBuilder } from './index.js'

export default class SerializerOpenapiRenderer {
  constructor(private serializer: DreamSerializerBuilder<any, any, any>) {}

  public get renderedOpenapi() {
    const openapiShape = {
      type: this.serializer['_maybeNull'] ? ['object', 'null'] : 'object',
    }

    return openapiShape
  }

  private get renderedOpenapiAttributes() {
    const $typeForOpenapi = this.serializer['$typeForOpenapi']
    const dreamClass = $typeForOpenapi as typeof Dream

    return this.serializer['attributes'].reduce((accumulator, attribute) => {
      const openapi = attribute.openapiAndRenderOptions
      accumulator[attribute.name] = dreamClass?.isDream
        ? dreamAttributeOpenapiShape(dreamClass, attribute.name)
        : openapiShorthandPrimitiveTypes.includes(openapi as any)
          ? openapiShorthandToOpenapi(openapi as OpenapiShorthandPrimitiveTypes)
          : openapi
      return accumulator
    }, {} as any)
  }

  private get renderedOpenapiAttributeFunctions() {
    return this.serializer['attributeFunctions'].reduce((accumulator, attribute) => {
      const openapi = attribute.openapiAndRenderOptions
      accumulator[attribute.name] = openapiShorthandPrimitiveTypes.includes(openapi as any)
        ? openapiShorthandToOpenapi(openapi as OpenapiShorthandPrimitiveTypes)
        : openapi
      return accumulator
    }, {} as any)
  }
}
