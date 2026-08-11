import Dream from '../../Dream.js'
import { ViewModel } from '../../types/dream.js'
import {
  DreamModelSerializerType,
  InternalAnyRendersOneOrManyOpts,
  SimpleObjectSerializerType,
} from '../../types/serializer.js'
import { inferSerializersFromDreamClassOrViewModelClass } from './inferSerializerFromDreamOrViewModel.js'

/**
 * Only used when flatten: true, and the associated model is null, in which case,
 * we need something to determine the keys that will be flattened into the
 * rendering serializer
 */
export function serializerForAssociatedClass<ObjectType extends Dream | ViewModel>(
  object: ObjectType,
  associationName: string,
  options: InternalAnyRendersOneOrManyOpts
): DreamModelSerializerType | SimpleObjectSerializerType | null {
  if (options.serializer) return options.serializer
  if (!(object instanceof Dream)) return null

  const dream = object
  const association = dream['getAssociationMetadata'](associationName)
  const associatedClass = association!.modelCB()
  if (Array.isArray(associatedClass))
    throw new Error('rendersOne flatten is incompatible with a polymorphic belongs-to association')

  // Taking the first is only a narrowing when `associatedClass` is an STI base, where
  // inferSerializersFromDreamClassOrViewModelClass returns one serializer per child sorted by
  // sanitizedName. It is correct here because there is no associated row: this function is reached
  // only from SerializerRenderer's `flatten: true` branch for a *null* associated object, so no
  // child of the base is the right one — the row that would have decided is absent. (rendersMany
  // never reaches here and does not accept `flatten`.)
  //
  // It is observable, though, so it is not "nothing happens": the picked serializer is invoked and
  // its output spread into the parent's payload, so the parent JSON carries the
  // alphabetically-first child's flattened keys as nulls, and omits keys only a later-sorting child
  // would flatten. Unioning every child's serializer here — which is what buildSerializerPreloadPaths
  // does for preload paths — is meaningless: exactly one set of keys can be flattened into the
  // payload.
  return inferSerializersFromDreamClassOrViewModelClass(associatedClass, options.serializerKey)[0] ?? null
}
