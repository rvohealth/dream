import { DateTime } from 'luxon'
import uncapitalize from './uncapitalize'

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

  if (typeof target === 'object') {
    const agg: { [key: string]: any } = {}
    return Object.keys(target).reduce((agg, s) => {
      switch (target[s]?.constructor) {
        case DateTime:
          agg[camelize(s) as string] = target[s]
          break

        default:
          if (typeof target[s] === 'object') return camelize(target[s])
          agg[camelize(s) as string] = target[s]
      }
      return agg
    }, agg) as RT
  }

  return uncapitalize(
    target.replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''))
  ) as RT
}
