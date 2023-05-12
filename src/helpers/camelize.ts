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
>(str: T): RT {
  if (Array.isArray(str)) {
    return str.map(s => camelize(s)) as RT
  }

  if (typeof str === 'object') {
    const agg: { [key: string]: any } = {}
    return Object.keys(str).reduce((agg, s) => {
      if (typeof str[s] === 'object') return camelize(str[s])

      agg[camelize(s) as string] = str[s]
      return agg
    }, agg) as RT
  }

  return uncapitalize(
    str.replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''))
  ) as RT
}
