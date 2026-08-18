import filterQueryToInstanceScope from './filterQueryToInstanceScope.js'
import { SortablePositionWrite } from './setPosition.js'

/**
 * @internal
 *
 * The position the record will be written at: the caller's, clamped to the
 * scope the record now occupies.
 *
 * The scope is read off the instance rather than off the snapshot because the
 * scope in question is the one being *entered*, which is the instance's — the
 * snapshot holds the scope the row was in before the driver write. On every
 * path into here the driver write has already landed the instance's scope
 * values on the row.
 */
export default async function validPosition({
  changingScope,
  dream,
  position,
  positionField,
  positionUnderSentinel,
  query,
  scope,
  wasNewRecord,
  previousPosition,
  txn,
}: SortablePositionWrite): Promise<number> {
  const increasingNumberOfItemsToSort = !previousPosition || wasNewRecord || changingScope

  const scopeMax = await filterQueryToInstanceScope(query.txn(txn), dream, scope).max(positionField)

  // `scopeMax` includes this record's own row, but mid-save that row holds the
  // sentinel `0` instead of its real position. When the record already had a
  // position in this scope, the caller passes it as `positionUnderSentinel`,
  // and it counts toward the scope's true max — so take the larger of the two
  // before clamping.
  const maxPosition =
    Math.max(scopeMax ?? 0, positionUnderSentinel ?? 0) + (increasingNumberOfItemsToSort ? 1 : 0)

  return Math.max(
    1,
    Math.min(
      maxPosition,
      position === null || position === undefined || position < 1 ? maxPosition : position
    )
  )
}
