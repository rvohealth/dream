import Dream from '../../../Dream.js.js'
import Query from '../../../dream/Query.js.js'
import getColumnForSortableScope from './getColumnForSortableScope.js.js'
import scopeArray from './scopeArray.js.js'

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
      [column]: (dream as any)[column],
    })
  }

  return query
}
