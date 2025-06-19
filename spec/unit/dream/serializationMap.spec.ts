import { RecursiveSerializerInfo } from '../../../src/dream/internal/extractNestedPaths.js'
import Mylar from '../../../test-app/app/models/Balloon/Mylar.js'
import Collar from '../../../test-app/app/models/Collar.js'
import Pet from '../../../test-app/app/models/Pet.js'
import Rating from '../../../test-app/app/models/Rating.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.serializationMap', () => {
  context('when given no serializer key', () => {
    it('renders the default', () => {
      expect(Collar['serializationMap']()).toEqual({
        pet: {
          parentDreamClass: Collar,
          nestedSerializerInfo: {
            ratings: {
              parentDreamClass: Pet,
              nestedSerializerInfo: {},
            },
          },
        },
      } satisfies RecursiveSerializerInfo)
    })
  })

  context('delegatedAttribute', () => {
    it('includes the association to load, but not subsequent serializers', () => {
      expect(Mylar['serializationMap']('delegated')).toEqual({
        balloonLine: {
          parentDreamClass: Mylar,
          nestedSerializerInfo: {},
        },
      } satisfies RecursiveSerializerInfo)
    })
  })

  context('when given a serializer key', () => {
    it('renders the serializer key', () => {
      expect(Collar['serializationMap']('summary')).toEqual({
        pet: { parentDreamClass: Collar, nestedSerializerInfo: {} },
      } satisfies RecursiveSerializerInfo)
    })
  })

  context('deeply-nested associations', () => {
    it('renders the deeply-nested associations', () => {
      expect(Collar['serializationMap']('deep')).toEqual({
        balloon: {
          parentDreamClass: Collar,
          nestedSerializerInfo: {},
        },
        pet: {
          parentDreamClass: Collar,
          nestedSerializerInfo: {
            ratings: {
              parentDreamClass: Pet,
              nestedSerializerInfo: {
                user: {
                  parentDreamClass: Rating,
                  nestedSerializerInfo: {
                    allPets: {
                      parentDreamClass: User,
                      nestedSerializerInfo: {
                        ratings: {
                          parentDreamClass: Pet,
                          nestedSerializerInfo: {},
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      } satisfies RecursiveSerializerInfo)
    })
  })
})
