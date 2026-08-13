import Dream from '../../../../Dream.js'
import DreamTransaction from '../../../../dream/DreamTransaction.js'
import Query from '../../../../dream/Query.js'
import SortableRequiresAdvisoryTransactionLocks from '../../../../errors/SortableRequiresAdvisoryTransactionLocks.js'
import heldSortableScopeLockKeys from './heldSortableScopeLockKeys.js'

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

  const heldKeys = heldSortableScopeLockKeys(txn)
  const keysToAcquire = keys.filter(key => !heldKeys.has(key))
  if (!keysToAcquire.length) return

  await queryDriverClass.acquireAdvisoryTransactionLocks(txn, keysToAcquire)
  keysToAcquire.forEach(key => heldKeys.add(key))
}
