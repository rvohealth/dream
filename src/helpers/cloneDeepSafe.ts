import { SelectQueryBuilder } from 'kysely'
import cloneDeepWith from 'lodash.clonedeepwith'
import Dream from '../dream'
import Query from '../dream/query'

export default function cloneDeepSafe(original: any) {
  return cloneDeepWith(original, (value: any) => {
    if (value?.isDreamInstance) return (value as Dream).clone()
    if (value?.isDreamQuery) return (value as Query<typeof Dream>).clone()
    if ((value as SelectQueryBuilder<any, any, any>)?.isSelectQueryBuilder) return value
  })
}
