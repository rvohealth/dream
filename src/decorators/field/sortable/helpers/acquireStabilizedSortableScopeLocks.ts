import Dream from '../../../../Dream.js'
import DreamTransaction from '../../../../dream/DreamTransaction.js'
import { SortableFieldConfig } from '../Sortable.js'
import { sortableSaveLockKeys } from './sortableScopeLockKeys.js'
import { readSortableSnapshots, SortableSnapshotRead } from './sortableSnapshot.js'
import stabilizeSortableScopeLocks from './stabilizeSortableScopeLocks.js'

/**
 * @internal
 *
 * Takes the scope locks a per-record position-mutating operation needs, and
 * returns the database snapshot read under them. Every per-record path goes
 * through this: a position- or scope-changing save (from `saveDream`'s sortable
 * phase), a destroy (from the sortable destroy phase), and an undestroy (from
 * `doUndestroyDream`). A destroy and an undestroy have no incoming scope
 * values, so their instance-derived key set is a single key per sortable field —
 * the scope the instance believes the row occupies — and the snapshot is what
 * corrects it.
 *
 * The first pass locks the key set the instance implies, since the snapshot
 * cannot be read until something is locked; every later pass locks what the
 * snapshot read under those locks reveals. `stabilizeSortableScopeLocks` owns
 * that protocol, its bound, and its failure — including the guarantee that a
 * second pass always runs, so the snapshot is read under the locks even when
 * the transaction already held every key the instance implies (a record being
 * walked inside a locked batch, whose preflight took the whole batch's keys).
 *
 * @param dream - the record whose scope is being locked
 * @param txn - the transaction the operation's write runs in
 * @param configs - the sortable fields this operation performs position work for
 * @returns the snapshot read under the locks, alongside whether the row was
 *   physically there to read — an empty snapshot map on its own cannot say
 */
export default async function acquireStabilizedSortableScopeLocks(
  dream: Dream,
  txn: DreamTransaction<any>,
  configs: SortableFieldConfig[]
): Promise<SortableSnapshotRead> {
  let read: SortableSnapshotRead = { rowExists: true, snapshots: new Map() }

  await stabilizeSortableScopeLocks(dream, txn, async round => {
    // round 0 runs before anything is locked, so there is nothing safe to read
    // yet: the instance's own values are what the first acquisition goes on
    if (round > 0) read = await readSortableSnapshots(dream, txn, configs)
    return sortableSaveLockKeys(dream, configs, read.snapshots)
  })

  return read
}
