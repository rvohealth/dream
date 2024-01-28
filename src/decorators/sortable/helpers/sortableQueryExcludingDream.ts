import Dream from '../../../dream'
import Query from '../../../dream/query'
import applySortableScopeToQuery from './applySortableScopeToQuery'

export default function sortableQueryExcludingDream(
  // @reduce-type-complexity
  // dream: Dream,
  dream: any,
  // @reduce-type-complexity
  // query: Query<typeof Dream>,
  query: any,
  scope?: string | string[]
) {
  query = query.whereNot({
    [dream.primaryKey]: dream.primaryKeyValue as any,
  })
  return applySortableScopeToQuery(query, dream, scope)
}
