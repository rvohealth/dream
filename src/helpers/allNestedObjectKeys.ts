import { isObject } from './typechecks'

export function allNestedObjectKeys(obj: any): string[] {
  // eslint-disable-next-line
  return Object.keys(obj).flatMap(key => {
    const next = obj[key]
    if (isObject(next)) return [key, allNestedObjectKeys(next)].flat()
    return [key]
  })
}
