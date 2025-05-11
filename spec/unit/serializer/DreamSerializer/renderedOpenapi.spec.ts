import DreamSerializer from '../../../../src/serializer/DreamSerializer.js'
import SerializerOpenapiRenderer from '../../../../src/serializer/SerializerOpenapiRenderer.js'
import ModelForOpenapiTypeSpecs from '../../../../test-app/app/models/ModelForOpenapiTypeSpec.js'
import User from '../../../../test-app/app/models/User.js'

describe('DreamSerializer attributes', () => {
  it('can render Dream attributes', () => {
    const MySerializer = (data: User) => DreamSerializer(User, data).attribute('email')
    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)

    expect(serializerOpenapiRenderer.renderedOpenapi().openapi).toEqual(
      expect.objectContaining({
        type: 'object',
        required: ['email'],
      })
    )
  })

  it('can render virtual Dream attributes', () => {
    const MySerializer = (data: User) => DreamSerializer(User, data).attribute('lbs', { openapi: 'decimal' })
    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)

    expect(serializerOpenapiRenderer.renderedOpenapi().openapi).toEqual(
      expect.objectContaining({
        type: 'object',
        required: ['lbs'],
      })
    )
  })

  it('can render attributes from serializers that "extend" other serializers', () => {
    const BaseSerializer = (data: User) => DreamSerializer(User, data).attribute('name')
    const MySerializer = (data: User) => BaseSerializer(data).attribute('email')
    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)

    expect(serializerOpenapiRenderer.renderedOpenapi().openapi).toEqual(
      expect.objectContaining({
        type: 'object',
        required: ['email', 'name'],
      })
    )
  })

  context('with casing specified', () => {
    const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
      DreamSerializer(ModelForOpenapiTypeSpecs, data).attribute('requiredNicknames')

    context('snake casing is specified', () => {
      it('renders all attribute keys in snake case', () => {
        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer, { casing: 'snake' })

        expect(serializerOpenapiRenderer.renderedOpenapi().openapi).toEqual(
          expect.objectContaining({
            type: 'object',
            required: ['required_nicknames'],
          })
        )
      })
    })

    context('camel casing is specified', () => {
      it('renders all attribute keys in camel case', () => {
        const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer, { casing: 'camel' })

        expect(serializerOpenapiRenderer.renderedOpenapi().openapi).toEqual(
          expect.objectContaining({
            type: 'object',
            required: ['requiredNicknames'],
          })
        )
      })
    })
  })
})
