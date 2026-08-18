import Dream from '../../../../Dream.js'
import DreamTransaction from '../../../../dream/DreamTransaction.js'
import SortableScopeDidNotStabilize from '../../../../errors/SortableScopeDidNotStabilize.js'
import acquireSortableScopeLocks from './acquireSortableScopeLocks.js'
import heldSortableScopeLockKeys from './heldSortableScopeLockKeys.js'

/**
 * How many acquisition passes a position-mutating operation will make while
 * following a record that has been moved to another sort scope, before giving
 * up. One pass is the ordinary case (lock what the caller says, read, agree); a
 * second covers a competitor that moved the row between the two; a third exists
 * so that a single unlucky retry is not fatal. Beyond that the row is being
 * moved faster than it can be read, and raising is better than compacting a
 * scope it no longer occupies.
 *
 * The bound counts acquisitions, and every one of them counts: the convergence
 * check runs after the last acquisition and the read taken under it, so an
 * operation that settles on its final pass settles rather than raising.
 */
export const MAX_SCOPE_STABILIZATION_ROUNDS = 3

/**
 * @internal
 *
 * The stabilization protocol every sortable lock acquisition follows, in one
 * place: acquire the keys the current knowledge implies, read again under those
 * locks, and take whatever additional key the read reveals — until a pass
 * reveals nothing new, or the bound above is exhausted.
 *
 * The bootstrapping problem it solves: a sort scope's lock key is derived from
 * the record's *physical* scope columns, and those cannot be read safely until
 * that scope is locked. So the first pass locks what the caller can know without
 * reading — an instance's own values, or an unprotected candidate read — and
 * every later pass locks what the read taken under those locks reveals.
 *
 * Nothing here is ever unwound: the locks are transaction-scoped advisory locks,
 * which are additive and are released only when the transaction ends. A pass
 * that discovers a new key simply also takes it, holding at worst one lock too
 * many for the rest of the transaction — which costs contention and never
 * correctness. That is what lets this run inside a caller-owned transaction
 * unchanged; no path here restarts or rolls back a transaction it did not open.
 *
 * Keys the transaction already holds — taken by an earlier phase of the same
 * operation, or by the preflight of the locked batch this record is being
 * walked in — are not taken again; they are held to the end of the transaction
 * regardless. Convergence is judged on that same set, so a pass whose read
 * reveals only keys already held is a pass that agrees.
 *
 * Keys are taken in sorted order within a pass, so that two operations touching
 * the same set of scopes cannot deadlock against each other. Across passes the
 * order is discovery-driven and therefore unsortable in principle, which is the
 * named fallback: two operations moving records in opposite directions between
 * the same two scopes can raise Postgres's `40P01` deadlock error, a visible
 * retryable failure.
 *
 * @param dream - a record of the model being locked; supplies the connection
 *   and, when this fails, the class name in the error
 * @param txn - the transaction the locks are scoped to
 * @param keysForRound - reads whatever this pass can see — the caller's own
 *   snapshot or candidate read — and returns every lock key it implies. Called
 *   once per pass with the number of acquisitions made so far, so a caller whose
 *   first pass needs no read can skip it on round 0
 */
export default async function stabilizeSortableScopeLocks(
  dream: Dream,
  txn: DreamTransaction<any>,
  keysForRound: (round: number) => Promise<Iterable<bigint>>
): Promise<void> {
  const heldKeys = heldSortableScopeLockKeys(txn)

  for (let acquisitions = 0; ; acquisitions++) {
    const keys = await keysForRound(acquisitions)

    const keysToAcquire = [...keys]
      .filter(key => !heldKeys.has(key))
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))

    // the key set this pass's read implies is the key set already held: nothing
    // can move out from under the operation until the transaction ends, and the
    // read taken beside it was taken under those locks. This check follows every
    // acquisition, the last one included, so no pass's work is discarded unread.
    //
    // Round 0 is never allowed to end the loop, however many of its keys the
    // transaction already holds: it ran before this operation read anything
    // under them, and the read is what the caller came for. Where the earlier
    // shape ended the loop unread — a locked batch's per-record work, whose
    // preflight already took every key the record implies — the pass after it
    // now reads under those very locks and agrees, at the cost of no statement
    // at all
    if (acquisitions > 0 && !keysToAcquire.length) return

    if (acquisitions === MAX_SCOPE_STABILIZATION_ROUNDS)
      throw new SortableScopeDidNotStabilize(
        dream['sanitizedConstructorName'],
        MAX_SCOPE_STABILIZATION_ROUNDS
      )

    // records what it takes in `heldKeys`, and takes nothing already there
    await acquireSortableScopeLocks(dream, txn, keysToAcquire)
  }
}
