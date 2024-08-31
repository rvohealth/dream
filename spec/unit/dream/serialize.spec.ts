import MissingSerializersDefinition from '../../../src/exceptions/missing-serializers-definition'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'
import User from '../../../test-app/app/models/User'

describe('Dream#serialize', () => {
  it('serializes a model using the coupled serializer', () => {
    const user = User.new({ email: 'how@yadoin', password: 'howyadoin', favoriteWord: 'chalupas' })
    expect(user.serialize({ serializerKey: 'summary' })).toEqual({ id: user.id, favoriteWord: 'chalupas' })
  })

  context('a serializer is not defined on the model', () => {
    it('raises a targeted exception', () => {
      const record = CompositionAsset.new({ name: 'howyadoin' })
      expect(() => record.serialize()).toThrow(MissingSerializersDefinition)
    })
  })
})
