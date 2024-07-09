import Dream from '../../dream'
import DreamTransaction from '../transaction'
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
  { skipHooks = false, reallyDestroy = false }: { skipHooks?: boolean; reallyDestroy?: boolean } = {}
): Promise<I> {
  if (txn) {
    return await destroyDreamWithTransaction(dream, txn, { skipHooks, reallyDestroy })
  } else {
    const dreamClass = dream.constructor as typeof Dream
    return await dreamClass.transaction(
      async txn => await destroyDreamWithTransaction<I>(dream, txn, { skipHooks, reallyDestroy })
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
  { skipHooks, reallyDestroy }: { skipHooks: boolean; reallyDestroy: boolean }
): Promise<I> {
  await destroyAssociatedRecords(dream, txn, { skipHooks, reallyDestroy })

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

  if (dreamClass['softDelete'] && !reallyDestroy) {
    await softDeleteDream(dream, txn)
  }

  if (!dream['_preventDeletion']) {
    await txn.kyselyTransaction
      .deleteFrom(dream.table as any)
      .where(dream.primaryKey as any, '=', dream.primaryKeyValue)
      .execute()
  }
}

/**
 * @internal
 *
 * Destroys all HasOne/HasMany associations on this
 * dream that are marked as `dependent: 'destroy'`
 */
async function destroyAssociatedRecords<I extends Dream>(
  dream: I,
  txn: DreamTransaction<I>,
  { skipHooks, reallyDestroy }: { skipHooks: boolean; reallyDestroy: boolean }
) {
  const dreamClass = dream.constructor as typeof Dream

  for (const associationName of dreamClass['dependentDestroyAssociationNames']()) {
    if (reallyDestroy) {
      await dream.txn(txn).reallyDestroyAssociation(associationName as any, { skipHooks })
    } else {
      await dream.txn(txn).destroyAssociation(associationName as any, { skipHooks })
    }
  }
}
