import Dream from '../../Dream.js'
import { ViewModelClass } from '../../types/dream.js'
import { SerializerResolutionContext } from '../../types/serializer.js'
import serializerResolutionContextMessage from './serializerResolutionContextMessage.js'

/**
 * Raised when resolving a serializer key against a class yields an empty set of serializers.
 *
 * This is an internal-invariant failure, not a misconfiguration: an unresolvable serializer key
 * raises `MissingSerializersDefinitionForKey` (and a class with no `serializers` getter at all
 * raises `MissingSerializersDefinition`) while it is being resolved, and STI expansion always
 * yields at least one class, so there is no supported application shape that reaches this. It is
 * typed rather than a bare `Error` so that it can be asserted on, and so that the two callers that
 * guard the invariant raise the same thing.
 */
export default class NoSerializersResolvedForKey extends Error {
  constructor(
    private classDef: typeof Dream | ViewModelClass | null | undefined,
    private serializerKey: string,
    private resolutionContext?: SerializerResolutionContext | undefined
  ) {
    super()
  }

  public override get message() {
    const className =
      this.classDef === null || this.classDef === undefined
        ? String(this.classDef)
        : ((this.classDef as typeof Dream).globalName ?? this.classDef.name)

    return `
No serializers resolved for \`${className}\` under serializer key \`${this.serializerKey}\`

This should be impossible — a serializer key that cannot be resolved throws while it is being
resolved, before reaching here — and indicates a bug in Dream rather than a problem with your
application. Please report it.${serializerResolutionContextMessage(this.serializerKey, this.resolutionContext)}`
  }
}
