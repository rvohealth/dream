import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'
import User from '../../../test-app/app/models/User'
import MissingSerializer from '../../../src/exceptions/missing-serializer'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'

describe('Dream#serialize', () => {
  it('serializes a model using the coupled serializer', () => {
    class MySerializer extends DreamSerializer {
      @Attribute()
      public email: string
    }

    class MyDream extends User {
      public get serializers(): any {
        return { default: MySerializer }
      }
    }

    const user = MyDream.new({ email: 'how@yadoin', password: 'howyadoin' })
    expect(user.serialize()).toEqual({ email: 'how@yadoin' })
  })

  context('a serializer is not defined on the model', () => {
    it('raises a targeted exception', () => {
      const record = CompositionAsset.new({ name: 'howyadoin' })
      expect(() => record.serialize()).toThrowError(MissingSerializer)
    })
  })
})
