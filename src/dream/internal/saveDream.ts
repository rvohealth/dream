import Dream from '../../Dream.js'
import ValidationError from '../../errors/ValidationError.js'
import { DateTime } from '../../helpers/DateTime.js'
import sqlAttributes from '../../helpers/sqlAttributes.js'
import DreamTransaction from '../DreamTransaction.js'
import Query from '../Query.js'
import runHooksFor from './runHooksFor.js'

export default async function saveDream<DreamInstance extends Dream>(
  dream: DreamInstance,
  txn: DreamTransaction<Dream> | null = null,
  { skipHooks = false }: { skipHooks?: boolean } = {}
): Promise<DreamInstance> {
  const alreadyPersisted = dream.isPersisted

  if (!skipHooks) {
    if (alreadyPersisted) await runHooksFor('beforeUpdate', dream, alreadyPersisted, null, txn)
    else await runHooksFor('beforeCreate', dream, alreadyPersisted, null, txn)
    await runHooksFor('beforeSave', dream, alreadyPersisted, null, txn)
  }

  const beforeSaveChanges = dream.changes()

  // need to check validations after running before hooks, or else
  // model hooks that might make a model valid cannot run
  if (dream.isInvalid) throw new ValidationError(dream['sanitizedConstructorName'], dream.errors)

  if (alreadyPersisted && !dream.isDirty) return dream

  const now = DateTime.now()
  if (!alreadyPersisted && !(dream as any).createdAt && dream.columns().has('createdAt'))
    (dream as any).createdAt = now
  if (!(dream.dirtyAttributes() as any).updatedAt && dream.columns().has('updatedAt'))
    (dream as any).updatedAt = now

  const hasUnsavedData = !!Object.keys(sqlAttributes(dream)).length

  // BeforeSave/Update actions may clear all the data that we intended to save, leaving us with
  // an invalid update command. The Sortable decorator is an example of this.
  if (!alreadyPersisted || hasUnsavedData) {
    const data = await Query.dbDriverClass(dream.connectionName || 'default').saveDream(dream, txn)

    dream['isPersisted'] = true
    dream.setAttributes(data)
  }

  // set frozen attributes to what has already been saved
  dream['freezeAttributes']()
  dream['attributesFromBeforeLastSave'] = dream['originalAttributes']
  dream['originalAttributes'] = dream.getAttributes()

  if (!skipHooks) {
    await runHooksFor('afterSave', dream, alreadyPersisted, beforeSaveChanges, txn)
    if (alreadyPersisted) await runHooksFor('afterUpdate', dream, alreadyPersisted, beforeSaveChanges, txn)
    else await runHooksFor('afterCreate', dream, alreadyPersisted, beforeSaveChanges, txn)

    await runHooksFor(
      alreadyPersisted ? 'afterUpdateCommit' : 'afterCreateCommit',
      dream,
      alreadyPersisted,
      beforeSaveChanges,
      txn
    )

    await runHooksFor('afterSaveCommit', dream, alreadyPersisted, beforeSaveChanges, txn)
  }

  return dream
}
