import Dream from '../../../../src/Dream.js'
import buildSerializerPreloadPaths from '../../../../src/dream/internal/buildSerializerPreloadPaths.js'
import DreamSerializer from '../../../../src/serializer/DreamSerializer.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'
import BalloonLine from '../../../../test-app/app/models/BalloonLine.js'

/**
 * Builds an STI base with `n` children, each registering its own `stiUnion` serializer, each of
 * which renders a self-referential `kids` association back through the base under the same key.
 * This is the shape that made the per-serializer traversal blow up: with one traversal per
 * serializer and `n` targets resolved at every step, the walk enumerated n^(maxRepeats + 1) routes
 * to the same single preload path.
 *
 * Assembled by hand rather than with real models and decorators because the blow-up only shows up
 * at a child count no test-app STI hierarchy has, and none of it touches the database:
 * `buildSerializerPreloadPaths` reads only global names, STI registration, association metadata and
 * serializer definitions.
 */
function buildStiFanOut(n: number) {
  const counter = { serializerInvocations: 0 }

  class StiFanOutBase extends Dream {}
  ;(StiFanOutBase as any).setGlobalName(`SpecStiFanOut${n}/Base`)
  ;(StiFanOutBase as any).associationMetadataByType = {
    belongsTo: [],
    hasOne: [],
    hasMany: [{ as: 'kids', modelCB: () => StiFanOutBase, type: 'HasMany' }],
  }

  const children = Array.from({ length: n }, (_, index) => {
    const child = class extends StiFanOutBase {}
    Object.defineProperty(child, 'name', { value: `SpecStiFanOutChild${index}` })
    ;(child as any).setGlobalName(`SpecStiFanOut${n}/Child${index}`)
    ;(child as any).sti = { active: true, baseClass: StiFanOutBase }

    const serializer = (data: any) => {
      counter.serializerInvocations++
      return (DreamSerializer(StiFanOutBase, data) as any).rendersMany('kids', {
        serializerKey: 'stiUnion',
      })
    }

    Object.defineProperty(child.prototype, 'serializers', {
      get() {
        return { stiUnion: serializer }
      },
    })

    return child
  })
  ;(StiFanOutBase as any).extendedBy = children

  return { StiFanOutBase: StiFanOutBase as unknown as typeof Dream, counter }
}

describe('buildSerializerPreloadPaths', () => {
  context('on an STI base whose children each register a different serializer for the key', () => {
    it('unions and dedupes the paths of every child’s serializer', () => {
      const paths = buildSerializerPreloadPaths(Balloon as unknown as typeof Dream, 'stiUnion')

      // Animal renders `sandbags` and terminates `balloonLine` with a delegatedAttribute, Latex
      // renders `sandbags` and `heartRatings`, Mylar renders `sandbags` and `balloonLine` (whose
      // serializer adds a nested `balloon` edge). The three `sandbags` paths dedupe to one; the two
      // `balloonLine` paths share a prefix but diverge, so both survive. Order is asserted because
      // it decides which of two prefix-sharing paths' `and` statements wins downstream.
      expect(paths).toEqual([
        [[Balloon, 'sandbags']],
        [[Balloon, 'balloonLine']],
        [
          [Balloon, 'balloonLine'],
          [BalloonLine, 'balloon'],
        ],
        [[Balloon, 'heartRatings']],
      ])
    })
  })

  context('when every child’s serializer recurses back through the STI base', () => {
    it('walks the serializer graph once rather than once per route through it', () => {
      const { StiFanOutBase, counter } = buildStiFanOut(8)

      const paths = buildSerializerPreloadPaths(StiFanOutBase, 'stiUnion')

      // one path, `kids` repeated RECURSIVE_SERIALIZATION_MAX_REPEATS times
      expect(paths).toEqual([
        [
          [StiFanOutBase, 'kids'],
          [StiFanOutBase, 'kids'],
          [StiFanOutBase, 'kids'],
          [StiFanOutBase, 'kids'],
        ],
      ])

      // The discriminating assertion. Each serializer is invoked a small, bounded number of times
      // (once per `isDreamSerializer` check and once per resolve of its association edges, both of
      // which are reached a constant number of times per traversal depth). Walking one traversal
      // per serializer, with edges re-resolved at every node visit, invoked these 8 serializers
      // tens of thousands of times to arrive at the same single path — and grew as n^5.
      expect(counter.serializerInvocations).toBeLessThan(200)
    })
  })
})
