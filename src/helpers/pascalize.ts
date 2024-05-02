import stringCase, { Pascalized } from './stringCasing'
import { camelizeString } from './camelize'
import capitalize from './capitalize'

export default function pascalize<const T, RT extends Pascalized<T>>(target: T): RT {
  return stringCase(target, pascalizeString)
}

function pascalizeString(str: string): string {
  return capitalize(camelizeString(str))
}
