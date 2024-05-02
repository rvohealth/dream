import stringCase, { Snakeified } from './stringCasing'
import { camelizeString } from './camelize'

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
