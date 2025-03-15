import { camelizeString } from './camelize.js.js'
import capitalize from './capitalize.js.js'
import stringCase, { Pascalized } from './stringCasing.js.js'

export default function pascalize<const T, RT extends Pascalized<T>>(target: T): RT {
  return stringCase(target, pascalizeString)
}

function pascalizeString(str: string): string {
  return capitalize(camelizeString(str))
}
