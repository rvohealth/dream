import round from '../helpers/round.js'
import snakeify from '../helpers/snakeify.js'
import { ViewModel } from '../types/dream.js'
import { DecimalRenderOption } from '../types/serializer.js'
import inferSerializerFromDreamOrViewModel from './helpers/inferSerializerFromDreamOrViewModel.js'
import { DreamSerializerBuilder, SimpleObjectSerializerBuilder, ViewModelSerializerBuilder } from './index.js'

export default class SerializerRenderer {
  private _casing: 'camel' | 'snake' = 'camel'
  private serializer: DreamSerializerBuilder<any, any, any>

  constructor(
    serializer:
      | DreamSerializerBuilder<any, any, any>
      | ViewModelSerializerBuilder<any, any, any>
      | SimpleObjectSerializerBuilder<any, any>
  ) {
    this.serializer = serializer as DreamSerializerBuilder<any, any, any>
  }

  public casing(casing: 'camel' | 'snake') {
    this._casing = casing

    return this
  }

  public render() {
    const $data = this.serializer['$data']
    if (!$data) return null
    const $passthroughData = this.serializer['$passthroughData']
    let renderedAttributes: Record<string, any> = {}

    renderedAttributes = this.serializer['attributes'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.options?.as ?? attribute.name)
      const value = $data[attribute.name]
      const precision = attribute.options?.precision
      accumulator[outputAttributeName] =
        typeof value === 'number' && typeof precision === 'number' ? round(value, precision) : value
      return accumulator
    }, renderedAttributes)

    renderedAttributes = this.serializer['delegatedAttributes'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.options?.as ?? attribute.name)
      const target = $data[attribute.targetName]
      const value = target[attribute.name]
      const precision = (attribute.options as DecimalRenderOption)?.precision
      accumulator[outputAttributeName] =
        typeof value === 'number' && typeof precision === 'number' ? round(value, precision) : value
      return accumulator
    }, renderedAttributes)

    renderedAttributes = this.serializer['customAttributes'].reduce((accumulator, attribute) => {
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
      if (attribute.options.flatten) {
        return {
          ...accumulator,
          ...serializerRenderer.render(),
        }
      } else {
        accumulator[outputAttributeName] = serializerRenderer.render()
        return accumulator
      }
    }, renderedAttributes)

    renderedAttributes = this.serializer['rendersManys'].reduce((accumulator, attribute) => {
      const outputAttributeName = this.setCase(attribute.options?.as ?? attribute.name)
      const values = $data[attribute.name]

      accumulator[outputAttributeName] = (values as ViewModel[]).map(value => {
        const serializer =
          attribute.options.serializer?.() ??
          inferSerializerFromDreamOrViewModel(value, attribute.options.serializerKey)
        const serializerRenderer = new SerializerRenderer(serializer(value as any, $passthroughData))
        return serializerRenderer.render()
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

// function unknownTypeToIsoDateString(date: unknown): string | null | undefined {
//   if (date === undefined) return undefined
//   if (date === null) return null
//   if (date instanceof CalendarDate || date instanceof DateTime) return date.toISODate()
//   return date as string
// }

// function unknownTypeToIsoDatetimeString(dateTime: unknown): string | null | undefined {
//   if (dateTime === undefined) return undefined
//   if (dateTime === null) return null
//   if (dateTime instanceof CalendarDate) return DateTime.fromISO(dateTime.toISO()!).toISO()
//   if (dateTime instanceof DateTime) return dateTime.toISO()
//   return dateTime as string
// }

// function unknownTypeToDecimal(
//   decimalOrString: string | number | undefined | null,
//   precision: RoundingPrecision | undefined
// ): number | null | undefined {
//   if (decimalOrString === undefined) return undefined
//   if (decimalOrString === null) return null
//   const decimalValue = typeof decimalOrString === 'number' ? decimalOrString : Number(decimalOrString)
//   return precision === undefined ? decimalValue : round(decimalValue, precision)
// }
