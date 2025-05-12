import { DreamSerializerBuilder } from './index.js'

export default class SerializerRenderer {
  constructor(private serializer: DreamSerializerBuilder<any, any, any>) {}

  private get renderedAttributes() {
    const $data = this.serializer['$data']
    if (!$data) return null

    return this.serializer['attributes'].reduce((accumulator, attribute) => {
      accumulator[attribute.name] = $data[attribute.name]
      return accumulator
    }, {} as any)
  }

  private get renderedAttributeFunctions() {
    const $data = this.serializer['$data']
    if (!$data) return null

    return this.serializer['attributeFunctions'].reduce((accumulator, attribute) => {
      accumulator[attribute.name] = attribute.fn($data)
      return accumulator
    }, {} as any)
  }
}
