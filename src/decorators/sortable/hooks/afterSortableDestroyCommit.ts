import Dream from '../../../dream'
import Query from '../../../dream/query'
import clearCachedSortableValues from '../helpers/clearCachedSortableValues'
import decrementPositionForScopedRecordsGreaterThanPosition from '../helpers/decrementScopedRecordsGreaterThanPosition'
import setPosition from '../helpers/setPosition'

export default async function afterSortableDestroyCommit({
  positionField,
  dream,
  query,
  scope,
}: {
  positionField: string
  dream: Dream
  query: Query<typeof Dream>
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
