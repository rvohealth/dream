import Dream from '../../../src/Dream.js'
import { clearResolvedSerializerAssociationEdgesCache } from '../../../src/dream/internal/resolveSerializerAssociationEdges.js'
import { clearSerializerPreloadPathsCache } from '../../../src/dream/Query.js'
import MissingSerializersDefinition from '../../../src/errors/serializers/MissingSerializersDefinition.js'
import MissingSerializersDefinitionForKey from '../../../src/errors/serializers/MissingSerializersDefinitionForKey.js'
import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import inferSerializerFromDreamOrViewModel from '../../../src/serializer/helpers/inferSerializerFromDreamOrViewModel.js'
import Balloon from '../../../test-app/app/models/Balloon.js'
import Mylar from '../../../test-app/app/models/Balloon/Mylar.js'
import BalloonLine from '../../../test-app/app/models/BalloonLine.js'
import Collar from '../../../test-app/app/models/Collar.js'
import Composition from '../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset.js'
import LocalizedText from '../../../test-app/app/models/LocalizedText.js'

describe('serializer resolution errors name how resolution reached the failing class', () => {
  context('at render time', () => {
    // The four message assertions in spec/unit/query/preloadFor.spec.ts all run through
    // `Composition.query().preloadFor('default')`, so none of them reaches SerializerRenderer.
    // These do: rendering a *populated* association is the only way the renderer resolves a
    // serializer at all, so it is also the only way a render-time resolution failure happens.
    context('for a populated rendersMany', () => {
      it('names the serializer key and the rendersMany that led to the failing class', () => {
        const render = () => renderCompositionWithPopulatedAssets()

        expect(render).toThrow(MissingSerializersDefinition)
        expect(render).toThrow('Missing serializers definition on class `CompositionAsset`')
        expect(render).toThrow(`Serializer resolution context:

  serializer key:  default
  reached through: rendersMany \`compositionAssets\``)
      })

      // The renderer holds the rendered attribute but not the serializer object that declared it,
      // so this half of the context is deliberately absent here and present on the preload path
      // below. A message that printed an empty slot for it would be worse than one that omits it.
      it('does not claim a declaring serializer', () => {
        const render = () => renderCompositionWithPopulatedAssets()

        // Anchors: without these the example passes if the render stops failing, or if the context
        // block disappears entirely, since a render that throws nothing throws no `declared by`.
        expect(render).toThrow(MissingSerializersDefinition)
        expect(render).toThrow(/Serializer resolution context:/)
        expect(render).not.toThrow(/declared by/)
      })

      it('does not claim an STI base, since no expansion produced CompositionAsset', () => {
        const render = () => renderCompositionWithPopulatedAssets()

        expect(render).toThrow(MissingSerializersDefinition)
        expect(render).toThrow(/Serializer resolution context:/)
        expect(render).not.toThrow(/expanded from/)
      })
    })

    context('for a populated rendersOne', () => {
      it('names the serializer key and the rendersOne that led to the failing class', () => {
        const composition = Composition.new({ id: '1' })
        composition.mainCompositionAsset = CompositionAsset.new({ id: '2' })

        const MySerializer = (data: Composition) =>
          DreamSerializer(Composition, data).rendersOne('mainCompositionAsset')

        const render = () => MySerializer(composition).render()

        expect(render).toThrow(MissingSerializersDefinition)
        expect(render).toThrow(`Serializer resolution context:

  serializer key:  default
  reached through: rendersOne \`mainCompositionAsset\``)
      })
    })

    // A populated association resolves against the *instance*, so STI expansion never happens on
    // either path above. The one render-time route that expands is the `flatten: true` branch for a
    // *null* associated object, which has no row to resolve against and so resolves against the
    // association's class instead. Collar's `balloon` is the STI base Balloon, so the class the
    // error names is a child that only exists because expandStiClasses produced it.
    context(
      'for a flattened rendersOne whose associated object is null and whose class is an STI base',
      () => {
        it('names the STI base alongside the edge', () => {
          withSerializersOverride(Mylar, {}, () => {
            const render = () => renderCollarWithNullFlattenedBalloon()

            expect(render).toThrow(MissingSerializersDefinitionForKey)
            expect(render).toThrow('Missing serializers definition for `default` on class `Mylar`')
            expect(render).toThrow(`Serializer resolution context:

  serializer key:  default
  reached through: rendersOne \`balloon\`
  expanded from:   the STI base Balloon`)
          })
        })

        // Still render time, so still no serializer object in scope to name as the declarer — the STI
        // line arriving does not drag the declaring serializer in with it.
        it('does not claim a declaring serializer', () => {
          withSerializersOverride(Mylar, {}, () => {
            const render = () => renderCollarWithNullFlattenedBalloon()

            expect(render).toThrow(MissingSerializersDefinitionForKey)
            expect(render).toThrow(/Serializer resolution context:/)
            expect(render).not.toThrow(/declared by/)
          })
        })
      }
    )
  })

  context('while building preload paths', () => {
    it('names the rendersMany edge and the serializer that declares it', () => {
      expect(() => Composition.query().preloadFor('default')).toThrow(`Serializer resolution context:

  serializer key:  default
  reached through: rendersMany \`compositionAssets\`, declared by CompositionSerializer`)
    })

    // BalloonLineSerializer renders `balloon`, an STI base, so the class every downstream error
    // names is a child that exists only because expandStiClasses produced it. Without the STI line
    // the message names Mylar with nothing to explain where Mylar came from — Balloon is what the
    // application wrote.
    context('when STI expansion produced the failing class', () => {
      it('names the STI base alongside the edge', () => {
        withSerializersOverride(Mylar, {}, () => {
          expect(() => BalloonLine.query().preloadFor('default')).toThrow(MissingSerializersDefinitionForKey)
          expect(() => BalloonLine.query().preloadFor('default')).toThrow(
            'Missing serializers definition for `default` on class `Mylar`'
          )
          expect(() => BalloonLine.query().preloadFor('default')).toThrow(`Serializer resolution context:

  serializer key:  default
  reached through: rendersOne \`balloon\`, declared by BalloonLineSerializer
  expanded from:   the STI base Balloon`)
        })
      })
    })

    // Nothing about the context is hardcoded to the default key: this route resolves `stiUnion`,
    // through an edge that itself declares `serializerKey: 'stiUnion'`.
    context('for a non-default serializer key', () => {
      it('names the key resolution was running under', () => {
        withSerializersOverride(Mylar, { default: 'Balloon/MylarSerializer' }, () => {
          expect(() => BalloonLine.query().preloadFor('stiUnion')).toThrow(`Serializer resolution context:

  serializer key:  stiUnion
  reached through: rendersOne \`balloon\`, declared by BalloonLineStiUnionSerializer
  expanded from:   the STI base Balloon`)
        })
      })
    })
  })

  // The root entry points resolve the class the caller named, so nothing led there. The message
  // prints no edge at all rather than an empty or placeholder one.
  context('at a root entry point, where no edge led to the failing class', () => {
    it('names the serializer key and no edge', () => {
      withSerializersOverride(Composition, {}, () => {
        expect(() => Composition.query().preloadFor('default')).toThrow(MissingSerializersDefinitionForKey)
        expect(() => Composition.query().preloadFor('default')).toThrow(`Serializer resolution context:

  serializer key:  default`)
        expect(() => Composition.query().preloadFor('default')).not.toThrow(/reached through/)
        expect(() => Composition.query().preloadFor('default')).not.toThrow(/expanded from/)
      })
    })

    context('when the root class is an STI base', () => {
      it('names the STI base and still no edge', () => {
        withSerializersOverride(Mylar, {}, () => {
          expect(() => Balloon.query().preloadFor('default')).toThrow(
            'Missing serializers definition for `default` on class `Mylar`'
          )
          expect(() => Balloon.query().preloadFor('default')).toThrow(`Serializer resolution context:

  serializer key:  default
  expanded from:   the STI base Balloon`)
          expect(() => Balloon.query().preloadFor('default')).not.toThrow(/reached through/)
        })
      })
    })
  })

  // MissingSerializersDefinition is the only one of the five resolution errors the package exports
  // (src/package-exports/errors.ts), and this change widened its constructor. The single production
  // call site passes all three arguments, so without these two examples nothing in the repo
  // exercises the narrower call and the compatibility promise has no guard.
  context('the exported MissingSerializersDefinition constructor', () => {
    it('still accepts the single argument it took before, and renders no context block for it', () => {
      // Load-bearing at compile time as well as at runtime: `spec/**/*` is inside
      // tsconfig.esm.build.test-app.json's `include`, so making either new parameter required breaks
      // `pnpm build:test-app` on this line.
      const error = new MissingSerializersDefinition(CompositionAsset.new({ id: '1' }))

      expect(error.message).toContain('Missing serializers definition on class `CompositionAsset`')
      expect(error.message).not.toContain('Serializer resolution context:')
    })

    it('accepts the widened three-argument form and renders the context', () => {
      const error = new MissingSerializersDefinition(CompositionAsset.new({ id: '1' }), 'summary', {
        edge: { type: 'rendersMany', associationName: 'compositionAssets' },
      })

      expect(error.message).toContain(`Serializer resolution context:

  serializer key:  summary
  reached through: rendersMany \`compositionAssets\``)
    })
  })
})

