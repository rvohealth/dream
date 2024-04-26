import Dream from '../../../dream'
import Query from '../../../dream/query'
import clearCachedSortableValues from '../helpers/clearCachedSortableValues'
import decrementPositionForScopedRecordsGreaterThanPosition from '../helpers/decrementScopedRecordsGreaterThanPosition'

export default async function afterSortableDestroy({
  positionField,
  dream,
  query,
  scope,
}: {
  positionField: string
  dream: Dream
  query: Query<Dream>
  scope?: string | string[]
}) {
  await decrementPositionForScopedRecordsGreaterThanPosition((dream as any)[positionField], {
    dream,
    positionField,
    scope,
    query,
  })
  clearCachedSortableValues(dream, positionField)
}
