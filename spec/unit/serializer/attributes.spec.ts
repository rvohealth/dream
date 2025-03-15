import Attribute from '../../../src/serializer/decorators/attribute.js'
import DreamSerializer from '../../../src/serializer/index.js'
import processDynamicallyDefinedSerializers from '../../helpers/processDynamicallyDefinedSerializers.js'

describe('DreamSerializer attribute accessors', () => {
  it('allows accessing attributes from serializer', () => {
    class MySerializer extends DreamSerializer {
      @Attribute()
      public email: string
    }
    processDynamicallyDefinedSerializers(MySerializer)

    const serializer = new MySerializer({ email: 'abc', password: '123' })
    expect(serializer.email).toEqual('abc')
  })

  it('allows setting of attributes from serializer', () => {
    class MySerializer extends DreamSerializer {
      @Attribute()
      public email: string
    }
    processDynamicallyDefinedSerializers(MySerializer)

    const serializer = new MySerializer({ email: 'abc', password: '123' })
    serializer.email = 'hellowdy'

    expect(serializer.render()).toEqual({ email: 'hellowdy' })
  })
})
