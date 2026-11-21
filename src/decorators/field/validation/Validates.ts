import Dream from '../../../Dream.js'
import ValidatesCannotDeclareRegisteredValidation from '../../../errors/ValidatesCannotDeclareRegisteredValidation.js'
import { ValidationStatement, ValidationType } from '../../../types/validation.js'
import { DecoratorContext } from '../../DecoratorContextType.js'
import registerOnce from '../../helpers/registerOnce.js'

/**
 * The validation types a declaration registers on its own, which
 * `@deco.Validates` refuses, in its types and when the models load at boot:
 * `declaredShape` is registered by `@deco.JSON` and `@deco.Encrypted`, and
 * `requiredBelongsTo` by a `@deco.BelongsTo` that is not `optional`, whose
 * `optional` option alone decides whether the association may be absent.
 */
const REGISTERED_VALIDATION_TYPES = [
  'declaredShape',
  'requiredBelongsTo',
] as const satisfies readonly ValidationType[]

export type RegisteredValidationType = (typeof REGISTERED_VALIDATION_TYPES)[number]

/**
 * The validation types `@deco.Validates` accepts.
 */
export type DeclarableValidationType = Exclude<ValidationType, RegisteredValidationType>

export default function Validates<
  VT extends DeclarableValidationType,
  VTArgs extends VT extends 'numericality'
    ? {
        /** The minimum allowed value (inclusive). */
        min?: number
        /** The maximum allowed value (inclusive). */
        max?: number
      }
    : VT extends 'length'
      ? {
          /** The minimum allowed length (inclusive). */
          min: number
          /** The maximum allowed length (inclusive). */
          max?: number
        }
      : VT extends 'contains'
        ? string | RegExp
        : never,
>(type: VT, args?: VTArgs): any {
  return function (_: undefined, context: DecoratorContext) {
    const key = context.name

    context.addInitializer(function (this: Dream) {
      const dreamClass = this.constructor as typeof Dream
      if (
        dreamClass['globallyInitializingDecorators'] &&
        (REGISTERED_VALIDATION_TYPES as readonly ValidationType[]).includes(type)
      )
        throw new ValidatesCannotDeclareRegisteredValidation(
          dreamClass,
          key,
          type as RegisteredValidationType
        )

      validatesImplementation(this, key, type, args)
    })
  }
}

export function validatesImplementation<
  VT extends ValidationType,
  VTArgs extends VT extends 'numericality'
    ? { min?: number; max?: number }
    : VT extends 'length'
      ? { min: number; max?: number }
      : VT extends 'contains'
        ? string | RegExp
        : never,
>(target: Dream, key: string, type: VT, args?: VTArgs) {
  const t: typeof Dream = target.constructor as typeof Dream

  if (!t['globallyInitializingDecorators']) return

  registerOnce(t, 'validations', {
    type,
    column: key,
    options: extractValidationOptionsFromArgs(type, args),
  } satisfies ValidationStatement)
}

function extractValidationOptionsFromArgs(type: ValidationType, args: any) {
  switch (type) {
    case 'presence':
      return { presence: {} }

    case 'numericality':
      return {
        numericality: {
          max: args?.max,
          min: args?.min,
        },
      }

    case 'contains':
      if (!['String', 'RegExp'].includes(args.constructor.name))
        throw new ValidationInstantiationError(
          `When validating using "contains", the second argument must be a string or regular expression`
        )

      return { contains: { value: args as string | RegExp } }

    case 'length':
      if (typeof args === 'number') {
        return { length: { min: args } }
      } else if (args?.min) {
        return { length: { min: args.min, max: args?.max } }
      } else {
        throw new ValidationInstantiationError(`
          When validating using "length", the second argument must be a number representing
          the min length, or else an object expressing both min and max length, like so:

          @deco.Validates('length', { min: 4, max: 32 })
        `)
      }

    case 'requiredBelongsTo':
    case 'declaredShape':
      return {}

    default: {
      // protection so that if a new ValidationType is ever added, this will throw a type error at build time
      const _never: never = type
      throw new Error(`Unhandled ValidationType: ${_never as string}`)
    }
  }
}

export class ValidationInstantiationError extends Error {}
