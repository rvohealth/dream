import Dream from '../../../../Dream.js'
import Query from '../../../../dream/Query.js'
import applySortableScopeToQuery from './applySortableScopeToQuery.js'

export default function sortableQueryExcludingDream(
  dream: Dream,
  query: Query<Dream>,
  scope?: string | string[]
) {
  query = query.whereNot({
    [dream['_primaryKey']]: dream.primaryKeyValue(),
  })
  return applySortableScopeToQuery(query, dream, scope)
}
