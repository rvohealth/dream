import Dream from '../../../../Dream.js'
import DreamTransaction from '../../../../dream/DreamTransaction.js'
import Query from '../../../../dream/Query.js'
import DreamApp from '../../../../dream-app/index.js'
import SortableRequiresAdvisoryTransactionLocks from '../../../../errors/SortableRequiresAdvisoryTransactionLocks.js'
import SortableScopeLockLimitExceeded from '../../../../errors/SortableScopeLockLimitExceeded.js'
import { sortableTransactionLockState } from './heldSortableScopeLockKeys.js'

/**
 * @internal
 *
 * Serializes every writer of a set of sort scopes by taking those scopes'
 * transaction-scoped advisory locks. They are released when the enclosing
 * transaction ends, so there is nothing to release here.
 *
 * Keys this transaction already holds are dropped rather than re-acquired: the
 * lock is held to the end of the transaction either way, so the statement would
 * do nothing but cost a round trip inside the lock window. Whatever is left is
 * taken in the order given — callers that need more than one sort them first,
 * so that two operations touching the same pair of scopes cannot deadlock
 * against each other — and in one statement, on drivers that can express it.
 *
 * Waiting for a key another transaction holds is bounded by the driver, which
 * raises `SortableScopeLockWaitTimedOut` rather than waiting forever; see
 * `QueryDriverBase.acquireAdvisoryTransactionLocks`.
 *
 * @param dream - the record whose connection provides the driver
 * @param txn - the transaction the locks are scoped to
 * @param keys - the scope keys to acquire, in acquisition order
 */
export default async function acquireSortableScopeLocks(
  dream: Dream,
  txn: DreamTransaction<any>,
  keys: bigint[]
): Promise<void> {
  if (!keys.length) return

  const queryDriverClass = Query.dbDriverClass(dream.connectionName || 'default')

  if (!queryDriverClass.supportsAdvisoryTransactionLocks)
    throw new SortableRequiresAdvisoryTransactionLocks(queryDriverClass.name)

  const state = sortableTransactionLockState(txn)
  const requestedKeys = [...new Set(keys)]
  const acquisitionsAlreadyInFlight = new Set<Promise<void>>()
  const keysToAcquire: bigint[] = []

  for (const key of requestedKeys) {
    if (state.heldKeys.has(key)) continue

    const inFlight = state.inFlightKeys.get(key)
    if (inFlight) acquisitionsAlreadyInFlight.add(inFlight)
    else keysToAcquire.push(key)
  }

  if (!keysToAcquire.length) {
    await Promise.all(acquisitionsAlreadyInFlight)
    return
  }

  const attemptedLockCount = state.heldKeys.size + state.inFlightKeys.size + keysToAcquire.length
  const configuredLimit = DreamApp.getOrFail().sortableMaxScopeLocksPerTransaction

  if (attemptedLockCount > configuredLimit)
    throw new SortableScopeLockLimitExceeded(
      dream['sanitizedConstructorName'],
      attemptedLockCount,
      configuredLimit,
      keysToAcquire.length,
      state.origin
    )

  const acquisition = queryDriverClass
    .acquireAdvisoryTransactionLocks(txn, keysToAcquire)
    .then(() => {
      keysToAcquire.forEach(key => state.heldKeys.add(key))
    })
    .finally(() => {
      keysToAcquire.forEach(key => {
        if (state.inFlightKeys.get(key) === acquisition) state.inFlightKeys.delete(key)
      })
    })

  keysToAcquire.forEach(key => state.inFlightKeys.set(key, acquisition))
  acquisitionsAlreadyInFlight.add(acquisition)

  await Promise.all(acquisitionsAlreadyInFlight)
}
