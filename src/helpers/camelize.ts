import stringCase, { Camelized } from './stringCasing.js'
import uncapitalize from './uncapitalize.js'

/**
 * Converts a string or the keys of an object to camelCase.
 *
 * Examples:
 *   camelize('HelloWorld-how-are-you') // 'helloWorldHowAreYou'
 *   camelize('_hello_world_') // 'helloWorld'
 *   camelize('HelloWorld-how-are---you') // 'helloWorldHowAreYou'
 *   camelize({ hello_world: 'how_are_you' }) // { helloWorld: 'how_are_you' }
 *
 * @param target - The string or object to camelize
 * @returns The camelized string or object
 */
export default function camelize<const T, RT extends Camelized<T>>(target: T): RT {
  return stringCase(target, camelizeString)
}

/**
 * Converts a string to camelCase.
 *
 * Examples:
 *   camelizeString('HelloWorld-how-are-you') // 'helloWorldHowAreYou'
 *   camelizeString('_hello_world_') // 'helloWorld'
 *
 * @param str - The string to camelize
 * @returns The camelized string
 */
export function camelizeString(str: string): string {
  return uncapitalize(
    str
      .replace(/[ _-]+/g, '_')
      .replace(/(^_|_$)/g, '')
      .replace(/_(.)/g, (_: string, x: string) => x.toUpperCase())
  )
}
