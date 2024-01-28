import Dream from '../../../dream'
import Query from '../../../dream/query'
import applySortableScopeToQuery from './applySortableScopeToQuery'

export default async function positionIsInvalid<QueryType extends Query<typeof Dream>>({
  query,
  dream,
  position,
  scope,
}: {
  query: QueryType
  dream: Dream
  position: number | null | undefined
  scope?: string | string[]
}) {
  const totalRecordsQuery = applySortableScopeToQuery(query, dream, scope) as QueryType

  return (
    position === null ||
    position === undefined ||
    position < 1 ||
    position > (await totalRecordsQuery.count()) + (dream.isPersisted ? 0 : 1)
  )
}
