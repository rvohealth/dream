import Dream from '../../../Dream.js'
import { DecoratorContext } from '../../DecoratorContextType.js'
import ValidationStatement, { ValidationType } from './shared.js'

export default function Validates<
  VT extends ValidationType,
  VTArgs extends VT extends 'numericality'
    ? { min?: number; max?: number }
    : VT extends 'length'
      ? { min: number; max?: number }
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
  ;(t['validations'] as ValidationStatement[]).push({
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

          @Validates('length', { min: 4, max: 32 })
        `)
      }

    case 'requiredBelongsTo':
      return {}

    default:
      throw new Error(`Unhandled validation type when caching options: ${type as string}`)
  }
}

export class ValidationInstantiationError extends Error {}
