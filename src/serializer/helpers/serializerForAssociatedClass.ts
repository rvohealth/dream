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
  if (!(object as Dream).isDreamInstance) return null

  const dream = object as Dream
  const association = dream['getAssociationMetadata'](associationName)
  const associatedClasses = association!.modelCB()
  const associatedClass = Array.isArray(associatedClasses) ? associatedClasses[0] : associatedClasses
  return inferSerializersFromDreamClassOrViewModelClass(associatedClass, options.serializerKey)[0] ?? null
}
