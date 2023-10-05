import Dream from '../../dream'
import Query from '../../dream/query'
import applySortableScopeToQuery from './applySortableScopeToQuery'

export default function sortableQueryExcludingDream(
  dream: Dream,
  query: Query<typeof Dream>,
  scope?: string
) {
  query = query.whereNot({
    [dream.primaryKey]: dream.primaryKeyValue as any,
  })
  return applySortableScopeToQuery(query, dream, scope)
}
