import { ExpressionBuilder } from 'kysely'
import Dream from '../../../../Dream.js'
import Query from '../../../../dream/Query.js'
import ops from '../../../../ops/index.js'
import filterQueryToScopeValues from './filterQueryToScopeValues.js'
import { snapshotScopeValue, SortableSnapshot } from './sortableSnapshot.js'

export default async function decrementPositionForScopedRecordsGreaterThanPosition(
  position: number,
  {
    dream,
    positionField,
    query,
    scope,
    snapshot,
  }: {
    dream: Dream
    positionField: string
    query: Query<Dream>
    scope: string | string[] | undefined
    /**
     * The destroyed row's real scope values, read before the delete. The scope
     * being compacted is the one the row physically occupied, which is not
     * necessarily the one the instance was loaded from.
     */
    snapshot?: SortableSnapshot | undefined
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

  // A null scope value has to be matched with `is null`: `column = NULL` is
  // never true, so the compaction would silently shift nothing at all in a
  // null-valued sort scope. `filterQueryToScopeValues` is the one place that
  // branch lives, and it is the same filter every other position-mutating path
  // builds.
  kyselyQuery = filterQueryToScopeValues(
    dream,
    kyselyQuery,
    column => snapshotScopeValue(snapshot, column, () => (dream as any)[column]),
    scope
  )

  await kyselyQuery.execute()
}
