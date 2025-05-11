import { CalendarDate } from '../../../../src/index.js'
import ObjectSerializer from '../../../../src/serializer/ObjectSerializer.js'
import SerializerOpenapiRenderer from '../../../../src/serializer/SerializerOpenapiRenderer.js'
import SerializerRenderer from '../../../../src/serializer/SerializerRenderer.js'

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

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      email: 'abc',
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      email: {
        type: 'string',
      },
    })
  })

  it('supports customizing the name of the thing rendered', () => {
    const MySerializer = (data: User) =>
      ObjectSerializer(data).attribute('email', { openapi: 'string', as: 'email2' })

    const serializer = MySerializer({ email: 'abc', password: '123' })

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      email2: 'abc',
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      email2: {
        type: 'string',
      },
    })
  })

  it('can specify OpenAPI description', () => {
    const MySerializer = (data: User) =>
      ObjectSerializer(data).attribute('email', {
        openapi: { type: 'string', description: 'This is an email' },
      })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      email: {
        type: 'string',
        description: 'This is an email',
      },
    })
  })

  context('when serializing null', () => {
    it('renderedAttributes is null', () => {
      const MySerializer = (data: User | null) =>
        ObjectSerializer(data).attribute('email', { openapi: 'string' })

      const serializer = MySerializer(null)
      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer.render()).toBeNull()

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        email: {
          type: 'string',
        },
      })
    })
  })

  it('can render attributes from serializers that "extend" other serializers', () => {
    const BaseSerializer = (data: User) =>
      ObjectSerializer(data).attribute('name', { openapi: ['string', 'null'] })
    const MySerializer = (data: User) => BaseSerializer(data).attribute('email', { openapi: 'string' })

    const serializer = MySerializer({ name: 'Snoopy', email: 'abc', password: '123' })

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      name: 'Snoopy',
      email: 'abc',
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      name: {
        type: ['string', 'null'],
      },
      email: {
        type: 'string',
      },
    })
  })

  context('numeric/decimal with precision', () => {
    it('rounds to specified precision', () => {
      const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
        ObjectSerializer(data).attribute('volume', { openapi: ['decimal', 'null'], precision: 1 })
      const serializer = MySerializer({ volume: 7.777 })
      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer.render()).toEqual({
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
        const serializerRenderer = new SerializerRenderer(serializer, {}, { casing: 'snake' })
        expect(serializerRenderer.render()).toEqual({
          required_nicknames: ['Chuck'],
        })

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer, { casing: 'snake' })
        expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
          required_nicknames: { type: 'array', items: { type: 'string' } },
        })
      })
    })

    context('camel casing is specified', () => {
      it('renders all attribute keys in camel case', () => {
        const serializer = MySerializer({ requiredNicknames: ['Chuck'] })
        const serializerRenderer = new SerializerRenderer(serializer, {}, { casing: 'camel' })
        expect(serializerRenderer.render()).toEqual({
          requiredNicknames: ['Chuck'],
        })

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer, { casing: 'camel' })
        expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual(
          expect.objectContaining({
            requiredNicknames: { type: 'array', items: { type: 'string' } },
          })
        )
      })
    })
  })
})
