import { ExpressionBuilder } from 'kysely'
import Dream from '../../../dream'
import Query from '../../../dream/query'
import ops from '../../../ops'
import getForeignKeyForSortableScope from './getForeignKeyForSortableScope'

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
    query: Query<typeof Dream>
    scope?: string
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

  const foreignKey = getForeignKeyForSortableScope(dream, scope)
  if (foreignKey) {
    kyselyQuery = kyselyQuery.where(foreignKey, '=', (dream as any)[foreignKey])
  }

  await kyselyQuery.execute()
}
