import round from '../helpers/round.js'
import snakeify from '../helpers/snakeify.js'
import { NamedDreamSerializerBuilder } from './index.js'

export default class SerializerRenderer {
  private _casing: 'camel' | 'snake' = 'camel'

  constructor(private serializer: NamedDreamSerializerBuilder<any, any, any>) {}

  public casing(casing: 'camel' | 'snake') {
    this._casing = casing

    return this
  }

  private get renderedAttributes() {
    const $data = this.serializer['$data']
    if (!$data) return null

    return this.serializer['attributes'].reduce((accumulator, attribute) => {
      const value = $data[attribute.name]
      const precision = attribute.renderOptions?.precision
      accumulator[this.setCase(attribute.name)] =
        typeof value === 'number' && typeof precision === 'number' ? round(value, precision) : value
      return accumulator
    }, {} as any)
  }

  private get renderedAttributeFunctions() {
    const $data = this.serializer['$data']
    if (!$data) return null
    const $passthroughData = this.serializer['$passthroughData']

    return this.serializer['attributeFunctions'].reduce((accumulator, attribute) => {
      accumulator[this.setCase(attribute.name)] = attribute.fn($data, $passthroughData)
      return accumulator
    }, {} as any)
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
