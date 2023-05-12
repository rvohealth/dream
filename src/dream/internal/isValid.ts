import ValidationStatement from '../../decorators/validations/shared'
import Dream from '../../dream'

export default function isValid(dream: Dream, validation: ValidationStatement) {
  const value = (dream as any)[validation.column]
  switch (validation.type) {
    case 'presence':
      return !isBlank(value)

    case 'numericality':
      if (isBlank(value)) return true
      if (isNaN(value)) return false

      const parsed = parseFloat(value)
      if (
        validation.options?.numericality?.max?.constructor === Number &&
        parsed > validation.options?.numericality?.max
      )
        return false

      if (
        validation.options?.numericality?.min?.constructor === Number &&
        parsed < validation.options?.numericality?.min
      )
        return false

      return true

    case 'contains':
      switch (validation.options!.contains!.value.constructor) {
        case String:
          return new RegExp(validation.options!.contains!.value).test(value)
        case RegExp:
          return (validation.options!.contains!.value as RegExp).test(value)
      }

    case 'length':
      const length = value?.length
      return (
        length &&
        length >= validation.options!.length!.min &&
        validation.options!.length!.max &&
        length <= validation.options!.length!.max
      )

    case 'requiredBelongsTo':
      return !!(value || (dream as any)[dream.associationMap[validation.column].foreignKey()])

    default:
      throw `Unhandled validation type found while running validations: ${validation.type}`
  }
}

function isBlank(value: any) {
  return [undefined, null, ''].includes(value)
}
