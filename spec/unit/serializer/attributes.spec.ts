import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'

describe('DreamSerializer attribute accessors', () => {
  it('allows accessing attributes from serializer', async () => {
    class MySerializer extends DreamSerializer {
      @Attribute()
      public email: string
    }
    const serializer = new MySerializer({ email: 'abc', password: '123' })
    expect(serializer.email).toEqual('abc')
  })

  it('allows setting of attributes from serializer', async () => {
    class MySerializer extends DreamSerializer {
      @Attribute()
      public email: string
    }
    const serializer = new MySerializer({ email: 'abc', password: '123' })
    serializer.email = 'hellowdy'

    expect(serializer.render()).toEqual({ email: 'hellowdy' })
  })
})
