import ValidationStatement from '../../decorators/validations/shared'
import Dream from '../../dream'

export default function isValid(dream: Dream, validation: ValidationStatement) {
  switch (validation.type) {
    case 'presence':
      return ![undefined, null, ''].includes((dream as any)[validation.column])

    case 'contains':
      switch (validation.options!.contains!.value.constructor) {
        case String:
          return new RegExp(validation.options!.contains!.value).test((dream as any)[validation.column])
        case RegExp:
          return (validation.options!.contains!.value as RegExp).test((dream as any)[validation.column])
      }

    case 'length':
      const length = (dream as any)[validation.column]?.length
      return (
        length &&
        length >= validation.options!.length!.min &&
        validation.options!.length!.max &&
        length <= validation.options!.length!.max
      )

    case 'requiredBelongsTo':
      return !!(
        (dream as any)[validation.column] ||
        (dream as any)[dream.associationMap[validation.column].foreignKey()]
      )

    default:
      throw `Unhandled validation type found while running validations: ${validation.type}`
  }
}
