import Dream from '../../Dream.js'
import { ViewModel } from '../../types/dream.js'
import { SerializerResolutionContext } from '../../types/serializer.js'
import serializerResolutionContextMessage from './serializerResolutionContextMessage.js'

/**
 * @internal
 *
 * Raised when a Dream or view model reaches serializer resolution without a
 * `serializers` getter at all.
 *
 * Not exported from `@rvoh/dream/errors`. A model with no serializers is a
 * setup mistake in the application's own code, surfaced the first time
 * something tries to render it — not a runtime condition to catch.
 */
export default class MissingSerializersDefinition extends Error {
  /**
   * ECMAScript-private (`#`) rather than TypeScript-`private`. A TypeScript `private` parameter
   * property is a real, enumerable own property at runtime, so `Object.keys(err)` and
   * `JSON.stringify(err)` on an application's error-logging path would report the diagnostic state
   * threaded in here. `#` fields are invisible to both, keeping what a log records to the message.
   * `viewModel` keeps its existing form.
   */
  readonly #serializerKey: string | undefined
  readonly #resolutionContext: SerializerResolutionContext | undefined

  constructor(
    private viewModel: Dream | ViewModel,
    serializerKey?: string,
    resolutionContext?: SerializerResolutionContext
  ) {
    super()
    this.#serializerKey = serializerKey
    this.#resolutionContext = resolutionContext
  }

  public override get message() {
    const className = (this.viewModel as Dream)?.sanitizedConstructorName ?? this.viewModel.constructor.name

    return `
Missing serializers definition on class \`${className}\`

Try something like this in your ${className}'s serializer getter:

class ${className} {
  public get serializers(): DreamSerializers<${className}> {
    return {
      default: '${className}Serializer'
    }
  }
  ...
}${serializerResolutionContextMessage(this.#serializerKey, this.#resolutionContext)}`
  }
}
