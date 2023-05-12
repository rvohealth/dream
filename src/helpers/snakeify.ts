import { DateTime } from 'luxon'

export default function snakeify<
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
    return target.map(s => snakeify(s)) as RT
  }

  if (typeof target === 'object') {
    const agg: { [key: string]: any } = {}
    return Object.keys(target).reduce((agg, s) => {
      switch (target[s]?.constructor) {
        case DateTime:
          agg[snakeify(s) as string] = target[s]
          break

        default:
          if (typeof target[s] === 'object') return snakeify(target[s])
          agg[snakeify(s) as string] = target[s]
      }

      return agg
    }, agg) as RT
  }

  return target
    .replace(/(?:^|\.?)([A-Z])/g, (_: string, y: string) => '_' + y.toLowerCase())
    .replace(/^_/, '')
    .replace(/\//g, '_')
    .replace(/-/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase() as RT
}
