import lodashUniq from 'lodash.uniq'
import uniqWith from 'lodash.uniqwith'
import Dream from '../Dream'

export default function uniq<T>(
  arr: T[],
  comparator: ((a: T, b: T) => boolean) | undefined = undefined
): T[] {
  if (comparator) return uniqWith(arr, comparator)
  else if ((arr[0] as Dream)?.isDreamInstance) return uniqWith(arr as Dream[], dreamComparator) as T[]
  else return lodashUniq(arr)
}

function dreamComparator(a: Dream, b: Dream) {
  return a.equals(b)
}
