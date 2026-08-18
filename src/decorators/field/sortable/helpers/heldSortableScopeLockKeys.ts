import DreamTransaction from '../../../../dream/DreamTransaction.js'

const heldKeysByTransaction = new WeakMap<DreamTransaction<any>, Set<bigint>>()

/**
 * @internal
 *
 * The sortable scope-lock keys this transaction already holds.
 *
 * Advisory transaction locks are released only when the transaction ends, so a
 * key taken once is held for the rest of it: every later acquisition of that
 * key is a statement whose entire effect is to observe that the transaction
 * already has what it is asking for. Tracking them turns those statements into
 * nothing at all — the per-field acquisition inside the position write, and
 * every per-record acquisition inside a locked batch whose preflight already
 * took the batch's whole key set.
 *
 * Being the transaction's whole ledger is also what lets the locked-batch
 * preflight count its bound cumulatively rather than per batch: how many scope
 * locks one more batch would leave the transaction holding is this set's size
 * plus whatever of the batch's keys is not already in it.
 *
 * Keyed by the transaction object rather than by the connection, which is what
 * makes it correct rather than merely fast: a nested transaction gets its own
 * `DreamTransaction` and therefore its own set, so keys taken inside a
 * subtransaction that rolls back — releasing its locks with it — are never
 * remembered as held by the transaction that outlives it. The entry is
 * discarded with the transaction object.
 */
export default function heldSortableScopeLockKeys(txn: DreamTransaction<any>): Set<bigint> {
  const held = heldKeysByTransaction.get(txn)
  if (held) return held

  const newHeld = new Set<bigint>()
  heldKeysByTransaction.set(txn, newHeld)
  return newHeld
}
