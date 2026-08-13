import Dream from '../../../../Dream.js'
import DreamTransaction from '../../../../dream/DreamTransaction.js'
import { STI_SCOPE_NAME } from '../../../class/STI.js'
import { SortableFieldConfig } from '../Sortable.js'
import afterSortableCreate from '../hooks/afterSortableCreate.js'
import afterUpdateSortable from '../hooks/afterSortableUpdate.js'
import acquireSortableScopeLocks from './acquireSortableScopeLocks.js'
import { sortableCurrentScopeLockKeys } from './sortableScopeLockKeys.js'

/**
 * @internal
 *
 * The position work of a sortable save: computes each sortable field's real
 * position under the scope lock and writes it. Called directly from
 * `saveDream` after the driver write — never registered as an after-hook — so
 * no user hook code can interleave with it while the scope lock is held, and
 * on a self-opened save it is the last work before COMMIT releases the lock.
 */
export default async function performSortablePositionWork(
  dream: Dream,
  txn: DreamTransaction<any>,
  sortableFieldConfigs: SortableFieldConfig[],
  { alreadyPersisted }: { alreadyPersisted: boolean }
): Promise<void> {
  const dreamClass = dream.constructor as typeof Dream

  // A create acquires its whole advisory key set here — every sortable field,
  // one sorted pass — before any field's position is computed, so a
  // multi-field create takes its keys in the same global order as an update or
  // a destroy and cannot deadlock against them. The per-field acquisition
  // inside `setPosition` then re-acquires keys this transaction already holds,
  // which is a no-op. (An update acquired its keys before the driver write, in
  // `saveDream`.)
  if (!alreadyPersisted) {
    await acquireSortableScopeLocks(dream, txn, sortableCurrentScopeLockKeys(dream, sortableFieldConfigs))
  }

  for (const { positionField, scope } of sortableFieldConfigs) {
    const query = dreamClass.query().removeDefaultScope(STI_SCOPE_NAME).txn(txn)

    if (alreadyPersisted) {
      await afterUpdateSortable({ dream, positionField, query, txn, scope })
    } else {
      await afterSortableCreate({ dream, positionField, query, txn, scope })
    }
  }
}
