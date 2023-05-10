import { DateTime } from 'luxon'
import Dream from '../../dream'
import ValidationError from '../../exceptions/validation-error'
import DreamTransaction from '../transaction'
import runHooksFor from './runHooksFor'
import saveUnsavedAssociations from './saveUnsavedAssociations'
import sqlAttributes from '../../helpers/sqlAttributes'
import safelyRunCommitHooks from './safelyRunCommitHooks'
import _db from '../../db'
import FailedToSaveDream from '../../exceptions/failed-to-save-dream'

export default async function saveDream<DreamInstance extends Dream>(
  dream: DreamInstance,
  txn: DreamTransaction | null = null
) {
  const db = txn?.kyselyTransaction || _db

  const alreadyPersisted = dream.isPersisted

  await runHooksFor('beforeSave', dream)
  if (alreadyPersisted) await runHooksFor('beforeUpdate', dream)
  else await runHooksFor('beforeCreate', dream)

  // need to check validations after running before hooks, or else
  // model hooks that might make a model valid cannot run
  if (dream.isInvalid) throw new ValidationError(dream.constructor.name, dream.errors)

  await saveUnsavedAssociations(dream, txn)

  if (alreadyPersisted && !dream.isDirty) return dream

  let query: any

  const now = DateTime.now().toUTC()
  if (!alreadyPersisted && !(dream as any).created_at && (dream.columns() as any[]).includes('created_at'))
    (dream as any).created_at = now
  if (!(dream.dirtyAttributes() as any).updated_at && (dream.columns() as any[]).includes('updated_at'))
    (dream as any).updated_at = now

  const sqlifiedAttributes = sqlAttributes(dream.dirtyAttributes())

  if (alreadyPersisted) {
    query = db.updateTable(dream.table).set(sqlifiedAttributes as any)
  } else {
    query = db.insertInto(dream.table).values(sqlifiedAttributes as any)
  }

  try {
    if (alreadyPersisted) {
      await query.executeTakeFirstOrThrow()
    } else {
      const data = await query.returning(dream.columns()).executeTakeFirstOrThrow()
      dream.setAttributes(data)
    }
  } catch (error) {
    throw new FailedToSaveDream(dream.constructor as typeof Dream, error as Error)
  }

  // set frozen attributes to what has already been saved
  dream.freezeAttributes()

  await runHooksFor('afterSave', dream)
  if (alreadyPersisted) await runHooksFor('afterUpdate', dream)
  else await runHooksFor('afterCreate', dream)

  const commitHookType = alreadyPersisted ? 'afterUpdateCommit' : 'afterCreateCommit'
  await safelyRunCommitHooks(dream, 'afterSaveCommit', txn)
  await safelyRunCommitHooks(dream, commitHookType, txn)

  return dream
}
