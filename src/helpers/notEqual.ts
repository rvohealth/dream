import areEqual from './areEqual.js'

export default function (a: any, b: any): boolean {
  return !areEqual(a, b)
}
