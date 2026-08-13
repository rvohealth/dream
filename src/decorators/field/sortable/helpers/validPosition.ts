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

  // The record's own row is inside that read, and on a save that wrote the
  // position sentinel it carries `0` there rather than the position it holds in
  // this scope. Where that position belongs to this same scope it is part of the
  // scope's extent, so the clamp has to take it back into account.
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
