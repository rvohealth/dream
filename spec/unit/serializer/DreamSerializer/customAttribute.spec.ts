import { round } from '../../../../src/index.js'
import { DreamSerializer } from '../../../../src/serializer/index.js'
import SerializerOpenapiRenderer from '../../../../src/serializer/SerializerOpenapiRenderer.js'
import SerializerRenderer from '../../../../src/serializer/SerializerRenderer.js'
import ModelForOpenapiTypeSpecs from '../../../../test-app/app/models/ModelForOpenapiTypeSpec.js'
import User from '../../../../test-app/app/models/User.js'
import fleshedOutModelForOpenapiTypeSpecs from '../../../scaffold/fleshedOutModelForOpenapiTypeSpecs.js'

describe('DreamSerializer customAttributes', () => {
  it('can render the results of calling the callback function', () => {
    const MySerializer = (data: User) =>
      DreamSerializer(User, data).customAttribute('email', user => `${user?.email}@peanuts.com`, {
        openapi: 'string',
      })

    const serializer = MySerializer(User.new({ email: 'abc', password: '123' }))
    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      email: 'abc@peanuts.com',
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      email: {
        type: 'string',
      },
    })
  })

  it('can override the OpenAPI shape with OpenAPI shorthand', async () => {
    const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
      DreamSerializer(ModelForOpenapiTypeSpecs, data).customAttribute(
        'birthdate',
        data => data.birthdate?.toDateTime()?.toISO(),
        { openapi: 'date-time' }
      )
    const model = await fleshedOutModelForOpenapiTypeSpecs()
    const serializer = MySerializer(model)
    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      birthdate: model.birthdate!.toDateTime()!.toISO(),
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      birthdate: {
        type: 'string',
        format: 'date-time',
      },
    })
  })

  it('can override the OpenAPI shape with an OpenAPI object', async () => {
    const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
      DreamSerializer(ModelForOpenapiTypeSpecs, data).customAttribute(
        'volume',
        data => round(data.volume ?? 0),
        {
          openapi: {
            type: 'integer',
            format: undefined,
            description: 'Volume as an integer',
          },
        }
      )
    const serializer = MySerializer(await fleshedOutModelForOpenapiTypeSpecs())
    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      volume: 8,
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      volume: {
        type: 'integer',
        description: 'Volume as an integer',
      },
    })
  })

  context('with passthrough data', () => {
    it('data passed into the serializer takes precedence over data passed into the serializer renderer', () => {
      const MySerializer = (data: User, passthroughData: { passthrough1?: string; passthrough2?: string }) =>
        DreamSerializer(User, data, passthroughData).customAttribute(
          'myString',
          (_, passthroughData) => `${passthroughData.passthrough1}, ${passthroughData.passthrough2}`,
          { openapi: 'string' }
        )

      const serializer = MySerializer(User.new({ email: 'abc', password: '123' }), {
        passthrough1: 'serializerP1',
      })

      const serializerRenderer = new SerializerRenderer(serializer, {
        passthrough1: 'rendererP1',
        passthrough2: 'rendererP2',
      })

      expect(serializerRenderer.render()).toEqual({
        myString: 'serializerP1, rendererP2',
      })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        myString: {
          type: 'string',
        },
      })
    })
  })

  context('when serializing null', () => {
    it('renders the attributes as null', () => {
      const MySerializer = (data: User | null) =>
        DreamSerializer(User, data)
          .maybeNull()
          .customAttribute('email', user => `${user.email}@peanuts.com`, { openapi: 'string' })

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
})
