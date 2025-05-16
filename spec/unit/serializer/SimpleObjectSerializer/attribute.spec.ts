import { CalendarDate } from '../../../../src/index.js'
import { SimpleObjectSerializer } from '../../../../src/serializer/index.js'
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

describe('SimpleObjectSerializer attributes', () => {
  it('can render Dream attributes', () => {
    const MySerializer = ($data: User) =>
      SimpleObjectSerializer($data).attribute('email', { openapi: 'string' })

    const serializer = MySerializer({ email: 'abc', password: '123' })

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      email: 'abc',
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      email: {
        type: 'string',
      },
    })

    expect(serializerOpenapiRenderer.renderedOpenapi).toEqual(
      expect.objectContaining({
        type: 'object',
        required: ['email'],
      })
    )
  })

  it('supports customizing the name of the thing rendered', () => {
    const MySerializer = ($data: User) =>
      SimpleObjectSerializer($data).attribute('email', { openapi: 'string', as: 'email2' })

    const serializer = MySerializer({ email: 'abc', password: '123' })

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      email2: 'abc',
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      email2: {
        type: 'string',
      },
    })
  })

  it('can specify OpenAPI description', () => {
    const MySerializer = ($data: User) =>
      SimpleObjectSerializer($data).attribute('email', {
        openapi: { type: 'string', description: 'This is an email' },
      })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      email: {
        type: 'string',
        description: 'This is an email',
      },
    })
  })

  context('when serializing null', () => {
    it('renderedAttributes is null', () => {
      const MySerializer = ($data: User | null) =>
        SimpleObjectSerializer($data).maybeNull().attribute('email', { openapi: 'string' })

      const serializer = MySerializer(null)
      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer.render()).toBeNull()

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
        email: {
          type: 'string',
        },
      })

      expect(serializerOpenapiRenderer.renderedOpenapi).toEqual(
        expect.objectContaining({
          type: ['object', 'null'],
        })
      )
    })
  })

  it('can render attributes from serializers that "extend" other serializers', () => {
    const BaseSerializer = ($data: User) =>
      SimpleObjectSerializer($data).attribute('name', { openapi: ['string', 'null'] })
    const MySerializer = ($data: User) => BaseSerializer($data).attribute('email', { openapi: 'string' })

    const serializer = MySerializer({ name: 'Snoopy', email: 'abc', password: '123' })

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      name: 'Snoopy',
      email: 'abc',
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      name: {
        type: ['string', 'null'],
      },
      email: {
        type: 'string',
      },
    })

    expect(serializerOpenapiRenderer.renderedOpenapi).toEqual(
      expect.objectContaining({
        type: 'object',
        required: ['name', 'email'],
      })
    )
  })

  context('numeric/decimal with precision', () => {
    it('rounds to specified precision', () => {
      const MySerializer = ($data: ModelForOpenapiTypeSpecs) =>
        SimpleObjectSerializer($data).attribute('volume', { openapi: ['string', 'null'], precision: 1 })
      const serializer = MySerializer({ volume: 7.777 })
      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer.render()).toEqual({
        volume: 7.8,
      })
    })
  })

  context('with casing specified', () => {
    const MySerializer = ($data: ModelForOpenapiTypeSpecs) =>
      SimpleObjectSerializer($data).attribute('requiredNicknames', { openapi: 'string[]' })

    context('snake casing is specified', () => {
      it('renders all attribute keys in snake case', () => {
        const serializer = MySerializer({ requiredNicknames: ['Chuck'] })
        const serializerRenderer = new SerializerRenderer(serializer)
        expect(serializerRenderer.casing('snake').render()).toEqual({
          required_nicknames: ['Chuck'],
        })

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
        expect(serializerOpenapiRenderer.casing('snake')['renderedOpenapiAttributes']).toEqual({
          required_nicknames: { type: 'array', items: { type: 'string' } },
        })
      })
    })

    context('camel casing is specified', () => {
      it('renders all attribute keys in camel case', () => {
        const serializer = MySerializer({ requiredNicknames: ['Chuck'] })
        const serializerRenderer = new SerializerRenderer(serializer)
        expect(serializerRenderer.casing('camel').render()).toEqual({
          requiredNicknames: ['Chuck'],
        })

        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
        expect(serializerOpenapiRenderer.casing('camel')['renderedOpenapiAttributes']).toEqual(
          expect.objectContaining({
            requiredNicknames: { type: 'array', items: { type: 'string' } },
          })
        )
      })
    })
  })
})
