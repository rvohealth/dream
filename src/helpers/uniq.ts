import { uniq as lodashUniq, uniqWith } from 'lodash-es'
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
