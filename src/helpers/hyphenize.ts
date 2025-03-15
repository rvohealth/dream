import { snakeifyString } from './snakeify.js.js'
import stringCase, { Hyphenized } from './stringCasing.js.js'

export default function hyphenize<const T, RT extends Hyphenized<T>>(target: T): RT {
  return stringCase(target, hyphenizeString)
}

function hyphenizeString(str: string): string {
  return snakeifyString(str).replace(/_/g, '-')
}
