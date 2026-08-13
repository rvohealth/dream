import Dream from '../../Dream.js'
import { ViewModel } from '../../types/dream.js'
import { SerializerResolutionContext } from '../../types/serializer.js'
import serializerResolutionContextMessage from './serializerResolutionContextMessage.js'

export default class MissingSerializersDefinition extends Error {
  /**
   * ECMAScript-private (`#`) rather than TypeScript-`private`, unlike the four internal siblings of
   * this error. A TypeScript `private` parameter property is a real, enumerable own property at
   * runtime, and this is the one serializer-resolution error the package exports
   * (`src/package-exports/errors.ts`) — so `Object.keys(err)` and `JSON.stringify(err)` on a
   * consumer's error-logging path would newly report the diagnostic state threaded in here. `#`
   * fields are invisible to both, so the exported error's observable runtime shape is unchanged.
   * `viewModel` keeps its existing form: it predates this and narrowing it is not this change.
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
