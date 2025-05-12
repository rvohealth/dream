import { DreamModelSerializer, SimpleObjectSerializer } from '../../../../src/serializer/index.js'
import SerializerOpenapiRenderer from '../../../../src/serializer/SerializerOpenapiRenderer.js'
import SerializerRenderer from '../../../../src/serializer/SerializerRenderer.js'
import User from '../../../../test-app/app/models/User.js'

describe('DreamSerializer attributes', () => {
  it('can render Dream attributes', () => {
    const MySerializer = ($data: User) => DreamModelSerializer(User, $data).attribute('email')

    const serializer = MySerializer(User.new({ email: 'abc', password: '123' }))

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer['renderedAttributes']).toEqual({
      email: 'abc',
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(serializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
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

  it('can render simple object attributes', () => {
    const MySerializer = ($data: { email: string; password: string }) =>
      SimpleObjectSerializer($data).attribute('email', 'string')

    const serializer = MySerializer({ email: 'abc', password: '123' })
    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer['renderedAttributes']).toEqual({
      email: 'abc',
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(serializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
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

  context('when serializing null', () => {
    it('renders the attributes as null', () => {
      const MySerializer = ($data: User | null) =>
        DreamModelSerializer(User, $data).maybeNull().attribute('email')

      const serializer = MySerializer(null)
      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer['renderedAttributes']).toBeNull()

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(serializer)
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
})
