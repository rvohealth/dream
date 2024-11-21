import Dream from '../../../Dream'
import Query from '../../../dream/Query'
import applySortableScopeToQuery from './applySortableScopeToQuery'

export default function sortableQueryExcludingDream(
  dream: Dream,
  query: Query<Dream>,
  scope?: string | string[]
) {
  query = query.whereNot({
    [dream.primaryKey]: dream.primaryKeyValue as any,
  })
  return applySortableScopeToQuery(query, dream, scope)
}
