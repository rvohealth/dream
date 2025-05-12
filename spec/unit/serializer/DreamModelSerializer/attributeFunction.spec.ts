import { DreamModelSerializer, SimpleObjectSerializer } from '../../../../src/serializer/index.js'
import SerializerOpenapiRenderer from '../../../../src/serializer/SerializerOpenapiRenderer.js'
import SerializerRenderer from '../../../../src/serializer/SerializerRenderer.js'
import User from '../../../../test-app/app/models/User.js'

describe('DreamSerializer attributeFunctions', () => {
  it('can render Dream attributes', () => {
    const MySerializer = ($data: User) =>
      DreamModelSerializer(User, $data).attributeFunction(
        'email',
        user => `${user?.email}@peanuts.com`,
        'string'
      )

    const serializer = MySerializer(User.new({ email: 'abc', password: '123' }))
    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer['renderedAttributeFunctions']).toEqual({
      email: 'abc@peanuts.com',
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(serializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributeFunctions']).toEqual({
      email: {
        type: 'string',
      },
    })

    expect(serializerOpenapiRenderer.renderedOpenapi).toEqual(
      expect.objectContaining({
        type: 'null',
      })
    )
  })

  it('can render simple object attributes', () => {
    const MySerializer = ($data: { email: string; password: string }) =>
      SimpleObjectSerializer($data).attributeFunction('email', user => `${user?.email}@peanuts.com`, 'string')

    const serializer = MySerializer({ email: 'abc', password: '123' })
    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer['renderedAttributeFunctions']).toEqual({
      email: 'abc@peanuts.com',
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(serializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributeFunctions']).toEqual({
      email: {
        type: 'string',
      },
    })

    expect(serializerOpenapiRenderer.renderedOpenapi).toEqual(
      expect.objectContaining({
        type: 'null',
      })
    )
  })

  context('when serializing null', () => {
    it('renders the attributes as null', () => {
      const MySerializer = ($data: User | null) =>
        DreamModelSerializer(User, $data).attributeFunction(
          'email',
          user => `${user.email}@peanuts.com`,
          'string'
        )

      const serializer = MySerializer(null)
      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer['renderedAttributeFunctions']).toBeNull()

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(serializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributeFunctions']).toEqual({
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
})
