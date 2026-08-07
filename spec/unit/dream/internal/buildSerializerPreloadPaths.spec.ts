import Dream from '../../../../src/Dream.js'
import buildSerializerPreloadPaths from '../../../../src/dream/internal/buildSerializerPreloadPaths.js'
import * as mergeSerializerAssociationEdgesModule from '../../../../src/dream/internal/mergeSerializerAssociationEdges.js'
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
 *
 * Two counters come back with it, measuring two different things:
 *
 * - `globalNameReads` counts traversal work. Every step of the walk reads the node class's
 *   `globalName`: `buildAssociationPaths` reads it once per node visited (to key the recursion
 *   budget), the merge reads it once per association target, and the dedupe reads it once per tuple
 *   of every emitted path. It therefore tracks nodes visited and paths emitted, which is exactly
 *   what merging the sibling serializers into a single traversal node collapses.
 * - `serializerInvocations` counts calls of the serializer functions themselves, which happen only
 *   when a (Dream class, serializer) pair's association edges are resolved for the first time. It
 *   tracks the `resolveSerializerAssociationEdges` memo and nothing else — notably it is *not*
 *   sensitive to the merge, since an unmerged walk's repeat visits are served from that memo too.
 */
function buildStiFanOut(n: number) {
  const counter = { serializerInvocations: 0, globalNameReads: 0 }

  class StiFanOutBase extends Dream {}
  ;(StiFanOutBase as any).setGlobalName(`SpecStiFanOut${n}/Base`)

  // shadows Dream's own static getter for this hierarchy; each child sets its own `_globalName`
  // below, so every class still reports its own name through it
  Object.defineProperty(StiFanOutBase, 'globalName', {
    get(this: { _globalName: string }) {
      counter.globalNameReads++
      return this._globalName
    },
  })
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

/**
 * As `buildStiFanOut`, except that child `i` renders a `kids${i}` association of its own rather than
 * a shared `kids` — every one of them self-referential back through the STI base. The merged node is
 * then the same (class, serializer set) no matter which of the `n` associations reached it, but the
 * `n` associations do not collapse into one edge the way `buildStiFanOut`'s do, so the *routes*
 * through the graph fan out `n`-ways at every level.
 */
function buildStiFanOutDistinctAssociationNames(n: number) {
  class StiFanOutBase extends Dream {}
  ;(StiFanOutBase as any).setGlobalName(`SpecStiFanOutDistinct${n}/Base`)
  ;(StiFanOutBase as any).associationMetadataByType = {
    belongsTo: [],
    hasOne: [],
    hasMany: Array.from({ length: n }, (_, index) => ({
      as: `kids${index}`,
      modelCB: () => StiFanOutBase,
      type: 'HasMany',
    })),
  }

  const children = Array.from({ length: n }, (_, index) => {
    const child = class extends StiFanOutBase {}
    Object.defineProperty(child, 'name', { value: `SpecStiFanOutDistinctChild${index}` })
    ;(child as any).setGlobalName(`SpecStiFanOutDistinct${n}/Child${index}`)
    ;(child as any).sti = { active: true, baseClass: StiFanOutBase }

    const serializer = (data: any) =>
      (DreamSerializer(StiFanOutBase, data) as any).rendersMany(`kids${index}`, { serializerKey: 'stiUnion' })

    Object.defineProperty(child.prototype, 'serializers', {
      get() {
        return { stiUnion: serializer }
      },
    })

    return child
  })
  ;(StiFanOutBase as any).extendedBy = children

  return { StiFanOutBase: StiFanOutBase as unknown as typeof Dream }
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

      // The assertion that discriminates the merge. All 8 sibling serializers that can render the
      // base at a given point in the walk travel as one traversal node, so the walk visits one node
      // per level and its work is linear in the number of siblings. Without the merge — one node
      // per (class, serializer) pair — this same single path is reached by every one of the
      // n^(maxRepeats + 1) routes through the graph and the traversal work explodes with them:
      // measured on this fixture at n = 8, ~77 reads merged against ~21,800 unmerged.
      expect(counter.globalNameReads).toBeLessThan(500)
    })

    it('resolves each serializer’s association edges once rather than once per visit', () => {
      const { StiFanOutBase, counter } = buildStiFanOut(8)

      buildSerializerPreloadPaths(StiFanOutBase, 'stiUnion')

      // Guards the caching of resolved association edges, and only that: each serializer is invoked
      // a small, bounded number of times (once per `isDreamSerializer` check and once per resolve of
      // its association edges, both of which are reached a constant number of times per traversal
      // depth) rather than once per node visit. Measured on this fixture at n = 8: 80 invocations as
      // implemented, 296 with every layer of edge caching removed.
      //
      // It says nothing about whether sibling serializers are merged into a single traversal node —
      // the caches serve an unmerged walk's repeat visits just as well, and this assertion stays
      // green (80 invocations either way) against an unmerged implementation. The example above is
      // what covers the merge.
      expect(counter.serializerInvocations).toBeLessThan(200)
    })
  })

  context('when the children recurse back through the STI base under different association names', () => {
    it('merges each distinct traversal node once, however many routes reach it', () => {
      const mergeSpy = vi.spyOn(mergeSerializerAssociationEdgesModule, 'default')
      const { StiFanOutBase } = buildStiFanOutDistinctAssociationNames(8)

      const paths = buildSerializerPreloadPaths(StiFanOutBase, 'stiUnion')

      // Every node in this graph is the same (STI base, all 8 serializers) pair, reached by 8
      // different associations, so there is exactly one merge to do. The traversal hands `getEdges`
      // a fresh node object per edge it descends, so only a *contents*-keyed memo collapses the
      // repeat visits: without one the merge is rebuilt at every visit, which here is
      // 1 + 8 + 8^2 + 8^3 = 585 times, and grows as n^3.
      expect(mergeSpy).toHaveBeenCalledTimes(1)

      // Known limitation, pinned deliberately rather than asserted as desirable: the merge collapses
      // serializers of the same class, not distinct association names, so the number of *routes*
      // through the graph — and therefore the number of preload paths, each of which becomes its own
      // `preload(...)` call and its own query — is still (association count)^RECURSIVE_SERIALIZATION_MAX_REPEATS.
      // Deduping cannot reduce it: these 4,096 paths are all genuinely distinct. Removing the
      // combinatorial term requires building a preload *tree* rather than enumerating root-to-leaf
      // paths.
      expect(paths.length).toEqual(8 ** 4)
      expect(paths[0]).toEqual([
        [StiFanOutBase, 'kids0'],
        [StiFanOutBase, 'kids0'],
        [StiFanOutBase, 'kids0'],
        [StiFanOutBase, 'kids0'],
      ])
    })
  })
})
