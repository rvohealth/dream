import { DateTime } from 'luxon'
import Dream from '../../dream'
import ValidationError from '../../exceptions/validation-error'
import DreamTransaction from '../transaction'
import runHooksFor from './runHooksFor'
import saveUnsavedAssociations from './saveUnsavedAssociations'
import sqlAttributes from '../../helpers/sqlAttributes'
import safelyRunCommitHooks from './safelyRunCommitHooks'
import _db from '../../db'
import executeDatabaseQuery from './executeDatabaseQuery'
import { DreamConstructorType } from '../types'

export default async function saveDream<DreamInstance extends Dream>(
  dream: DreamInstance,
  txn: DreamTransaction<DreamInstance['DB']> | null = null
) {
  const db = txn?.kyselyTransaction || _db('primary')

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

  const now = DateTime.now()
  if (!alreadyPersisted && !(dream as any).createdAt && (dream.columns() as any[]).includes('createdAt'))
    (dream as any).createdAt = now
  if (!(dream.dirtyAttributes() as any).updatedAt && (dream.columns() as any[]).includes('updatedAt'))
    (dream as any).updatedAt = now

  const sqlifiedAttributes = sqlAttributes(dream.dirtyAttributes())

  if (alreadyPersisted) {
    query = db
      .updateTable(dream.table)
      .set(sqlifiedAttributes as any)
      // @ts-ignore
      .where(`${dream.table}.${dream.primaryKey}`, '=', dream.primaryKeyValue)
  } else {
    query = db.insertInto(dream.table).values(sqlifiedAttributes as any)
  }

  const data = await executeDatabaseQuery(query.returning(dream.columns()), 'executeTakeFirstOrThrow')
  dream.setAttributes(data)

  // set frozen attributes to what has already been saved
  dream.freezeAttributes()
  dream.attributesFromBeforeLastSave = dream.originalAttributes
  dream.originalAttributes = dream.attributes()

  await runHooksFor('afterSave', dream)
  if (alreadyPersisted) await runHooksFor('afterUpdate', dream)
  else await runHooksFor('afterCreate', dream)

  const commitHookType = alreadyPersisted ? 'afterUpdateCommit' : 'afterCreateCommit'
  await safelyRunCommitHooks(dream, 'afterSaveCommit', txn)
  await safelyRunCommitHooks(dream, commitHookType, txn)

  return dream
}
