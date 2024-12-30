import ValidationStatement from '../../decorators/validations/shared'
import Dream from '../../Dream'
import NonLoadedAssociation from '../../errors/associations/NonLoadedAssociation'

export default function checkSingleValidation(dream: Dream, validation: ValidationStatement) {
  let value: any
  try {
    value = (dream as any)[validation.column]
  } catch (error) {
    if ((error as any).constructor !== NonLoadedAssociation) throw error
  }

  let parsedFloat: number
  switch (validation.type) {
    case 'presence':
      return !isBlank(value)

    case 'numericality':
      if (isBlank(value)) return true
      if (isNaN(value)) return false

      parsedFloat = parseFloat(value)
      if (
        validation.options?.numericality?.max?.constructor === Number &&
        parsedFloat > validation.options?.numericality?.max
      )
        return false

      if (
        validation.options?.numericality?.min?.constructor === Number &&
        parsedFloat < validation.options?.numericality?.min
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
      break

    case 'length':
      return (
        value?.length &&
        value.length >= validation.options!.length!.min &&
        validation.options!.length!.max &&
        value.length <= validation.options!.length!.max
      )

    case 'requiredBelongsTo':
      return !!(value || (dream as any)[dream['associationMetadataMap']()[validation.column].foreignKey()])

    default:
      throw new Error(
        `Unhandled validation type found while running validations: ${validation.type as string}`
      )
  }
}

function isBlank(value: any) {
  return [undefined, null, ''].includes(value)
}
