import applySortableScopeToQuery from './applySortableScopeToQuery.js'
import { SortableCacheWithRequiredTransaction } from './setPosition.js'

export default async function validPosition({
  changingScope,
  dream,
  position,
  positionField,
  query,
  scope,
  wasNewRecord,
  previousPosition,
  txn,
}: SortableCacheWithRequiredTransaction): Promise<number> {
  const increasingNumberOfItemsToSort = !previousPosition || wasNewRecord || changingScope

  const maxPosition =
    (await applySortableScopeToQuery(query.txn(txn), dream, scope).max(positionField)) +
    (increasingNumberOfItemsToSort ? 1 : 0)

  return Math.max(
    1,
    Math.min(
      maxPosition,
      position === null || position === undefined || position < 1 ? maxPosition : position
    )
  )
}
