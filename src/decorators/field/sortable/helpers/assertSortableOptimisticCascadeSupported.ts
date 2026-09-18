import Dream from '../../../../Dream.js'
import Query from '../../../../dream/Query.js'
import SortableRequiresAdvisoryTransactionLocks from '../../../../errors/SortableRequiresAdvisoryTransactionLocks.js'
import SortableRequiresDeferrableConstraints from '../../../../errors/SortableRequiresDeferrableConstraints.js'

/**
 * @internal
 *
 * The capability guard for the optimistic cascade paths — the ones that skip
 * `acquireSortableScopeLocks` and therefore skip the fail-loud check it makes
 * before acquiring.
 *
 * Without this, a driver that cannot serialize a sort scope would be *refused*
 * on a direct destroy and proceed *silently* on a cascaded one, which is the
 * only way this optimization could fail quietly. It is also the reason the
 * check cannot be left to `acquireSortableScopeLocks`: that function returns
 * before its guard when the key list is empty, and an all-skipped cascade
 * presents exactly that. So this runs unconditionally, from the seat that
 * decides to skip.
 *
 * Two capabilities are asserted, because two are what the design actually
 * depends on:
 *
 * 1. the advisory transaction lock seam, since the non-qualifying fields and
 *    every direct write on the same scopes still serialize on it, and an
 *    optimistic path is only sound alongside writers that take it;
 * 2. deferred constraint checking, since an intruding position write committing
 *    inside an optimistic cascade's window is meant to abort that cascade
 *    whole, at commit — on a database that checks per statement there is no
 *    such abort, and a duplicate position can commit.
 */
export default function assertSortableOptimisticCascadeSupported(dream: Dream): void {
  const queryDriverClass = Query.dbDriverClass(dream.connectionName || 'default')

  if (!queryDriverClass.supportsAdvisoryTransactionLocks)
    throw new SortableRequiresAdvisoryTransactionLocks(queryDriverClass.name)

  if (!queryDriverClass.supportsDeferrableConstraints)
    throw new SortableRequiresDeferrableConstraints(queryDriverClass.name)
}
