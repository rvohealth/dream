import Dream from '../../../../Dream.js'
import Query from '../../../../dream/Query.js'
import clearCachedSortableValues from '../helpers/clearCachedSortableValues.js'
import decrementPositionForScopedRecordsGreaterThanPosition from '../helpers/decrementScopedRecordsGreaterThanPosition.js'

export default async function afterSortableDestroy({
  positionField,
  dream,
  query,
  scope,
}: {
  positionField: string
  dream: Dream
  query: Query<Dream>
  scope: string | string[] | undefined
}) {
  await decrementPositionForScopedRecordsGreaterThanPosition((dream as any)[positionField], {
    dream,
    positionField,
    scope,
    query,
  })
  clearCachedSortableValues(dream, positionField)
}
