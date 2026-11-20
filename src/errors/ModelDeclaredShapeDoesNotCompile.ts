import Dream from '../Dream.js'
import { ModelShapeDecoratorName } from './ModelDeclaredShapeContainsReference.js'

/**
 * Thrown when a shape a model declares (`@deco.JSON`, `@deco.Virtual` or
 * `@deco.Encrypted`) cannot be compiled into the validator Dream checks the
 * property's value with: a `pattern` that is not a valid regular expression
 * under the `u` flag, a union `type` array, a keyword where a schema belongs,
 * AJV's `$async: true` (which compiles to an asynchronous validator, while
 * Dream checks a declared shape synchronously), and so on. `DreamApp.init`
 * compiles every declared shape, so this is thrown at boot; after a boot that
 * bypassed the integrity checks, it is thrown when the shape is first checked.
 * Not exported: an application fixes the declaration rather than catching
 * this.
 */
export default class ModelDeclaredShapeDoesNotCompile extends Error {
  constructor(
    public dreamClass: typeof Dream,
    public property: string,
    public decoratorName: ModelShapeDecoratorName,
    public ajvMessage: string,
    options?: ErrorOptions
  ) {
    super(undefined, options)
  }

  public override get message() {
    return `
The shape passed to ${this.decoratorName} on ${this.dreamClass.name}#${this.property} cannot be
compiled into the validator Dream checks the property's value with (and
Psychic's Params.for checks request params with). The validator (JSON Schema
2020-12, strict types, synchronous) failed to compile with:

  ${this.ajvMessage}

Declare a shape that compiles: write a \`pattern\` that is a valid regular
expression under the \`u\` flag (escape only characters that need escaping),
use \`anyOf\` rather than a \`type\` array to admit more than one non-null
type, give \`properties\` a map of property names to shapes, and remove
\`$async\`, since Dream checks a declared shape synchronously.`
  }
}
