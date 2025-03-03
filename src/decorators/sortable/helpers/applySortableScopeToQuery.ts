import Dream from '../../../Dream'
import Query from '../../../dream/Query'
import getColumnForSortableScope from './getColumnForSortableScope'
import scopeArray from './scopeArray'

export default function applySortableScopeToQuery(
  query: Query<Dream>,
  dream: Dream,
  scope?: string | string[]
) {
  if (!scope) return query
  const scopes = scopeArray(scope)

  for (const scope of scopes) {
    const column = getColumnForSortableScope(dream, scope)!
    query = query.where({
      [column]: (dream as any)[column] ?? null,
    })
  }

  return query
}
