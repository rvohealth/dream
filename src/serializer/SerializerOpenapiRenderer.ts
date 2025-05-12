import Dream from '../Dream.js'
import { dreamAttributeOpenapiShape } from './decorators/helpers/dreamAttributeOpenapiShape.js'
import { DreamSerializerBuilder } from './index.js'

export default class SerializerOpenapiRenderer {
  constructor(private serializer: DreamSerializerBuilder<any, any, any>) {}

  public get renderedOpenapiAttributes() {
    const $typeForOpenapi = this.serializer['$typeForOpenapi']
    if (!$typeForOpenapi) return {}

    return this.serializer['attributes'].reduce((accumulator, attribute) => {
      const dreamClass = $typeForOpenapi as typeof Dream
      accumulator[attribute.name] = dreamClass?.isDream
        ? dreamAttributeOpenapiShape(dreamClass, attribute.name)
        : attribute.openapiAndRenderOptions
      return accumulator
    }, {} as any)
  }

  public get renderedAttributeFunctions() {
    const $data = this.serializer['$data']
    if (!$data) return null

    return this.serializer['attributeFunctions'].reduce((accumulator, attribute) => {
      accumulator[attribute.name] = attribute.fn($data)
      return accumulator
    }, {} as any)
  }
}
