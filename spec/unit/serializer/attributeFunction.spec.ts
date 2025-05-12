import { DreamModelSerializer, SimpleObjectSerializer } from '../../../src/serializer/index.js'
import SerializerRenderer from '../../../src/serializer/serializerRenderer.js'
import User from '../../../test-app/app/models/User.js'

describe('DreamSerializer attributeFunctions', () => {
  it('can render Dream attributes', () => {
    const MySerializer = ($data: User) =>
      DreamModelSerializer(User, $data).attributeFunction('email', user => `${user?.email}@peanuts.com`)

    const serializer = MySerializer(User.new({ email: 'abc', password: '123' }))
    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.renderedAttributeFunctions).toEqual({
      email: 'abc@peanuts.com',
    })
  })

  it('can render simple object attributes', () => {
    const MySerializer = ($data: { email: string; password: string }) =>
      SimpleObjectSerializer($data).attributeFunction('email', user => `${user?.email}@peanuts.com`)

    const serializer = MySerializer({ email: 'abc', password: '123' })
    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.renderedAttributeFunctions).toEqual({
      email: 'abc@peanuts.com',
    })
  })

  context('when serializing null', () => {
    it('renders the attributes as null', () => {
      const MySerializer = ($data: User | null) =>
        DreamModelSerializer(User, $data).attributeFunction('email', user => `${user?.email}@peanuts.com`)

      const serializer = MySerializer(null)
      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer.renderedAttributeFunctions).toBeNull()
    })
  })
})
