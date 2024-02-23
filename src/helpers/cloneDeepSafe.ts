import { SelectQueryBuilder } from 'kysely'
import cloneDeepWith from 'lodash.clonedeepwith'

export default function cloneDeepSafe(original: any) {
  return cloneDeepWith(original, (value: any) => {
    if (value?.isDreamInstance) return value.clone()
    if (value?.isDreamQuery) return value.clone()
    if ((value as SelectQueryBuilder<any, any, any>)?.isSelectQueryBuilder) return value
  })
}
