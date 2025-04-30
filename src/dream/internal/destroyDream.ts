import Dream from '../../Dream.js'
import DreamTransaction from '../DreamTransaction.js'
import destroyAssociatedRecords from './destroyAssociatedRecords.js'
import { DestroyOptions as OptionalDestroyOptions } from './destroyOptions.js'
import runHooksFor from './runHooksFor.js'
import softDeleteDream from './softDeleteDream.js'

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

  if (cascade) {
    await destroyAssociatedRecords(dream, txn, options)
  }

  if (!skipHooks) {
    await runHooksFor('beforeDestroy', dream, true, null, txn)
  }

  await maybeDestroyDream(dream, txn, reallyDestroy)

  if (!skipHooks) {
    await runHooksFor('afterDestroy', dream, true, null, txn)
    await runHooksFor('afterDestroyCommit', dream, true, null, txn)
  }

  if (shouldSoftDelete(dream, reallyDestroy)) {
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
) {
  if (shouldSoftDelete(dream, reallyDestroy)) {
    await softDeleteDream(dream, txn)
  } else if (!dream['_preventDeletion']) {
    await txn.kyselyTransaction
      .deleteFrom(dream.table as any)
      .where(dream.primaryKey as any, '=', dream.primaryKeyValue)
      .execute()
  }
}
