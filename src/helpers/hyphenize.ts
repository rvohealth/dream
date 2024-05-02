import stringCase, { Hyphenized } from './stringCasing'
import { snakeifyString } from './snakeify'

export default function hyphenize<const T, RT extends Hyphenized<T>>(target: T): RT {
  return stringCase(target, hyphenizeString)
}

function hyphenizeString(str: string): string {
  return snakeifyString(str).replace(/_/g, '-')
}
