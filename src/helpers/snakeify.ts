export default function snakeify(str: any): any {
  if (Array.isArray(str)) {
    return str.map(s => snakeify(s))
  }

  if (typeof str === 'object') {
    const agg: { [key: string]: any } = {}
    return Object.keys(str).reduce((agg, s) => {
      if (typeof str[s] === 'object') return snakeify(str[s])

      agg[snakeify(s) as string] = str[s]
      return agg
    }, agg)
  }

  return str
    .replace(/(?:^|\.?)([A-Z])/g, (_: string, y: string) => '_' + y.toLowerCase())
    .replace(/^_/, '')
    .replace(/\//g, '_')
    .toLowerCase()
}
