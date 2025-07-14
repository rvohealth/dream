import { ExpressionBuilder } from 'kysely'
import Dream from '../../../../Dream.js'
import Query from '../../../../dream/Query.js'
import ops from '../../../../ops/index.js'
import getColumnForSortableScope from './getColumnForSortableScope.js'
import scopeArray from './scopeArray.js'

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
    scope: string | string[] | undefined
  }
) {
  let kyselyQuery = query
    .whereNot({ [dream['_primaryKey']]: dream.primaryKeyValue() })
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
