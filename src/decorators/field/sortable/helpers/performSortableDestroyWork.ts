import Dream from '../../../../Dream.js'
import DreamTransaction from '../../../../dream/DreamTransaction.js'
import { STI_SCOPE_NAME } from '../../../class/STI.js'
import { SortableFieldConfig } from '../Sortable.js'
import afterSortableDestroy from '../hooks/afterSortableDestroy.js'

/**
 * @internal
 *
 * The compaction of a sortable destroy: closes the vacancy each sortable
 * field's sort scope is left with, computed from the snapshot the preparation
 * phase (`prepareSortableFieldsForDestroy`) read before the delete. Called
 * directly from `destroyDream` after the delete and before any user
 * `afterDestroy` hook — never registered as a hook among them — so every
 * after-destroy hook observes the compacted scope regardless of where it was
 * declared, exactly as every after-save hook observes the computed position.
 */
export default async function performSortableDestroyWork(
  dream: Dream,
  txn: DreamTransaction<any>
): Promise<void> {
  const dreamClass = dream.constructor as typeof Dream
  const sortableFields = dreamClass['sortableFields'] as SortableFieldConfig[]

  for (const { positionField, scope } of sortableFields) {
    const query = dreamClass.query().removeDefaultScope(STI_SCOPE_NAME).txn(txn)
    await afterSortableDestroy({ dream, positionField, query, scope, txn })
  }
}
