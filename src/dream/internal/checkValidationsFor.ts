import ValidationStatement, { ValidationType } from '../../decorators/validations/shared'
import Dream from '../../dream'
import isValid from './isValid'

export default function checkValidationsFor(dream: Dream) {
  const validationErrors: { [key: string]: ValidationType[] } = {}
  const Base = dream.constructor as typeof Dream
  Base.validations.forEach(validation => runValidation(dream, validation, validationErrors))
  return validationErrors
}

function runValidation(
  dream: Dream,
  validation: ValidationStatement,
  errors: { [key: string]: ValidationType[] }
) {
  if (!isValid(dream, validation)) addValidationError(errors, validation)
}

function addValidationError(errors: { [key: string]: ValidationType[] }, validation: ValidationStatement) {
  errors[validation.column] ||= []
  errors[validation.column].push(validation.type)
}
