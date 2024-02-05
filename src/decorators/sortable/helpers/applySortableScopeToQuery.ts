import Dream from '../../../dream'
import Query from '../../../dream/query'
import getColumnForSortableScope from './getColumnForSortableScope'
import scopeArray from './scopeArray'

export default function applySortableScopeToQuery(
  query: Query<typeof Dream>,
  dream: Dream,
  scope?: string | string[]
) {
  if (!scope) return query
  const scopes = scopeArray(scope)

  for (const scope of scopes) {
    const column = getColumnForSortableScope(dream, scope)!
    query = query.where({
      [column]: (dream as any)[column],
    })
  }

  return query
}
