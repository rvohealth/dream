import Dream from '../../dream'
import DreamTransaction from '../transaction'
import runHooksFor from './runHooksFor'
import safelyRunCommitHooks from './safelyRunCommitHooks'

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
  { skipHooks = false }: { skipHooks?: boolean } = {}
): Promise<I> {
  if (txn) {
    return await destroyDreamWithTransaction(dream, txn, { skipHooks })
  } else {
    const dreamClass = dream.constructor as typeof Dream
    return await dreamClass.transaction(
      async txn => await destroyDreamWithTransaction<I>(dream, txn, { skipHooks })
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
  { skipHooks }: { skipHooks: boolean }
): Promise<I> {
  if (!skipHooks) {
    await runHooksFor('beforeDestroy', dream, true, null, txn)
  }

  await destroyAssociatedRecords(dream, txn, { skipHooks })
  await maybeDestroyDream(dream, txn)

  if (!skipHooks) {
    await runHooksFor('afterDestroy', dream, true, null, txn)
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
async function maybeDestroyDream<I extends Dream>(dream: I, txn: DreamTransaction<I>) {
  if (dream['_preventDeletion']) {
    dream.unpreventDeletion()
  } else {
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
  { skipHooks }: { skipHooks: boolean }
) {
  const dreamClass = dream.constructor as typeof Dream

  for (const associationName of dreamClass['dependentDestroyAssociationNames']()) {
    await dream.txn(txn).destroyAssociation(associationName as any, { skipHooks })
  }
}
