export default function snakeify<
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
    return str.map(s => snakeify(s)) as RT
  }

  if (typeof str === 'object') {
    const agg: { [key: string]: any } = {}
    return Object.keys(str).reduce((agg, s) => {
      if (typeof str[s] === 'object') return snakeify(str[s])

      agg[snakeify(s) as string] = str[s]
      return agg
    }, agg) as RT
  }

  return str
    .replace(/(?:^|\.?)([A-Z])/g, (_: string, y: string) => '_' + y.toLowerCase())
    .replace(/^_/, '')
    .replace(/\//g, '_')
    .replace(/-/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase() as RT
}
