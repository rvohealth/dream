import _db from '../../db'
import Dream from '../../dream'
import DreamTransaction from '../transaction'
import { DreamConstructorType } from '../types'
import runHooksFor from './runHooksFor'
import safelyRunCommitHooks from './safelyRunCommitHooks'

export default async function destroyDream<
  I extends Dream,
  DB extends I['DB'],
  TableName extends keyof DB = I['table'] & keyof DB
>(dream: I, txn: DreamTransaction<I['DB']> | null = null): Promise<I> {
  await runHooksFor('beforeDestroy', dream)
  if (dream['_preventDeletion']) return dream.unpreventDeletion()
  const db = txn?.kyselyTransaction || _db('primary', dream.dreamconf)

  const Base = dream.constructor as DreamConstructorType<I>

  await db
    .deleteFrom(dream.table as any)
    .where(Base.primaryKey as any, '=', (dream as any)[Base.primaryKey])
    .execute()

  await runHooksFor('afterDestroy', dream)

  await safelyRunCommitHooks(dream, 'afterDestroyCommit', txn)

  return dream
}
