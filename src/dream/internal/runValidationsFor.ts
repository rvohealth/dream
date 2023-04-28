import ValidationStatement from '../../decorators/validations/shared'
import Dream from '../../dream'
import isValid from './isValid'

export default function runValidationsFor(dream: Dream) {
  const Base = dream.constructor as typeof Dream
  dream.columns().forEach(column => {
    Base.validations
      .filter(
        // @ts-ignore
        validation => validation.column === column
      )
      .forEach(validation => runValidation(dream, validation))
  })
}

function runValidation(dream: Dream, validation: ValidationStatement) {
  if (!isValid(dream, validation)) addValidationError(dream, validation)
}

function addValidationError(dream: Dream, validation: ValidationStatement) {
  dream.errors[validation.column] ||= []
  dream.errors[validation.column].push(validation.type)
}
