import Dream from '../../dream'
import DreamTransaction from '../transaction'
import destroyAssociatedRecords from './destroyAssociatedRecords'
import runHooksFor from './runHooksFor'
import safelyRunCommitHooks from './safelyRunCommitHooks'
import softDeleteDream from './softDeleteDream'

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
  {
    skipHooks,
    reallyDestroy,
    cascade,
  }: { skipHooks?: boolean; reallyDestroy?: boolean; cascade?: boolean } = {}
): Promise<I> {
  if (txn) {
    return await destroyDreamWithTransaction(dream, txn, { skipHooks, reallyDestroy, cascade })
  } else {
    const dreamClass = dream.constructor as typeof Dream
    return await dreamClass.transaction(
      async txn => await destroyDreamWithTransaction<I>(dream, txn, { skipHooks, reallyDestroy, cascade })
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
  {
    skipHooks = false,
    reallyDestroy = false,
    cascade = true,
  }: { skipHooks?: boolean; reallyDestroy?: boolean; cascade?: boolean }
): Promise<I> {
  if (cascade) {
    await destroyAssociatedRecords(dream, txn, { skipHooks, reallyDestroy })
  }

  if (!skipHooks) {
    await runHooksFor('beforeDestroy', dream, true, null, txn)
  }

  await maybeDestroyDream(dream, txn, reallyDestroy)

  if (!skipHooks) {
    await runHooksFor('afterDestroy', dream, true, null, txn || undefined)
    await safelyRunCommitHooks(dream, 'afterDestroyCommit', true, null, txn)
  }

  return dream
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
) {
  const dreamClass = dream.constructor as typeof Dream

  const shouldSoftDelete = dreamClass['softDelete'] && !reallyDestroy
  if (shouldSoftDelete) {
    await softDeleteDream(dream, txn)
  }

  if (!shouldSoftDelete && !dream['_preventDeletion']) {
    await txn.kyselyTransaction
      .deleteFrom(dream.table as any)
      .where(dream.primaryKey as any, '=', dream.primaryKeyValue)
      .execute()
  }
}
