import Dream from '../../Dream.js'
import { ValidationStatement } from '../../types/validation.js'
import checkSingleValidation from './checkSingleValidation.js'

export default function runValidations(dream: Dream) {
  const Base = dream.constructor as typeof Dream

  Base['validations'].forEach(validation => runValidation(dream, validation))

  for (const methodName of Base['customValidations']) {
    ;(dream as any)[methodName]()
  }
}

function runValidation(dream: Dream, validation: ValidationStatement) {
  if (!checkSingleValidation(dream, validation)) dream.addError(validation.column, validation.type)
}
