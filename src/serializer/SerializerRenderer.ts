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
      const outputAttributeName = this.setCase(attribute.renderOptions?.as ?? attribute.name)
      const value = $data[attribute.name]
      const precision = attribute.renderOptions?.precision
      accumulator[outputAttributeName] =
        typeof value === 'number' && typeof precision === 'number' ? round(value, precision) : value
      return accumulator
    }, renderedAttributes)

    renderedAttributes = this.serializer['delegatedAttributes'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.renderOptions?.as ?? attribute.name)
      const target = $data[attribute.targetName]
      const value = target[attribute.name]
      const precision = attribute.renderOptions?.precision
      accumulator[outputAttributeName] =
        typeof value === 'number' && typeof precision === 'number' ? round(value, precision) : value
      return accumulator
    }, renderedAttributes)

    renderedAttributes = this.serializer['attributeFunctions'].reduce((accumulator, attribute) => {
      accumulator[this.setCase(attribute.name)] = attribute.fn($data, $passthroughData)
      return accumulator
    }, renderedAttributes)

    renderedAttributes = this.serializer['rendersOnes'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.options?.as ?? attribute.name)
      const value = $data[attribute.name]

      const serializer =
        attribute.options.serializer?.() ??
        inferSerializerFromDreamOrViewModel(value, attribute.options.serializerKey)

      const serializerRenderer = new SerializerRenderer(serializer(value, $passthroughData))
      accumulator[outputAttributeName] = serializerRenderer.renderedAttributes

      return accumulator
    }, renderedAttributes)

    renderedAttributes = this.serializer['rendersManys'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.options?.as ?? attribute.name)
      const values = $data[attribute.name]

      accumulator[outputAttributeName] = (values as ViewModel[]).map(value => {
        const serializer =
          attribute.options.serializer?.() ??
          inferSerializerFromDreamOrViewModel(value, attribute.options.serializerKey)
        const serializerRenderer = new SerializerRenderer(serializer(value as any, $passthroughData))
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
