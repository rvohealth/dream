import Dream from '../../../../src/Dream.js'
import mergeSerializerAssociationEdges from '../../../../src/dream/internal/mergeSerializerAssociationEdges.js'
import { inferSerializersFromDreamClassOrViewModelClass } from '../../../../src/serializer/helpers/inferSerializerFromDreamOrViewModel.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'
import BalloonLine from '../../../../test-app/app/models/BalloonLine.js'
import HeartRating from '../../../../test-app/app/models/ExtraRating/HeartRating.js'
import Sandbag from '../../../../test-app/app/models/Sandbag.js'
import StiUnionAnimalSerializer from '../../../../test-app/app/serializers/Balloon/StiUnionAnimalSerializer.js'
import StiUnionLatexSerializer from '../../../../test-app/app/serializers/Balloon/StiUnionLatexSerializer.js'
import StiUnionMylarSerializer from '../../../../test-app/app/serializers/Balloon/StiUnionMylarSerializer.js'
import BalloonLineSerializer, {
  BalloonLineStiUnionSerializer,
} from '../../../../test-app/app/serializers/BalloonLineSerializer.js'
import { HeartRatingSerializer } from '../../../../test-app/app/serializers/ExtraRating/HeartRatingSerializer.js'
import SandbagSerializer from '../../../../test-app/app/serializers/SandbagSerializer.js'

/**
 * `mergeSerializerAssociationEdges` is the single union both serializer walks run on —
 * `buildSerializerPreloadPaths` (what `preloadFor` loads) and `Dream.recursiveSerializationMap`
 * (what `psy i:serialization` prints). Those two disagreeing about which associations a serializer
 * key reaches is the bug class this merge exists to prevent, so it is pinned directly here rather
 * than only through its two callers.
 */
describe('mergeSerializerAssociationEdges', () => {
  context('on an STI base whose children each register a different serializer for the key', () => {
    it('unions and dedupes the edges of every child’s serializer', () => {
      const edges = mergeSerializerAssociationEdges(
        Balloon as unknown as typeof Dream,
        inferSerializersFromDreamClassOrViewModelClass(Balloon as unknown as typeof Dream, 'stiUnion')
      )

      expect(edges).toEqual([
        // rendered identically by all three children, so it merges to a single edge with a single
        // target carrying a single serializer
        {
          associationAs: 'sandbags',
          terminates: false,
          targets: [
            {
              dreamClass: Sandbag,
              serializers: [
                {
                  serializer: SandbagSerializer,
                  type: 'rendersMany',
                  serializerAssociationName: 'sandbags',
                },
              ],
            },
          ],
        },

        // terminated by Animal (delegatedAttribute) *and* descended into by Mylar (rendersOne), so
        // the edge is both terminating and targeted
        {
          associationAs: 'balloonLine',
          terminates: true,
          targets: [
            {
              dreamClass: BalloonLine,
              serializers: [
                {
                  serializer: BalloonLineSerializer,
                  type: 'rendersOne',
                  serializerAssociationName: 'balloonLine',
                },
              ],
            },
          ],
        },

        // rendered only by Latex, the middle child: invisible to a walk of any single child's
        // serializer
        {
          associationAs: 'heartRatings',
          terminates: false,
          targets: [
            {
              dreamClass: HeartRating,
              serializers: [
                {
                  serializer: HeartRatingSerializer,
                  type: 'rendersMany',
                  serializerAssociationName: 'heartRatings',
                },
              ],
            },
          ],
        },
      ])
    })
  })

  context('when an association targets an STI base', () => {
    it('groups every child’s serializer under one target, so a caller recurses into the class once', () => {
      const edges = mergeSerializerAssociationEdges(BalloonLine as unknown as typeof Dream, [
        BalloonLineStiUnionSerializer,
      ])

      expect(edges).toEqual([
        {
          associationAs: 'balloon',
          terminates: false,
          targets: [
            {
              dreamClass: Balloon,
              serializers: [
                {
                  serializer: StiUnionAnimalSerializer,
                  type: 'rendersOne',
                  serializerAssociationName: 'balloon',
                },
                {
                  serializer: StiUnionLatexSerializer,
                  type: 'rendersOne',
                  serializerAssociationName: 'balloon',
                },
                {
                  serializer: StiUnionMylarSerializer,
                  type: 'rendersOne',
                  serializerAssociationName: 'balloon',
                },
              ],
            },
          ],
        },
      ])
    })
  })
})
