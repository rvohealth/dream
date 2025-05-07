import comparisonKey from './comparisonKey.js'
import uniq from './uniq.js'

export default function intersection<ArrayType extends any[]>(...arrs: ArrayType[]): ArrayType {
  if (!arrs.length) return [] as unknown as ArrayType

  return uniq(
    arrs.reduce((workingArray, arr) => _intersection(workingArray, arr), arrs[0] as unknown as ArrayType)
  )
}

function _intersection<ArrayType extends any[]>(arr: ArrayType, arr2: ArrayType): ArrayType {
  const mappedArr2 = arr2.map(val => comparisonKey(val))
  return arr.filter(val => mappedArr2.includes(comparisonKey(val))) as ArrayType
}
