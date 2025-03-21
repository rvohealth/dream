import MissingSerializersDefinition from '../../../src/errors/MissingSerializersDefinition.js'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset.js'
import User from '../../../test-app/app/models/User.js'

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
