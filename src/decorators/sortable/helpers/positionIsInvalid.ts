import Dream from '../../../Dream.js.js'
import Query from '../../../dream/Query.js.js'
import applySortableScopeToQuery from './applySortableScopeToQuery.js.js'

export default async function positionIsInvalid({
  query,
  dream,
  position,
  scope,
}: {
  query: Query<Dream>
  dream: Dream
  position: number | null | undefined
  scope?: string | string[]
}) {
  const totalRecordsQuery = applySortableScopeToQuery(query, dream, scope)

  return (
    position === null ||
    position === undefined ||
    position < 1 ||
    position > (await totalRecordsQuery.count()) + (dream.isPersisted ? 0 : 1)
  )
}
