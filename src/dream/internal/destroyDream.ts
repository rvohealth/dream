import _db from '../../db'
import Dream from '../../dream'
import DreamTransaction from '../transaction'
import runHooksFor from './runHooksFor'
import safelyRunCommitHooks from './safelyRunCommitHooks'

export default async function destroyDream<I extends Dream>(
  dream: I,
  txn: DreamTransaction<I> | null = null,
  { skipHooks = false }: { skipHooks?: boolean } = {}
): Promise<I> {
  if (!skipHooks) {
    await runHooksFor('beforeDestroy', dream, true, null, txn || undefined)
  }

  if (dream['_preventDeletion']) return dream.unpreventDeletion()
  const db = txn?.kyselyTransaction || _db('primary', dream.dreamconf)

  await db
    .deleteFrom(dream.table as any)
    .where(dream.primaryKey as any, '=', dream.primaryKeyValue)
    .execute()

  if (!skipHooks) {
    await runHooksFor('afterDestroy', dream, true, null, txn || undefined)

    await safelyRunCommitHooks(dream, 'afterDestroyCommit', true, null, txn)
  }

  return dream
}
