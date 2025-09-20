import { camelizeString } from './camelize.js'
import capitalize from './capitalize.js'
import stringCase, { Pascalized } from './stringCasing.js'

/**
 * Converts a string or the keys of an object to PascalCase.
 *
 * Examples:
 *   pascalize('helloWorld-how-are-you') // 'HelloWorldHowAreYou'
 *   pascalize('hello world') // 'HelloWorld'
 *   pascalize('hello    world') // 'HelloWorld'
 *   pascalize({ hello_world: 'how_are_you' }) // { HelloWorld: 'how_are_you' }
 *
 * @param target - The string or object to pascalize
 * @returns The pascalized string or object
 */
export default function pascalize<const T, RT extends Pascalized<T>>(target: T): RT {
  return stringCase(target, pascalizeString)
}

function pascalizeString(str: string): string {
  return capitalize(camelizeString(str))
}
