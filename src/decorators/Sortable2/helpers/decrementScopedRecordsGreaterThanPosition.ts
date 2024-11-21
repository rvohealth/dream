import { ExpressionBuilder } from 'kysely'
import Dream from '../../../Dream2'
import Query from '../../../dream/Query2'
import ops from '../../../ops'
import getColumnForSortableScope from './getColumnForSortableScope'
import scopeArray from './scopeArray'

export default async function decrementPositionForScopedRecordsGreaterThanPosition(
  position: number,
  {
    dream,
    positionField,
    query,
    scope,
  }: {
    dream: Dream
    positionField: string
    query: Query<Dream>
    scope?: string | string[]
  }
) {
  let kyselyQuery = query
    .whereNot({ [dream.primaryKey]: dream.primaryKeyValue as any })
    .where({
      [positionField]: ops.greaterThanOrEqualTo(position),
    })
    .toKysely('update')
    .set((eb: ExpressionBuilder<(typeof dream)['DB'], typeof dream.table>) => {
      return {
        [positionField]: eb(positionField, '-', 1),
      }
    })

  for (const singleScope of scopeArray(scope)) {
    const column = getColumnForSortableScope(dream, singleScope)
    if (column) {
      kyselyQuery = kyselyQuery.where(column, '=', (dream as any)[column])
    }
  }

  await kyselyQuery.execute()
}
