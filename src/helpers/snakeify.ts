import { DateTime } from 'luxon'
import { isObject } from './typechecks'

export default function snakeify<
  T extends string | { [key: string]: any } | (string | { [key: string]: any })[],
  RT extends T extends string
    ? string
    : T extends { [key: string]: any }
      ? { [key: string]: any }
      : T extends (string | { [key: string]: any })[]
        ? (string | { [key: string]: any })[]
        : never,
>(target: T): RT {
  if (Array.isArray(target)) {
    return target.map(s => snakeify(s)) as RT
  }

  if (isObject(target)) {
    const agg: { [key: string]: any } = {}
    const obj = target as { [key: string]: any }

    return Object.keys(obj).reduce((agg, s) => {
      switch (obj[s]?.constructor) {
        case DateTime:
          agg[snakeify(s)] = obj[s]
          break

        default:
          if ([null, undefined].includes(obj[s])) agg[snakeify(s)] = obj[s]
          else if (isObject(obj[s])) return snakeify(obj[s])
          else agg[snakeify(s)] = obj[s]
      }

      return agg
    }, agg) as RT
  }

  return (target as string)
    .replace(/(?:^|\.?)([A-Z])/g, (_: string, y: string) => '_' + y.toLowerCase())
    .replace(/^_/, '')
    .replace(/\//g, '_')
    .replace(/-/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase() as RT
}
