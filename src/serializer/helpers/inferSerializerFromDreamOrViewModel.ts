import DreamApp from '../../dream-app/index.js'
import Dream from '../../Dream.js'
import MissingSerializersDefinition from '../../errors/serializers/MissingSerializersDefinition.js'
import MissingSerializersDefinitionForKey from '../../errors/serializers/MissingSerializersDefinitionForKey.js'
import NoGlobalSerializerForSpecifiedKey from '../../errors/serializers/NoGlobalSerializerForSpecifiedKey.js'
import NonDreamSerializerDerivedFromGlobalSerializerForSpecifiedKey from '../../errors/serializers/NonDreamSerializerDerivedFromGlobalSerializerForSpecifiedKey.js'
import NoSerializersResolvedForKey from '../../errors/serializers/NoSerializersResolvedForKey.js'
import compact from '../../helpers/compact.js'
import expandStiClasses from '../../helpers/sti/expandStiClasses.js'
import uniq from '../../helpers/uniq.js'
import { ViewModel, ViewModelClass } from '../../types/dream.js'
import {
  DreamModelSerializerType,
  SerializerResolutionContext,
  SerializerType,
  SimpleObjectSerializerType,
} from '../../types/serializer.js'
import isDreamSerializer from './isDreamSerializer.js'

export const DEFAULT_SERIALIZER_KEY = 'default'

/**
 * `resolutionContext` says how resolution reached `obj` — the `rendersOne`/`rendersMany` edge that
 * led here, and the STI base it was expanded from. It is threaded down purely so that the errors
 * below can name the route instead of only the class, and it is optional so that a caller with no
 * route to describe (and every existing caller outside this repo) is unaffected. See
 * `SerializerResolutionContext`.
 */
export default function inferSerializerFromDreamOrViewModel<
  T extends Dream | ViewModel | null | undefined,
  ReturnType extends T extends null | undefined ? null : T extends Dream | ViewModel ? SerializerType : never,
>(
  obj: T,
  serializerKey: string | undefined = DEFAULT_SERIALIZER_KEY,
  resolutionContext?: SerializerResolutionContext
): ReturnType {
  if (!obj) return null as ReturnType
  const serializers = (obj as ViewModel).serializers
  if (!serializers) throw new MissingSerializersDefinition(obj, serializerKey, resolutionContext)

  const serializerOrGlobalName = serializers[serializerKey]
  if (!serializerOrGlobalName)
    throw new MissingSerializersDefinitionForKey(obj, serializerKey, resolutionContext)

  if (isDreamSerializer(serializerOrGlobalName)) return serializerOrGlobalName as unknown as ReturnType
  const globalName = serializerOrGlobalName as string

  const dreamApp = DreamApp.getOrFail()
  const serializer = dreamApp.serializers[globalName]
  if (!serializer)
    throw new NoGlobalSerializerForSpecifiedKey(obj, serializerKey, globalName, resolutionContext)
  if (!isDreamSerializer(serializer))
    throw new NonDreamSerializerDerivedFromGlobalSerializerForSpecifiedKey(
      obj,
      serializerKey,
      globalName,
      serializer,
      resolutionContext
    )

  return serializer as ReturnType
}

export function inferSerializersFromDreamClassOrViewModelClass(
  classDef: typeof Dream | ViewModelClass | null | undefined,
  serializerKey: string | undefined = undefined,
  resolutionContext?: SerializerResolutionContext
): (DreamModelSerializerType | SimpleObjectSerializerType)[] {
  if (!classDef) return []
  const classes = expandStiClasses(classDef)

  // This is the one place that knows *whether* the class an error ends up naming came from STI
  // expansion: below this line the class the caller passed is gone, replaced by one child per
  // iteration, and every downstream error names a child. Identity rather than `isSTIBase` because
  // `classDef` may be a ViewModelClass, which `expandStiClasses` hands straight back.
  const expandedFromStiBase = classes.length !== 1 || classes[0] !== classDef

  const childResolutionContext: SerializerResolutionContext | undefined = expandedFromStiBase
    ? { ...resolutionContext, stiBase: stiBaseName(classDef) }
    : resolutionContext

  const serializers = classes.map(classDef =>
    inferSerializerFromDreamOrViewModel(classDef.prototype, serializerKey, childResolutionContext)
  )

  return uniq(compact(serializers))
}

function stiBaseName(classDef: typeof Dream | ViewModelClass): string {
  return (classDef as typeof Dream).sanitizedName ?? classDef.name
}

/**
 * As `inferSerializersFromDreamClassOrViewModelClass`, but guarantees a non-empty result.
 *
 * The guard is unreachable today, and deliberately not phrased as "no serializer found for key": a
 * serializer key that a class does not register throws `MissingSerializersDefinitionForKey` (and a
 * class with no `serializers` getter at all throws `MissingSerializersDefinition`) from inside the
 * inference above, and `expandStiClasses` always yields at least one class. It exists only so that
 * a future change to any of those cannot turn an unresolvable serializer key into a silently empty
 * serializer set — which, for the callers below, means a silently empty preload set and a
 * `NonLoadedAssociation` at render rather than an error naming the real problem.
 *
 * Used by everything that walks a serializer graph rooted on a class rather than an instance —
 * preload-path building and serialization display — so that they raise one typed error between
 * them.
 */
export function inferSerializersFromDreamClassOrViewModelClassOrFail(
  classDef: typeof Dream | ViewModelClass | null | undefined,
  serializerKey: string,
  resolutionContext?: SerializerResolutionContext
): (DreamModelSerializerType | SimpleObjectSerializerType)[] {
  const serializers = inferSerializersFromDreamClassOrViewModelClass(
    classDef,
    serializerKey,
    resolutionContext
  )
  if (serializers.length === 0)
    throw new NoSerializersResolvedForKey(classDef, serializerKey, resolutionContext)
  return serializers
}
