import Dream from '../../dream'
import Query from '../../dream/query'
import clearCachedSortableValues from './clearCachedSortableValues'
import decrementPositionForScopedRecordsGreaterThanPosition from './decrementScopedRecordsGreaterThanPosition'
import setPosition from './setPosition'

export default async function afterSortableDestroyCommit({
  positionField,
  dream,
  query,
  scope,
}: {
  positionField: string
  dream: Dream
  query: Query<typeof Dream>
  scope?: string
}) {
  await decrementPositionForScopedRecordsGreaterThanPosition((dream as any)[positionField], {
    dream,
    positionField,
    scope,
    query,
  })
  clearCachedSortableValues(dream, positionField)
}
