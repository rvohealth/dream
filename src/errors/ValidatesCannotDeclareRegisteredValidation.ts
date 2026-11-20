import type { RegisteredValidationType } from '../decorators/field/validation/Validates.js'
import Dream from '../Dream.js'

export default class ValidatesCannotDeclareRegisteredValidation extends Error {
  constructor(
    public dreamClass: typeof Dream,
    public property: string,
    public validationType: RegisteredValidationType
  ) {
    super()
  }

  public override get message() {
    return `
@deco.Validates('${this.validationType}') on ${this.dreamClass.name}#${this.property} declares a validation
that only a declaration registers. ${REGISTERED_BY[this.validationType]}

${FIX[this.validationType]}`
  }
}

const REGISTERED_BY: Record<RegisteredValidationType, string> = {
  declaredShape: `@deco.JSON and @deco.Encrypted register it, checking the
property's value against the shape they declare.`,
  requiredBelongsTo: `@deco.BelongsTo registers it for an association that is not
declared \`optional: true\`, the single source of truth for whether the
association may be absent.`,
}

const FIX: Record<RegisteredValidationType, string> = {
  declaredShape: `Remove the @deco.Validates('declaredShape') declaration. To check the value
against a shape, declare the shape with @deco.JSON on a json/jsonb column, or
with @deco.Encrypted({ openapi }) on an encrypted property.`,
  requiredBelongsTo: `On a @deco.BelongsTo association, drop \`optional: true\` from the BelongsTo
to require the association, and remove the @deco.Validates('requiredBelongsTo')
declaration. On any other property, remove the declaration.`,
}
