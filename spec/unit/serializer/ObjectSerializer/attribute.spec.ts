import { CalendarDate } from '../../../../src/index.js'
import ObjectSerializer from '../../../../src/serializer/ObjectSerializer.js'

interface User {
  email: string
  password: string
  name?: string
  birthdate?: CalendarDate
}

interface ModelForOpenapiTypeSpecs {
  volume?: number
  requiredNicknames?: string[]
}

describe('ObjectSerializer attributes', () => {
  it('can render attributes', () => {
    const MySerializer = (data: User) => ObjectSerializer(data).attribute('email', { openapi: 'string' })

    const serializer = MySerializer({ email: 'abc', password: '123' })

    expect(serializer.render()).toEqual({
      email: 'abc',
    })
  })

  it('supports customizing the name of the thing rendered', () => {
    const MySerializer = (data: User) =>
      ObjectSerializer(data).attribute('email', { openapi: 'string', as: 'email2' })

    const serializer = MySerializer({ email: 'abc', password: '123' })

    expect(serializer.render()).toEqual({
      email2: 'abc',
    })
  })

  context('when serializing null', () => {
    it('renderedAttributes is null', () => {
      const MySerializer = (data: User | null) =>
        ObjectSerializer(data).attribute('email', { openapi: 'string' })

      const serializer = MySerializer(null)
      expect(serializer.render()).toBeNull()
    })
  })

  it('can render attributes from serializers that "extend" other serializers', () => {
    const BaseSerializer = (data: User) =>
      ObjectSerializer(data).attribute('name', { openapi: ['string', 'null'] })
    const MySerializer = (data: User) => BaseSerializer(data).attribute('email', { openapi: 'string' })

    const serializer = MySerializer({ name: 'Snoopy', email: 'abc', password: '123' })

    expect(serializer.render()).toEqual({
      name: 'Snoopy',
      email: 'abc',
    })
  })

  context('numeric/decimal with precision', () => {
    it('rounds to specified precision', () => {
      const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
        ObjectSerializer(data).attribute('volume', { openapi: ['decimal', 'null'], precision: 1 })
      const serializer = MySerializer({ volume: 7.777 })
      expect(serializer.render()).toEqual({
        volume: 7.8,
      })
    })
  })

  context('with casing specified', () => {
    const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
      ObjectSerializer(data).attribute('requiredNicknames', { openapi: 'string[]' })

    context('snake casing is specified', () => {
      it('renders all attribute keys in snake case', () => {
        const serializer = MySerializer({ requiredNicknames: ['Chuck'] })
        expect(serializer.render({}, { casing: 'snake' })).toEqual({
          required_nicknames: ['Chuck'],
        })
      })
    })

    context('camel casing is specified', () => {
      it('renders all attribute keys in camel case', () => {
        const serializer = MySerializer({ requiredNicknames: ['Chuck'] })
        expect(serializer.render({}, { casing: 'camel' })).toEqual({
          requiredNicknames: ['Chuck'],
        })
      })
    })
  })
})
