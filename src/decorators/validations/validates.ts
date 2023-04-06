import ValidationStatement, { ValidationType } from './shared'

export default function Validates(type: ValidationType, args?: any): any {
  return function (target: any, key: string, _: any) {
    target.constructor.validations = [
      ...target.constructor.validations,
      {
        type,
        column: key,
        options: extractValidationOptionsFromArgs(type, args),
      } as ValidationStatement,
    ]
  }
}

function extractValidationOptionsFromArgs(type: ValidationType, args: any) {
  switch (type) {
    case 'presence':
      return { presence: {} }

    case 'contains':
      if (!['String', 'RegExp'].includes(args.constructor.name))
        throw `When validating using "contains", the second argument must be a string or regular expression`

      return { contains: { value: args as string | RegExp } }
  }
}
