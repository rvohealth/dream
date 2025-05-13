import round from '../helpers/round.js'
import snakeify from '../helpers/snakeify.js'
import { ViewModel } from '../types/dream.js'
import inferSerializerFromDreamOrViewModel from './helpers/inferSerializerFromDreamOrViewModel.js'
import { DreamSerializerBuilder } from './index.js'

export default class SerializerRenderer {
  private _casing: 'camel' | 'snake' = 'camel'

  constructor(private serializer: DreamSerializerBuilder<any, any, any>) {}

  public casing(casing: 'camel' | 'snake') {
    this._casing = casing

    return this
  }

  private get renderedAttributes() {
    const $data = this.serializer['$data']
    if (!$data) return null
    const $passthroughData = this.serializer['$passthroughData']
    let renderedAttributes: Record<string, any> = {}

    renderedAttributes = this.serializer['attributes'].reduce((accumulator, attribute) => {
      const value = $data[attribute.name]
      const precision = attribute.renderOptions?.precision
      accumulator[this.setCase(attribute.name)] =
        typeof value === 'number' && typeof precision === 'number' ? round(value, precision) : value
      return accumulator
    }, renderedAttributes)

    renderedAttributes = this.serializer['delegatedAttributes'].reduce((accumulator, attribute) => {
      const target = $data[attribute.targetName]
      const value = target[attribute.name]
      const precision = attribute.renderOptions?.precision
      accumulator[this.setCase(attribute.name)] =
        typeof value === 'number' && typeof precision === 'number' ? round(value, precision) : value
      return accumulator
    }, renderedAttributes)

    renderedAttributes = this.serializer['attributeFunctions'].reduce((accumulator, attribute) => {
      accumulator[this.setCase(attribute.name)] = attribute.fn($data, $passthroughData)
      return accumulator
    }, renderedAttributes)

    renderedAttributes = this.serializer['rendersManys'].reduce((accumulator, attribute) => {
      const values = $data[attribute.name]
      accumulator[this.setCase(attribute.name)] = (values as ViewModel[]).map(value => {
        const serializer = inferSerializerFromDreamOrViewModel(value)(value as any, $passthroughData)
        const serializerRenderer = new SerializerRenderer(serializer)
        return serializerRenderer.renderedAttributes
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
