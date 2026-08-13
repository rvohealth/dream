import prepareSortableFieldsForDestroy, {
  clearSortableFieldsForDestroy,
} from '../../decorators/field/sortable/helpers/prepareSortableFieldsForDestroy.js'
import DreamApp from '../../dream-app/index.js'
import Dream from '../../Dream.js'
import DreamTransaction from '../DreamTransaction.js'
import destroyAssociatedRecords from './destroyAssociatedRecords.js'
import { DestroyOptions as OptionalDestroyOptions } from './destroyOptions.js'
import runHooksFor from './runHooksFor.js'

type DestroyOptions<DreamInstance extends Dream> = Required<OptionalDestroyOptions<DreamInstance>>
export interface ReallyDestroyOptions<DreamInstance extends Dream> extends DestroyOptions<DreamInstance> {
  reallyDestroy: boolean
}

/**
 * @internal
 *
 * Destroys the Dream and any `dependent: 'destroy'` associations
 * within a transaction. If a transaction is passed, it will be used.
 * Otherwise, a new transaction will be created automatically.
 * If any of the nested associations fails to destroy, then this
 * record will also fail to destroy. If skipHooks is true, model hooks
 * will be bypassed.
 */
export default async function destroyDream<I extends Dream>(
  dream: I,
  txn: DreamTransaction<I> | null = null,
  options: ReallyDestroyOptions<I>
): Promise<I> {
  if (txn) {
    return await destroyDreamWithTransaction(dream, txn, options)
  } else {
    const dreamClass = dream.constructor as typeof Dream
    return await dreamClass.transaction(
      async txn => await destroyDreamWithTransaction<I>(dream, txn, options)
    )
  }
}

/**
 * @internal
 *
 * Given a transaction, applies the destroy query,
 * including cascading to child associations and
 * model hooks.
 */
async function destroyDreamWithTransaction<I extends Dream>(
  dream: I,
  txn: DreamTransaction<I>,
  options: ReallyDestroyOptions<I>
): Promise<I> {
  const { cascade, reallyDestroy, skipHooks } = options

  if (!skipHooks) await runHooksFor('beforeDestroy', dream, true, null, txn)

  // `preventDeletion` is fail-closed: a veto returns before the
  // dependent-destroy cascade, so neither this record nor any of its
  // `dependent: 'destroy'` associations are touched. The check sits outside the
  // hook guard because the flag can also be set by the caller ahead of a
  // `skipHooks` destroy, which runs no hooks but must not cascade either.
  // Recursing through the cascade means a vetoing descendant stops its own
  // subtree while the destroy that reached it carries on.
  if (dream['_preventDeletion']) return dream

  if (cascade) {
    // NOTE: the dependent-destroy tree is loaded lazily, inside
    // destroyAssociatedRecords, so that a cascaded descendant whose
    // associations the root already preloaded does not re-query its own
    // subtree. `dream` itself is intentionally never replaced by the loaded
    // clone: the hooks and the delete below operate on the original.
    await destroyAssociatedRecords(dream, txn, options)
  }

  // Sortable preparation runs as a phase after every user beforeDestroy hook,
  // never as a hook among them: the destroy's whole advisory key set — every
  // sortable field — is acquired in one sorted pass, and the row's real
  // position and scope values are read in one snapshot SELECT while the row
  // still exists. It sits after the cascade so this destroy does not hold the
  // scope lock across every descendant's destroy — true of the destroy itself,
  // not of the transaction it runs in: under `Query#destroy({ lock: true })`
  // the batch's whole key set is already held, taken before any row was
  // claimed. A destroy that skips hooks performs no compaction, and one a
  // cascaded descendant's hook has vetoed will not delete, so neither needs
  // locks or a snapshot.
  let rowFoundBeforeDelete = true

  if (!skipHooks && !dream['_preventDeletion']) {
    rowFoundBeforeDelete = await prepareSortableFieldsForDestroy(dream, txn)
  }

  const rowsRemoved = await maybeDestroyDream(dream, txn, reallyDestroy)

  // `preventDeletion` can still arrive after the veto check above has passed:
  // a cascaded descendant's hook can reach back to this record and call it. The
  // record is then still present, so neither the after-destroy hooks nor the
  // reload of a soft deleted row have anything to run against, and the driver
  // leaves the row alone. A veto that late cannot be made fail-closed against
  // the cascade — the descendants are already destroyed by the time it lands.
  const deletionPrevented = dream['_preventDeletion']

  // A destroy of a row that is already gone — a second `destroy()` on the same
  // instance, a job retry, two workers racing — removes nothing, so there is
  // nothing for the after-destroy hooks to react to and, for a sortable model,
  // no vacancy to close. Compacting anyway would shift the scope a second time
  // from the instance's remembered position, moving survivors onto occupied
  // positions. A veto also removes nothing, and keeps its own path: it is
  // recognized by the flag above, never by the count.
  //
  // Both signals are read because they catch opposite races. The count is the
  // stronger of the two — a writer outside the sortable path can remove the row
  // after the snapshot read, and only the count sees that. The snapshot's
  // existence signal catches the mirror shape: the row was already gone when
  // the snapshot read ran, so this destroy holds no position to vacate, and a
  // row that reappeared under the same primary key is what the delete removed.
  const removedNothing = !deletionPrevented && (rowsRemoved === 0 || !rowFoundBeforeDelete)

  if (removedNothing) clearSortableFieldsForDestroy(dream)

  if (!skipHooks && !deletionPrevented && !removedNothing) {
    await runHooksFor('afterDestroy', dream, true, null, txn)
    await runHooksFor('afterDestroyCommit', dream, true, null, txn)
  }

  if (shouldSoftDelete(dream, reallyDestroy) && !deletionPrevented) {
    await dream.txn(txn).reload()
  }

  return dream
}

function shouldSoftDelete(dream: Dream, reallyDestroy: boolean) {
  const dreamClass = dream.constructor as typeof Dream
  return dreamClass['softDelete'] && !reallyDestroy
}

/**
 * @internal
 *
 * Destroys the dream iff it was not blocked from
 * deleting by one of the beforeDestroy model hooks
 */
async function maybeDestroyDream<I extends Dream>(
  dream: I,
  txn: DreamTransaction<I>,
  reallyDestroy: boolean
): Promise<number> {
  const dbDriverClass = DreamApp.getOrFail().dbConnectionQueryDriverClass(dream.connectionName)
  return await dbDriverClass.destroyDream(dream, txn, reallyDestroy)
}
