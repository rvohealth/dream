import { ExpressionBuilder } from 'kysely'
import Dream from '../../../../Dream.js'
import DreamTransaction from '../../../../dream/DreamTransaction.js'
import Query from '../../../../dream/Query.js'
import range from '../../../../helpers/range.js'
import ops from '../../../../ops/index.js'
import { SortableCache } from './prepareSortableFieldsForSave.js'
import acquireSortableScopeLocks from './acquireSortableScopeLocks.js'
import canonicalScopeValue from './canonicalScopeValue.js'
import filterQueryToScopeValues from './filterQueryToScopeValues.js'
import sortableScopeColumns from './sortableScopeColumns.js'
import { sortableScopeLockKeyForCurrentScope } from './sortableScopeLockKeys.js'
import { invalidateSortableRowCache } from './sortableRowCache.js'
import { snapshotScopeValue, SortableSnapshot } from './sortableSnapshot.js'
import validPosition from './validPosition.js'

/**
 * @internal
 *
 * Everything one sortable field's position write needs. The transaction is
 * required: every path into `setPosition` runs from
 * `performSortablePositionWork`, which is called by `saveDream` inside the
 * transaction that holds the scope lock, and a position write that opened a
 * transaction of its own would block on a key its own caller holds.
 */
export interface SortablePositionWrite extends SortableCache {
  dream: Dream
  positionField: string
  query: Query<Dream>
  scope: string | string[] | undefined
  txn: DreamTransaction<any>
  /**
   * The record's physical position and sort scope values, read from the row
   * under the scope lock before the driver write. Present on the update path;
   * absent on create, which has no prior row.
   */
  snapshot?: SortableSnapshot | undefined
  /**
   * The position the record holds in the scope its position is being computed
   * over, where the driver write has replaced it on the row with the position
   * sentinel. Set only for a save that lands in the scope the row already
   * occupies; on every other path the scope's own rows carry their real
   * positions, or the record is joining the scope rather than already in it.
   */
  positionUnderSentinel?: number | undefined
}

interface SortablePositionWriteWithPosition extends SortablePositionWrite {
  position: number
}

export default async function setPosition(obj: SortablePositionWrite) {
  const { dream, txn } = obj

  await applyUpdates(obj)
  await dream.txn(txn).reload()
}

async function applyUpdates(obj: SortablePositionWrite) {
  const { dream, positionField, scope, txn } = obj

  // Serialize every writer of this sort scope for the rest of the transaction,
  // before the first position read. The operation-level phase has already
  // acquired this key in its one sorted pass over every sortable field's keys
  // (performSortablePositionWork on create; saveDream, before the driver
  // write, on update), so this asks for a key the transaction holds and issues
  // no statement at all.
  await acquireSortableScopeLocks(dream, txn, [
    sortableScopeLockKeyForCurrentScope(dream, positionField, scope),
  ])

  // A pending scope change that lands on the scope the row already physically
  // occupies moves the record between no scopes at all, and the rest of the
  // write has to see it that way: the scope being vacated *is* the destination,
  // so one source computes a new position from a max the other is about to
  // shift out from under it. The record still counts toward the destination's
  // extent — its row is in the scope, holding the position sentinel in place of
  // the position the snapshot read — so the position write carries that
  // position through to the clamp, and a record that was already last in the
  // scope stays last rather than swapping with the record below it.
  const write: SortablePositionWrite = alreadyInDestinationScope(obj)
    ? { ...obj, changingScope: false, positionUnderSentinel: obj.previousPosition }
    : obj

  const position = await validPosition(write)
  await updateConflictingRecords({ ...write, position })
  await updatePositionForRecord({ ...write, position })

  // the shift above moved rows this transaction may be holding preflight reads
  // of — every position a locked batch's later records were read with is now a
  // position they no longer have
  invalidateSortableRowCache(txn)
}

/**
 * Whether a save that means to change sort scope is really a move within one
 * scope: the snapshot read under the lock says the row already sits in the
 * scope the instance is being written into, so nothing joins the destination
 * and nothing is left behind.
 *
 * Values are compared through `canonicalScopeValue`, the same normalization the
 * advisory lock key is derived from, so two shapes of one physical value — the
 * pending `'1.00'` and the hydrated `1` — are one scope here exactly as they
 * are when the key is taken.
 *
 * A row whose snapshot position is null holds no position in that scope, so it
 * is joining the destination's position space and remains a scope change.
 */
function alreadyInDestinationScope({
  changingScope,
  dream,
  previousPosition,
  scope,
  snapshot,
}: SortablePositionWrite): boolean {
  if (!changingScope || snapshot === undefined) return false
  if (previousPosition === undefined || previousPosition === null) return false

  const columns = sortableScopeColumns(dream, scope)
  if (!columns.length) return false

  return columns.every(
    column =>
      snapshot.scopeValues.has(column) &&
      canonicalScopeValue(dream, column, snapshot.scopeValues.get(column)) ===
        canonicalScopeValue(dream, column, (dream as any)[column])
  )
}

async function updateConflictingRecords(obj: SortablePositionWriteWithPosition) {
  const {
    wasNewRecord,
    position,
    previousPosition,
    dream,
    positionField,
    query,
    scope,
    txn,
    changingScope,
    snapshot,
  } = obj

  // A scope move spans two unrelated position spaces: `previousPosition` is a
  // position in the scope being left, `position` one in the scope being
  // entered. Only the scope being left is compacted here, and it compacts all
  // the way up — bounding it by a position from the other space closes nothing
  // at all whenever the destination is the smaller of the two, leaving a
  // permanent hole. The destination needs no room made: a scope-changing save
  // always lands at the end of it, because `afterSortableUpdate` passes no
  // position and `validPosition` then returns the destination's max + 1.
  //
  // A record with no position to vacate — a soft-deleted row, whose position
  // column is NULL — leaves the scope it is moving out of untouched.
  if (changingScope && (previousPosition === undefined || previousPosition === null)) return

  const increasing =
    changingScope ||
    position === undefined ||
    (previousPosition !== undefined && previousPosition !== null && previousPosition < position)

  const conflictingPositions = changingScope
    ? ops.greaterThanOrEqualTo(previousPosition)
    : increasing
      ? range(previousPosition, position)
      : range(position, previousPosition)

  let kyselyQuery = query
    .txn(txn)
    .whereNot({ [dream['_primaryKey']]: dream.primaryKeyValue() })
    .where({
      [positionField]: conflictingPositions,
    })
    .toKysely('update')
    .set((eb: ExpressionBuilder<(typeof dream)['DB'], typeof dream.table>) => ({
      [positionField]: eb(positionField, increasing ? '-' : '+', 1),
    }))

  // the range being compacted belongs to the scope the record is *leaving*, so
  // the filter has to name that scope's real column values — the snapshot read
  // under the lock before the write, not what the instance remembers
  kyselyQuery = filterQueryToScopeValues(
    dream,
    kyselyQuery,
    column =>
      snapshotScopeValue(snapshot, column, () =>
        !wasNewRecord && dream.savedChangeToAttribute(column)
          ? (dream.changes()[column]?.was ?? (dream as any)[column])
          : (dream as any)[column]
      ),
    scope
  )

  await kyselyQuery.execute()
}

async function updatePositionForRecord(obj: SortablePositionWriteWithPosition) {
  const { txn, dream, positionField, position } = obj

  await txn.kyselyTransaction
    .updateTable(dream.table as any)
    .where(dream['_primaryKey'], '=', dream.primaryKeyValue())
    .set({
      [positionField]: position,
    })
    .execute()
}