/**
 * CompositionAsset declares no `serializers` getter at all, so rendering a Composition whose
 * `compositionAssets` are populated fails while resolving one of them. `passthroughCurrentLocalizedText`
 * is set because CompositionSerializer renders it too and reading an unloaded association throws
 * NonLoadedAssociation before the failure under test is reached.
 */
function renderCompositionWithPopulatedAssets() {
  const composition = Composition.new({ id: '1' })
  composition.compositionAssets = [CompositionAsset.new({ id: '2' })]
  composition.passthroughCurrentLocalizedText = null as unknown as LocalizedText

  const serializer = inferSerializerFromDreamOrViewModel(composition, 'default')
  return serializer(composition as never).render()
}

/**
 * `Collar.balloon` is a belongs-to whose target is the STI base Balloon, and `flatten: true` with a
 * null associated object is the only render-time route that resolves against a *class* rather than
 * an instance — which is what makes STI expansion, and therefore the STI line, reachable here. It
 * is Collar rather than BalloonLine because the association has to tolerate being null: BalloonLine
 * declares `balloon` non-optional, so reading it as null raises MissingRequiredBelongsToAssociation
 * before the serializer resolves anything. The association is assigned explicitly because reading
 * an *unloaded* one raises NonLoadedAssociation, equally early.
 */
