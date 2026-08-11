import MissingSerializersDefinition from '../../../src/errors/serializers/MissingSerializersDefinition.js'
import { RecursiveSerializerInfo } from '../../../src/types/recursiveSerialization.js'
import Balloon from '../../../test-app/app/models/Balloon.js'
import Mylar from '../../../test-app/app/models/Balloon/Mylar.js'
import BalloonLine from '../../../test-app/app/models/BalloonLine.js'
import CircularReferenceModel from '../../../test-app/app/models/CircularReferenceModel.js'
import Collar from '../../../test-app/app/models/Collar.js'
import Composition from '../../../test-app/app/models/Composition.js'
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

  context('when the class it is called on is an STI base', () => {
    it('maps a single child’s serializer, unlike displaySerialization', () => {
      // Balloon's three STI children each register a *different* `stiUnion` serializer, and this
      // method deliberately maps only the first (Animal's, which renders `sandbags` and terminates
      // `balloonLine` through a delegatedAttribute) rather than the union across all three:
      // `sandbags` and `balloonLine` here, no `heartRatings`, which only Latex's renders.
      //
      // `displaySerialization` — and the preload paths `preloadFor` builds — take the union
      // instead (spec/unit/dream/displaySerialization.spec.ts). The divergence is intentional and
      // is pinned here so that changing it cannot go unnoticed.
      expect(Balloon['serializationMap']('stiUnion')).toEqual({
        sandbags: { parentDreamClass: Balloon, nestedSerializerInfo: {} },
        balloonLine: { parentDreamClass: Balloon, nestedSerializerInfo: {} },
      } satisfies RecursiveSerializerInfo)
    })
  })

  context('when an *association* targets an STI base', () => {
    it('maps the union of every child serializer that target resolves to', () => {
      // the narrowing above is to one serializer of the class the map is rooted at. Associations
      // below it are not narrowed: `balloon` resolves to one serializer per Balloon child, and all
      // three are walked, or the map would describe less than `preloadFor` loads.
      expect(BalloonLine['serializationMap']('stiUnion')).toEqual({
        balloon: {
          parentDreamClass: BalloonLine,
          nestedSerializerInfo: {
            // from all three children
            sandbags: { parentDreamClass: Balloon, nestedSerializerInfo: {} },
            // from Mylar's alone
            balloonLine: {
              parentDreamClass: Balloon,
              nestedSerializerInfo: {
                balloon: { parentDreamClass: BalloonLine, nestedSerializerInfo: {} },
              },
            },
            // from Latex's alone
            heartRatings: { parentDreamClass: Balloon, nestedSerializerInfo: {} },
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

  // `recursiveSerializationMap` shares its serializer-resolution path with `preloadFor`
  // (`resolveSerializerAssociationEdges`), so the 2.23.0 removal of the
  // MissingSerializersDefinition swallow reaches this method — and `psy i:serialization`, which
  // is built on it — not only `preloadFor`.
  context('when a rendersOne/rendersMany target class has no `serializers` getter', () => {
    it('throws MissingSerializersDefinition', () => {
      // CompositionSerializer renders `compositionAssets`; CompositionAsset declares no
      // `serializers` getter.
      expect(() => Composition['serializationMap']()).toThrow(MissingSerializersDefinition)
    })
  })
})
