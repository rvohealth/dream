import Dream from '../../../Dream.js'
import { ValidationStatement, ValidationType } from '../../../types/validation.js'
import { DecoratorContext } from '../../DecoratorContextType.js'

export default function Validates<
  VT extends ValidationType,
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

  if (!Object.getOwnPropertyDescriptor(t, 'validations')) {
    // This pattern allows `validations` on a base STI class and on
    // child STI classes. The new `validations` property will be created
    // on the child STI class, but it will include all the `validations`
    // already declared on the base STI class.
    t['validations'] = [...t['validations']]
  }

  const validation: ValidationStatement = {
    type,
    column: key,
    options: extractValidationOptionsFromArgs(type, args),
  }

  // an STI child inherits its base's `validations` via the copy above, and the
  // base's field initializers run again while the child is globally
  // initialized, so a validation already registered is skipped rather than
  // checked (and its error reported) twice
  if (t['validations'].some(existing => isSameValidation(existing, validation))) return
  ;(t['validations'] as ValidationStatement[]).push(validation)
}

function isSameValidation(a: ValidationStatement, b: ValidationStatement): boolean {
  if (a.type !== b.type || a.column !== b.column) return false

  switch (b.type) {
    case 'presence':
    case 'requiredBelongsTo':
      return true

    case 'numericality':
      return (
        a.options?.numericality?.min === b.options?.numericality?.min &&
        a.options?.numericality?.max === b.options?.numericality?.max
      )

    case 'length':
      return (
        a.options?.length?.min === b.options?.length?.min && a.options?.length?.max === b.options?.length?.max
      )

    case 'contains':
      return isSameContainsValue(a.options?.contains?.value, b.options?.contains?.value)

    default: {
      // protection so that if a new ValidationType is ever added, this will throw a type error at build time
      const _never: never = b.type
      throw new Error(`Unhandled ValidationType: ${_never as string}`)
    }
  }
}

function isSameContainsValue(a: string | RegExp | undefined, b: string | RegExp | undefined): boolean {
  if (a instanceof RegExp && b instanceof RegExp) return a.source === b.source && a.flags === b.flags
  return a === b
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
      return {}

    default: {
      // protection so that if a new ValidationType is ever added, this will throw a type error at build time
      const _never: never = type
      throw new Error(`Unhandled ValidationType: ${_never as string}`)
    }
  }
}

export class ValidationInstantiationError extends Error {}
