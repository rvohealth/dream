import stringCase, { Camelized } from './stringCasing.js'
import uncapitalize from './uncapitalize.js'

export default function camelize<const T, RT extends Camelized<T>>(target: T): RT {
  return stringCase(target, camelizeString)
}

export function camelizeString(str: string): string {
  return uncapitalize(
    str
      .replace(/[ _-]+/g, '_')
      .replace(/(^_|_$)/g, '')
      .replace(/_(.)/g, (_: string, x: string) => x.toUpperCase())
  )
}
