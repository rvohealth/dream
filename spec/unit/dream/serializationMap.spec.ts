import { RecursiveSerializerInfo } from '../../../src/dream/internal/extractNestedPaths.js'
import Mylar from '../../../test-app/app/models/Balloon/Mylar.js'
import CircularReferenceModel from '../../../test-app/app/models/CircularReferenceModel.js'
import Collar from '../../../test-app/app/models/Collar.js'
import Pet from '../../../test-app/app/models/Pet.js'
import Chore from '../../../test-app/app/models/Polymorphic/Chore.js'
import PolymorphicTask from '../../../test-app/app/models/Polymorphic/Task.js'
import Workout from '../../../test-app/app/models/Polymorphic/Workout.js'
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

  context('on the other side of a polymorphic belongs-to', () => {
    it('includes all associations on the other side of the polymorphic belongs-to', () => {
      expect(PolymorphicTask['serializationMap']()).toEqual({
        taskable: {
          parentDreamClass: PolymorphicTask,
          nestedSerializerInfo: {
            cleaningSupplies: {
              parentDreamClass: Chore,
              nestedSerializerInfo: {},
            },
            workoutType: {
              parentDreamClass: Workout,
              nestedSerializerInfo: {},
            },
          },
        },
      } satisfies RecursiveSerializerInfo)
    })
  })

  context('with an explicitly provided serializer', () => {
    it('includes all associations on the other side of the polymorphic belongs-to', () => {
      expect(PolymorphicTask['serializationMap']('renderViaExplicitSerializer')).toEqual({
        taskable: {
          parentDreamClass: PolymorphicTask,
          nestedSerializerInfo: {},
        },
      } satisfies RecursiveSerializerInfo)
    })
  })

  context('circular serializer reference', () => {
    it('limits the number of times we’ll follow a particular association', () => {
      expect(CircularReferenceModel['serializationMap']('default')).toEqual({
        child: {
          parentDreamClass: CircularReferenceModel,
          nestedSerializerInfo: {
            child: {
              parentDreamClass: CircularReferenceModel,
              nestedSerializerInfo: {
                child: {
                  parentDreamClass: CircularReferenceModel,
                  nestedSerializerInfo: {
                    child: {
                      parentDreamClass: CircularReferenceModel,
                      nestedSerializerInfo: {},
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
