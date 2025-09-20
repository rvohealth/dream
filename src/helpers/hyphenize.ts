import { snakeifyString } from './snakeify.js'
import stringCase, { Hyphenized } from './stringCasing.js'

/**
 * Converts a string or the keys of an object to hyphen-case (kebab-case).
 *
 * Examples:
 *   hyphenize('HelloWorld_how_are___you') // 'hello-world-how-are-you'
 *   hyphenize('Hello.World') // 'hello.world'
 *   hyphenize('Hello/World') // 'hello/world'
 *   hyphenize({ helloWorld: 'howAreYou' }) // { 'hello-world': 'howAreYou' }
 *
 * @param target - The string or object to hyphenize
 * @returns The hyphenized string or object
 */
export default function hyphenize<const T, RT extends Hyphenized<T>>(target: T): RT {
  return stringCase(target, hyphenizeString)
}

function hyphenizeString(str: string): string {
  return snakeifyString(str).replace(/_/g, '-')
}
