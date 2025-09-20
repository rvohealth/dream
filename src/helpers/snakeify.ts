import { camelizeString } from './camelize.js'
import stringCase, { Snakeified } from './stringCasing.js'

/**
 * Converts a string or the keys of an object to snake_case.
 *
 * Examples:
 *   snakeify('HelloWorld-how-are---you') // 'hello_world_how_are_you'
 *   snakeify('Hello.World') // 'hello.world'
 *   snakeify('Hello/World') // 'hello/world'
 *   snakeify({ helloWorld: now }) // { hello_world: now }
 *
 * @param target - The string or object to snakeify
 * @returns The snake_cased string or object
 */
export default function snakeify<const T, RT extends Snakeified<T>>(target: T): RT {
  return stringCase(target, snakeifyString)
}

export function snakeifyString(str: string): string {
  return camelizeString(str)
    .replace(
      /([,./<>?;':"[\]{}\\|!@#$%^&*()`])([A-Z])/g,
      (_: string, x: string, y: string) => x + y.toLowerCase()
    )
    .replace(/([A-Z])/g, (_: string, y: string) => '_' + y.toLowerCase())
}
