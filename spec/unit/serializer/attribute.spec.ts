import DreamSerializer from '../../../src/serializer/index.js'
import SerializerRenderer from '../../../src/serializer/serializerRenderer.js'
import User from '../../../test-app/app/models/User.js'

describe('DreamSerializer attributes', () => {
  it('can render Dream attributes', () => {
    const MySerializer = ($data: User) => DreamSerializer($data).attribute('email')

    const serializer = MySerializer(User.new({ email: 'abc', password: '123' }))
    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.renderedAttributes).toEqual({
      email: 'abc',
    })
  })

  it('can render simple object attributes', () => {
    const MySerializer = ($data: { email: string; password: string }) =>
      DreamSerializer($data).attribute('email')

    const serializer = MySerializer({ email: 'abc', password: '123' })
    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.renderedAttributes).toEqual({
      email: 'abc',
    })
  })

  context('when serializing null', () => {
    it('renders the attributes as null', () => {
      const MySerializer = ($data: User | null) => DreamSerializer($data).attribute('email')

      const serializer = MySerializer(null)
      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer.renderedAttributes).toBeNull()
    })
  })
})
