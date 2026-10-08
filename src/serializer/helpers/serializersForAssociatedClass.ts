import Dream from '../../Dream.js'
import compact from '../../helpers/compact.js'
import { ViewModelClass } from '../../types/dream.js'
import {
  DreamModelSerializerType,
  InternalAnyRendersOneOrManyOpts,
  SimpleObjectSerializerType,
} from '../../types/serializer.js'
import { inferSerializersFromDreamClassOrViewModelClass } from './inferSerializerFromDreamOrViewModel.js'

/**
 * Only used when flatten: true, and the associated object is null, in which case there is no
 * object to resolve a serializer from, but the renderer still needs the serializers whose keys it
 * renders as null in the parent's payload.
 *
 * Resolves, in order, to the `serializer` option, the serializer of the `dreamClass` or
 * `viewModelClass` option, or the serializer of each class `parentClass` declares the association
 * to: the one class of most associations, or every target class of a polymorphic BelongsTo, so
 * the renderer renders the union of their keys. Returns no serializers when none applies, e.g. a
 * non-association property without a `serializer` option, so the flattened association adds no
 * keys.
 */
export function serializersForAssociatedClass(
  parentClass: typeof Dream | null,
  associationName: string,
  options: InternalAnyRendersOneOrManyOpts
): (DreamModelSerializerType | SimpleObjectSerializerType)[] {
  if (options.serializer) return [options.serializer]

  const optionClass = options.dreamClass ?? options.viewModelClass
  let associatedClasses: (typeof Dream | ViewModelClass)[]

  if (optionClass) {
    associatedClasses = [optionClass]
  } else {
    const association = parentClass?.['getAssociationMetadata'](associationName)
    if (!association) return []

    const modelClassOrClasses = association.modelCB()
    associatedClasses = Array.isArray(modelClassOrClasses) ? modelClassOrClasses : [modelClassOrClasses]
  }

  // Each class contributes one serializer. For an STI base, inferSerializersFromDreamClassOrViewModelClass
  // returns one serializer per child sorted by sanitizedName, and only the first is taken, so the
  // parent JSON carries the alphabetically-first child's flattened keys as nulls and omits keys
  // only a later-sorting child would flatten. (rendersMany never reaches here and does not accept
  // `flatten`.)
  return compact(
    associatedClasses.map(
      associatedClass =>
        inferSerializersFromDreamClassOrViewModelClass(associatedClass, options.serializerKey, {
          // Reached only from SerializerRenderer's rendersOne branch, so the edge type is fixed. No
          // declaring serializer: the renderer holds the rendered attribute, not the serializer that
          // declared it.
          edge: { type: 'rendersOne', associationName },
        })[0]
    )
  )
}
