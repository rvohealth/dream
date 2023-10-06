import Dream from '../../../dream'
import Query from '../../../dream/query'
import getForeignKeyForSortableScope from './getForeignKeyForSortableScope'
import scopeArray from './scopeArray'

export default function applySortableScopeToQuery(
  query: Query<typeof Dream>,
  dream: Dream,
  scope?: string | string[]
) {
  if (!scope) return query
  const scopes = scopeArray(scope)

  for (const scope of scopes) {
    const foreignKey = getForeignKeyForSortableScope(dream, scope)!
    query = query.where({
      [foreignKey]: (dream as any)[foreignKey],
    })
  }

  return query
}
