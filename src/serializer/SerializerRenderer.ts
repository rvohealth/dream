import round from '../helpers/round.js'
import { NamedDreamSerializerBuilder } from './index.js'

export default class SerializerRenderer {
  constructor(private serializer: NamedDreamSerializerBuilder<any, any, any>) {}

  private get renderedAttributes() {
    const $data = this.serializer['$data']
    if (!$data) return null

    return this.serializer['attributes'].reduce((accumulator, attribute) => {
      const value = $data[attribute.name]
      const precision = attribute.renderOptions?.precision
      accumulator[attribute.name] =
        typeof value === 'number' && typeof precision === 'number' ? round(value, precision) : value
      return accumulator
    }, {} as any)
  }

  private get renderedAttributeFunctions() {
    const $data = this.serializer['$data']
    if (!$data) return null
    const $passthroughData = this.serializer['$passthroughData']

    return this.serializer['attributeFunctions'].reduce((accumulator, attribute) => {
      accumulator[attribute.name] = attribute.fn($data, $passthroughData)
      return accumulator
    }, {} as any)
  }
}
