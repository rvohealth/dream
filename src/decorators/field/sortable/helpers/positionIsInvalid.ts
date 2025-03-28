import Dream from '../../../../Dream.js'
import Query from '../../../../dream/Query.js'
import applySortableScopeToQuery from './applySortableScopeToQuery.js'

export default async function positionIsInvalid({
  query,
  dream,
  position,
  scope,
}: {
  query: Query<Dream>
  dream: Dream
  position: number | null | undefined
  scope: string | string[] | undefined
}) {
  const totalRecordsQuery = applySortableScopeToQuery(query, dream, scope)

  return (
    position === null ||
    position === undefined ||
    position < 1 ||
    position > (await totalRecordsQuery.count()) + (dream.isPersisted ? 0 : 1)
  )
}
