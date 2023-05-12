import ValidationStatement, { ValidationType } from './shared'

export default function Validates<
  VT extends ValidationType,
  VTArgs extends VT extends 'numericality'
    ? { min?: number; max?: number }
    : VT extends 'length'
    ? { min: number; max?: number }
    : VT extends 'contains'
    ? string | RegExp
    : never
>(type: VT, args?: VTArgs): any {
  return function (target: any, key: string, _: any) {
    if (!Object.getOwnPropertyDescriptor(target.constructor, 'validations'))
      target.constructor.validations = [] as ValidationStatement[]

    target.constructor.validations.push({
      type,
      column: key,
      options: extractValidationOptionsFromArgs(type, args),
    } as ValidationStatement)
  }
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
        throw `When validating using "contains", the second argument must be a string or regular expression`

      return { contains: { value: args as string | RegExp } }

    case 'length':
      if (typeof args === 'number') {
        return { length: { min: args } }
      } else if (args?.min) {
        return { length: { min: args.min, max: args?.max } }
      } else {
        throw `
          When validating using "length", the second argument must be a number representing
          the min length, or else an object expressing both min and max length, like so:
          
          @Validates('length', { min: 4, max: 32 })
        `
      }

    case 'requiredBelongsTo':
      return {}
  }
}
