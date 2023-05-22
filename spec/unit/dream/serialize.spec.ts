import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'
import User from '../../../test-app/app/models/User'
import Dream from '../../../src/dream'
import MissingSerializer from '../../../src/exceptions/missing-serializer'

describe('Dream#serialize', () => {
  it('serializes a model using the coupled serializer', async () => {
    class MySerializer extends DreamSerializer {
      @Attribute()
      public email: string
    }

    class MyDream extends User {
      public get serializer() {
        return MySerializer
      }
    }

    const user = MyDream.new({ email: 'how@yadoin', password: 'howyadoin' })
    expect(user.serialize()).toEqual({ email: 'how@yadoin' })
  })

  context('a serializer is not defined on the model', () => {
    it('raises a targeted exception', async () => {
      const user = User.new({ email: 'how@yadoin', password: 'howyadoin' })
      expect(() => user.serialize()).toThrowError(MissingSerializer)
    })
  })
})
