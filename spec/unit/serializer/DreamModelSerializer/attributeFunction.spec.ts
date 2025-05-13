import { round } from '../../../../src/index.js'
import { DreamSerializer } from '../../../../src/serializer/index.js'
import SerializerOpenapiRenderer from '../../../../src/serializer/SerializerOpenapiRenderer.js'
import SerializerRenderer from '../../../../src/serializer/SerializerRenderer.js'
import ModelForOpenapiTypeSpecs from '../../../../test-app/app/models/ModelForOpenapiTypeSpec.js'
import User from '../../../../test-app/app/models/User.js'
import fleshedOutModelForOpenapiTypeSpecs from '../../../scaffold/fleshedOutModelForOpenapiTypeSpecs.js'

describe('DreamSerializer attributeFunctions', () => {
  it('can render Dream attributes', () => {
    const MySerializer = ($data: User) =>
      DreamSerializer(User, $data).attributeFunction('email', user => `${user?.email}@peanuts.com`, 'string')

    const serializer = MySerializer(User.new({ email: 'abc', password: '123' }))
    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer['renderedAttributes']).toEqual({
      email: 'abc@peanuts.com',
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
      })
    )
  })

  it('can override the OpenAPI shape with OpenAPI shorthand', async () => {
    const MySerializer = ($data: ModelForOpenapiTypeSpecs) =>
      DreamSerializer(ModelForOpenapiTypeSpecs, $data).attributeFunction(
        'birthdate',
        $data => $data.birthdate?.toDateTime()?.toISO(),
        'date-time'
      )
    const model = await fleshedOutModelForOpenapiTypeSpecs()
    const serializer = MySerializer(model)
    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer['renderedAttributes']).toEqual({
      birthdate: model.birthdate!.toDateTime()!.toISO(),
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      birthdate: {
        type: 'string',
        format: 'date-time',
      },
    })
  })

  it('can override the OpenAPI shape with an OpenAPI object', async () => {
    const MySerializer = ($data: ModelForOpenapiTypeSpecs) =>
      DreamSerializer(ModelForOpenapiTypeSpecs, $data).attributeFunction(
        'volume',
        $data => round($data.volume ?? 0),
        {
          type: 'integer',
          format: undefined,
          description: 'Volume as an integer',
        }
      )
    const serializer = MySerializer(await fleshedOutModelForOpenapiTypeSpecs())
    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer['renderedAttributes']).toEqual({
      volume: 8,
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
      volume: {
        type: 'integer',
        description: 'Volume as an integer',
      },
    })
  })

  context('with passthrough data', () => {
    it('can access the passthrough data in the function', () => {
      const MySerializer = ($data: User, $passthroughData: { locale: string }) =>
        DreamSerializer(User, $data, $passthroughData).attributeFunction(
          'email',
          (user, $passthroughData) => `${user?.email}.${$passthroughData?.locale}@peanuts.com`,
          'string'
        )

      const serializer = MySerializer(User.new({ email: 'abc', password: '123' }), { locale: 'en-US' })
      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer['renderedAttributes']).toEqual({
        email: 'abc.en-US@peanuts.com',
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
        })
      )
    })
  })

  context('when serializing null', () => {
    it('renders the attributes as null', () => {
      const MySerializer = ($data: User | null) =>
        DreamSerializer(User, $data)
          .maybeNull()
          .attributeFunction('email', user => `${user.email}@peanuts.com`, 'string')

      const serializer = MySerializer(null)
      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer['renderedAttributes']).toBeNull()

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
})
