// also in Psychic
export default function isObject(x: any): boolean {
  if (x === null) return false
  if (Array.isArray(x)) return false
  return typeof x === 'object'
}