function renderCollarWithNullFlattenedBalloon() {
  const collar = Collar.new({ id: '1' })
  collar.balloon = null as unknown as Balloon

  const MySerializer = (data: Collar) =>
    DreamSerializer(Collar, data).rendersOne('balloon', { flatten: true })

  return MySerializer(collar).render()
}

/**
 * Replaces a model's `serializers` getter for the duration of `cb`, restoring whatever descriptor
 * was there before — the models used here define one on their own prototype, so deleting rather
 * than restoring would leave the class broken for every later spec file.
 *
 * Both serializer caches are cleared on the way in as well as on the way out: neither the
 * resolved-edges memo nor Query's preload-path cache keys on the getter, so a resolution that
 * succeeded in an earlier example would otherwise be served from cache and never reach the getter
 * installed here.
 */
function withSerializersOverride(
  dreamClass: typeof Dream,
  serializers: Record<string, string>,
  cb: () => void
) {
  const original = Object.getOwnPropertyDescriptor(dreamClass.prototype, 'serializers')

  Object.defineProperty(dreamClass.prototype, 'serializers', {
    configurable: true,
    get: () => serializers,
  })
  clearSerializerCaches()

  try {
    cb()
  } finally {
    if (original) Object.defineProperty(dreamClass.prototype, 'serializers', original)
    else Reflect.deleteProperty(dreamClass.prototype, 'serializers')
    clearSerializerCaches()
  }
}

function clearSerializerCaches() {
  clearResolvedSerializerAssociationEdgesCache()
  clearSerializerPreloadPathsCache()
}
