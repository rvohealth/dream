import DreamTransaction from '../../../../dream/DreamTransaction.js'

export type SortableTransactionOrigin =
  | { type: 'locked-batch' }
  | { type: 'operation'; operation: 'create' | 'save' | 'destroy' | 'undestroy' | 'resort' }

export interface SortableTransactionLockState {
  heldKeys: Set<bigint>
  inFlightKeys: Map<bigint, Promise<void>>
  origin?: SortableTransactionOrigin
}

const lockStateByTransaction = new WeakMap<DreamTransaction<any>, SortableTransactionLockState>()

/**
 * @internal
 *
 * The transaction-local ledger for Sortable scope locks it already holds,
 * acquisitions currently in flight, and Dream-opened operation context.
 *
 * Advisory transaction locks are released only when the transaction ends, so a
 * key taken once is held for the rest of it: every later acquisition of that
 * key is a statement whose entire effect is to observe that the transaction
 * already has what it is asking for. Tracking them turns those statements into
 * nothing at all — the per-field acquisition inside the position write, and
 * every per-record acquisition inside a locked batch whose preflight already
 * took the batch's whole key set.
 *
 * In-flight keys are reserved synchronously before their driver acquisition is
 * awaited. A concurrent operation therefore counts those reservations rather
 * than passing against a stale held-key count, and a request for the same key
 * awaits the existing acquisition. A failed acquisition removes only its own
 * reservations and never promotes them to held keys.
 *
 * Keyed by the transaction object rather than by the connection, which is what
 * makes it correct rather than merely fast: a nested transaction gets its own
 * `DreamTransaction` and therefore its own ledger, so keys taken inside a
 * subtransaction that rolls back — releasing its locks with it — are never
 * remembered by the transaction that outlives it. The entry is
 * discarded with the transaction object.
 */
export default function heldSortableScopeLockKeys(txn: DreamTransaction<any>): Set<bigint> {
  return sortableTransactionLockState(txn).heldKeys
}

export function sortableTransactionLockState(txn: DreamTransaction<any>): SortableTransactionLockState {
  const state = lockStateByTransaction.get(txn)
  if (state) return state

  const newState: SortableTransactionLockState = {
    heldKeys: new Set<bigint>(),
    inFlightKeys: new Map<bigint, Promise<void>>(),
  }
  lockStateByTransaction.set(txn, newState)
  return newState
}

/** @internal */
export function setSortableTransactionOrigin(txn: DreamTransaction<any>, origin: SortableTransactionOrigin) {
  sortableTransactionLockState(txn).origin = origin
}
