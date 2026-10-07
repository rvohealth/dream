import Dream from '../../Dream.js'
import {
  DreamModelSerializerType,
  InternalAnyRendersOneOrManyOpts,
  SimpleObjectSerializerType,
} from '../../types/serializer.js'
import { inferSerializersFromDreamClassOrViewModelClass } from './inferSerializerFromDreamOrViewModel.js'

/**
 * Only used when flatten: true, and the associated object is null, in which case there is no
 * object to resolve a serializer from, but the renderer still needs the serializer whose keys it
 * renders as null in the parent's payload.
 *
 * Resolves, in order, to the `serializer` option, the serializer of the `dreamClass` or
 * `viewModelClass` option, or the serializer of the class `parentClass` declares the association
 * to. Returns null when none applies, e.g. a non-association property without a `serializer`
 * option, so the flattened association adds no keys.
 */
export function serializerForAssociatedClass(
  parentClass: typeof Dream | null,
  associationName: string,
  options: InternalAnyRendersOneOrManyOpts
): DreamModelSerializerType | SimpleObjectSerializerType | null {
  if (options.serializer) return options.serializer

  let associatedClass = options.dreamClass ?? options.viewModelClass

  if (!associatedClass) {
    const association = parentClass?.['getAssociationMetadata'](associationName)
    if (!association) return null

    const modelClass = association.modelCB()
    if (Array.isArray(modelClass))
      throw new Error('rendersOne flatten is incompatible with a polymorphic belongs-to association')

    associatedClass = modelClass
  }

  // Taking the first is only a narrowing when `associatedClass` is an STI base, where
  // inferSerializersFromDreamClassOrViewModelClass returns one serializer per child sorted by
  // sanitizedName. It is correct here because there is no associated row: this function is reached
  // only from SerializerRenderer's `flatten: true` branch for a *null* associated object, so no
  // child of the base is the right one — the row that would have decided is absent. (rendersMany
  // never reaches here and does not accept `flatten`.)
  //
  // It is observable, though, so it is not "nothing happens": the parent JSON carries the
  // alphabetically-first child's flattened keys as nulls, and omits keys only a later-sorting child
  // would flatten. Unioning every child's serializer here — which is what buildSerializerPreloadPaths
  // does for preload paths — is meaningless: exactly one set of keys can be flattened into the
  // payload.
  return (
    inferSerializersFromDreamClassOrViewModelClass(associatedClass, options.serializerKey, {
      // Reached only from SerializerRenderer's rendersOne branch, so the edge type is fixed. No
      // declaring serializer: the renderer holds the rendered attribute, not the serializer that
      // declared it.
      edge: { type: 'rendersOne', associationName },
    })[0] ?? null
  )
}
