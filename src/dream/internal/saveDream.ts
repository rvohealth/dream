import { DateTime } from 'luxon'
import _db from '../../db'
import Dream from '../../Dream'
import ValidationError from '../../errors/ValidationError'
import sqlAttributes from '../../helpers/sqlAttributes'
import DreamTransaction from '../DreamTransaction'
import executeDatabaseQuery from './executeDatabaseQuery'
import runHooksFor from './runHooksFor'
import safelyRunCommitHooks from './safelyRunCommitHooks'

export default async function saveDream<DreamInstance extends Dream>(
  dream: DreamInstance,
  txn: DreamTransaction<Dream> | null = null,
  { skipHooks = false }: { skipHooks?: boolean } = {}
) {
  const db = txn?.kyselyTransaction || _db('primary')

  const alreadyPersisted = dream.isPersisted

  if (!skipHooks) {
    if (alreadyPersisted)
      await runHooksFor('beforeUpdate', dream, alreadyPersisted, null, txn as DreamTransaction<any>)
    else await runHooksFor('beforeCreate', dream, alreadyPersisted, null, txn as DreamTransaction<any>)
    await runHooksFor('beforeSave', dream, alreadyPersisted, null, txn as DreamTransaction<any>)
  }

  const beforeSaveChanges = dream.changes()

  // need to check validations after running before hooks, or else
  // model hooks that might make a model valid cannot run
  if (dream.isInvalid) throw new ValidationError(dream.constructor.name, dream.errors)

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
      .where(`${dream.table}.${dream.primaryKey}`, '=', dream.primaryKeyValue)
  } else {
    query = db.insertInto(dream.table).values(sqlifiedAttributes as any)
  }

  // BeforeSave/Update actions may clear all the data that we intended to save, leaving us with
  // an invalid update command. The Sortable decorator is an example of this.
  if (!alreadyPersisted || Object.keys(sqlifiedAttributes).length) {
    const data = await executeDatabaseQuery(query.returning([...dream.columns()]), 'executeTakeFirstOrThrow')
    dream['isPersisted'] = true
    dream.setAttributes(data)
  }

  // set frozen attributes to what has already been saved
  dream['freezeAttributes']()
  dream['attributesFromBeforeLastSave'] = dream['originalAttributes']
  dream['originalAttributes'] = dream.getAttributes()

  if (!skipHooks) {
    await runHooksFor('afterSave', dream, alreadyPersisted, beforeSaveChanges, txn as DreamTransaction<any>)
    if (alreadyPersisted)
      await runHooksFor(
        'afterUpdate',
        dream,
        alreadyPersisted,
        beforeSaveChanges,
        txn as DreamTransaction<any>
      )
    else
      await runHooksFor(
        'afterCreate',
        dream,
        alreadyPersisted,
        beforeSaveChanges,
        txn as DreamTransaction<any>
      )

    const commitHookType = alreadyPersisted ? 'afterUpdateCommit' : 'afterCreateCommit'
    await safelyRunCommitHooks(dream, commitHookType, alreadyPersisted, beforeSaveChanges, txn)
    await safelyRunCommitHooks(dream, 'afterSaveCommit', alreadyPersisted, beforeSaveChanges, txn)
  }

  return dream
}
