import { DreamModelSerializer } from '../../../../src/serializer/index.js'
import SerializerOpenapiRenderer from '../../../../src/serializer/SerializerOpenapiRenderer.js'
import SerializerRenderer from '../../../../src/serializer/SerializerRenderer.js'
import User from '../../../../test-app/app/models/User.js'

describe('DreamSerializer attributeFunctions', () => {
  it('can render Dream attributes', () => {
    const MySerializer = ($data: User) =>
      DreamModelSerializer(User, $data)
        .openapiName('MySerializer')
        .attributeFunction('email', user => `${user?.email}@peanuts.com`, 'string')

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
        type: 'object',
      })
    )
  })

  context('with passthrough data', () => {
    it('can access the passthrough data in the function', () => {
      const MySerializer = ($data: User, $passthroughData: { locale: string }) =>
        DreamModelSerializer(User, $data, $passthroughData)
          .openapiName('MySerializer')
          .attributeFunction(
            'email',
            (user, $passthroughData) => `${user?.email}.${$passthroughData?.locale}@peanuts.com`,
            'string'
          )

      const serializer = MySerializer(User.new({ email: 'abc', password: '123' }), { locale: 'en-US' })
      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer['renderedAttributeFunctions']).toEqual({
        email: 'abc.en-US@peanuts.com',
      })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(serializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributeFunctions']).toEqual({
        email: {
          type: 'string',
        },
      })

      expect(serializerOpenapiRenderer.renderedOpenapi).toEqual(
        expect.objectContaining({
          type: 'object',
        })
      )
    })
  })

  context('when serializing null', () => {
    it('renders the attributes as null', () => {
      const MySerializer = ($data: User | null) =>
        DreamModelSerializer(User, $data)
          .openapiName('MySerializer')
          .maybeNull()
          .attributeFunction('email', user => `${user.email}@peanuts.com`, 'string')

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
