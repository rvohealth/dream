import Dream from '../../Dream.js'
import uniq from '../../helpers/uniq.js'
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
 * Resolves, in order, to the `serializer` option, the serializers of the `dreamClass` or
 * `viewModelClass` option, or the serializers of each class `parentClass` declares the association
 * to: the one class of most associations, or every target class of a polymorphic BelongsTo. A
 * class that is an STI base contributes the serializer of every one of its children, since the
 * association renders with whichever child it holds when present. The renderer renders the union
 * of all their keys, each key once. Returns no serializers when none applies, e.g. a
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

  // Every serializer of every class: one for a plain class, and one per child (sorted by
  // sanitizedName) for an STI base, so the parent JSON carries the flattened keys of every child
  // as nulls, as it carries those of every target class of a polymorphic BelongsTo. Several classes
  // may resolve to the same serializer; the renderer walks each serializer once either way.
  // (rendersMany never reaches here and does not accept `flatten`.)
  return uniq(
    associatedClasses.flatMap(associatedClass =>
      inferSerializersFromDreamClassOrViewModelClass(associatedClass, options.serializerKey, {
        // Reached only from SerializerRenderer's rendersOne branch, so the edge type is fixed. No
        // declaring serializer: the renderer holds the rendered attribute, not the serializer that
        // declared it.
        edge: { type: 'rendersOne', associationName },
      })
    )
  )
}
