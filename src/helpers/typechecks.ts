export function isString(x: any): boolean {
  return typeof x === 'string' || x instanceof String
}

export function isObject(x: any): boolean {
  if (x === null) return false
  if (isString(x)) return false
  if (Array.isArray(x)) return false
  return typeof x === 'object'
}
