import { ValidationType } from '../../decorators/validations/shared'
import Dream from '../../dream'
import isValid from './isValid'

export default function checkValidationsFor(dream: Dream) {
  const Base = dream.constructor as typeof Dream
  const validationErrors: { [key: string]: ValidationType[] } = {}
  dream.columns().forEach(column => {
    Base.validations
      .filter(
        // @ts-ignore
        validation => validation.column === column
      )
      .forEach(validation => {
        if (!isValid(dream, validation)) {
          validationErrors[validation.column] ||= []
          validationErrors[validation.column].push(validation.type)
        }
      })
  })

  return validationErrors
}
