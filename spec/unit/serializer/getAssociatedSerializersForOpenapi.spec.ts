import Rating from '../../../test-app/app/models/Rating'
import PetSerializer from '../../../test-app/app/serializers/PetSerializer'

describe('DreamSerailizer.getAssociatedSerializersForOpenapi', () => {
  it('', () => {
    const results = PetSerializer.getAssociatedSerializersForOpenapi({
      field: 'ratings',
      flatten: false,
      optional: false,
      dreamOrSerializerClass: Rating,
      source: 'no-clue',
      through: null,
      type: 'RendersMany',
      path: null,
      exportedAs: null,
      nullable: false,
    })

    console.debug(results)
  })
})
