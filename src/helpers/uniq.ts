import uniqWith from 'lodash.uniqwith'
import lodashUniq from 'lodash.uniq'
import Dream from '../dream'

export default function uniq<T extends Dream | any>(
  arr: T[],
  comparator: ((a: any, b: any) => boolean) | undefined = undefined
): T[] {
  if (comparator) return uniqWith(arr, comparator)
  else if ((arr[0] as Dream)?.isDreamInstance) return uniqWith(arr as Dream[], dreamComparator) as T[]
  else return lodashUniq(arr)
}

function dreamComparator(a: Dream, b: Dream) {
  return a.primaryKeyValue === b.primaryKeyValue && a.constructor === b.constructor
}
