import Dream from '../Dream.js'
import { dreamAttributeOpenapiShape } from './helpers/dreamAttributeOpenapiShape.js'
import { DreamSerializerBuilder } from './index.js'

export default class SerializerOpenapiRenderer {
  constructor(private serializer: DreamSerializerBuilder<any, any, any>) {}

  public get renderedOpenapi() {
    const openapiShape = {
      type: this.serializer['maybeNull'] ? ['object', 'null'] : 'object',
    }

    return openapiShape
  }

  private get renderedOpenapiAttributes() {
    const $typeForOpenapi = this.serializer['$typeForOpenapi']
    const dreamClass = $typeForOpenapi as typeof Dream

    return this.serializer['attributes'].reduce((accumulator, attribute) => {
      accumulator[attribute.name] = dreamClass?.isDream
        ? dreamAttributeOpenapiShape(dreamClass, attribute.name)
        : attribute.openapiAndRenderOptions
      return accumulator
    }, {} as any)
  }

  private get renderedOpenapiAttributeFunctions() {
    return this.serializer['attributeFunctions'].reduce((accumulator, attribute) => {
      accumulator[attribute.name] = attribute.openapiAndRenderOptions
      return accumulator
    }, {} as any)
  }
}
