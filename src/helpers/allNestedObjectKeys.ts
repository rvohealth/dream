import { isObject } from './typechecks.js.js'

export default function allNestedObjectKeys(obj: any): string[] {
  return Object.keys(obj).flatMap(key => {
    const next = obj[key]
    if (isObject(next)) return [key, allNestedObjectKeys(next)].flat()
    return [key]
  })
}
