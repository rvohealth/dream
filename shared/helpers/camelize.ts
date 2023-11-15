import { DateTime } from 'luxon'
import uncapitalize from '../../src/helpers/uncapitalize'
import { isObject } from '../../src/helpers/typechecks'

export default function camelize<
  T extends string | { [key: string]: any } | (string | { [key: string]: any })[],
  RT extends T extends string
    ? string
    : T extends { [key: string]: any }
    ? { [key: string]: any }
    : T extends (string | { [key: string]: any })[]
    ? (string | { [key: string]: any })[]
    : never
>(target: T): RT {
  if (Array.isArray(target)) {
    return target.map(s => camelize(s)) as RT
  }

  if (isObject(target)) {
    const agg: { [key: string]: any } = {}
    const obj = target as { [key: string]: any }

    return Object.keys(obj).reduce((agg, s) => {
      switch (obj[s]?.constructor) {
        case DateTime:
          agg[camelize(s) as string] = obj[s]
          break

        default:
          if ([null, undefined].includes(obj[s])) agg[camelize(s) as string] = obj[s]
          else if (isObject(obj[s])) return camelize(obj[s])
          else agg[camelize(s) as string] = obj[s]
      }
      return agg
    }, agg) as RT
  }

  return uncapitalize(
    (target as string).replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''))
  ) as RT
}
