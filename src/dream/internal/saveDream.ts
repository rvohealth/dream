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

export default async function saveDream<DreamInstance extends Dream>(
  dream: DreamInstance,
  txn: DreamTransaction<Dream> | null = null
) {
  const db = txn?.kyselyTransaction || _db('primary', dream.dreamconf)

  const alreadyPersisted = dream.isPersisted

  await runHooksFor('beforeSave', dream, alreadyPersisted, null, txn as DreamTransaction<any>)
  if (alreadyPersisted)
    await runHooksFor('beforeUpdate', dream, alreadyPersisted, null, txn as DreamTransaction<any>)
  else await runHooksFor('beforeCreate', dream, alreadyPersisted, null, txn as DreamTransaction<any>)

  const beforeSaveChanges = dream.changes()

  // need to check validations after running before hooks, or else
  // model hooks that might make a model valid cannot run
  if (dream.isInvalid) throw new ValidationError(dream.constructor.name, dream.errors)

  await saveUnsavedAssociations(dream, txn)

  if (alreadyPersisted && !dream.isDirty) return dream

  let query: any

  const now = DateTime.now()
  if (!alreadyPersisted && !(dream as any).createdAt && dream.columns().has('createdAt'))
    (dream as any).createdAt = now
  if (!(dream.dirtyAttributes() as any).updatedAt && dream.columns().has('updatedAt'))
    (dream as any).updatedAt = now

  const sqlifiedAttributes = sqlAttributes(dream)

  if (alreadyPersisted) {
    query = db
      .updateTable(dream.table)
      .set(sqlifiedAttributes as any)
      // @ts-ignore
      .where(`${dream.table}.${dream.primaryKey}`, '=', dream.primaryKeyValue)
  } else {
    query = db.insertInto(dream.table).values(sqlifiedAttributes as any)
  }

  // BeforeSave/Update actions may clear all the data that we intended to save, leaving us with
  // an invalid update command. The Sortable decorator is an example of this.
  if (!alreadyPersisted || Object.keys(sqlifiedAttributes).length) {
    const data = await executeDatabaseQuery(query.returning([...dream.columns()]), 'executeTakeFirstOrThrow')
    dream.setAttributes(data)
  }

  // set frozen attributes to what has already been saved
  dream['freezeAttributes']()
  dream['attributesFromBeforeLastSave'] = dream['originalAttributes']
  dream['originalAttributes'] = dream.attributes()

  await runHooksFor('afterSave', dream, alreadyPersisted, beforeSaveChanges, txn as DreamTransaction<any>)
  if (alreadyPersisted)
    await runHooksFor('afterUpdate', dream, alreadyPersisted, beforeSaveChanges, txn as DreamTransaction<any>)
  else
    await runHooksFor('afterCreate', dream, alreadyPersisted, beforeSaveChanges, txn as DreamTransaction<any>)

  const commitHookType = alreadyPersisted ? 'afterUpdateCommit' : 'afterCreateCommit'
  await safelyRunCommitHooks(dream, 'afterSaveCommit', alreadyPersisted, beforeSaveChanges, txn)
  await safelyRunCommitHooks(dream, commitHookType, alreadyPersisted, beforeSaveChanges, txn)

  return dream
}
