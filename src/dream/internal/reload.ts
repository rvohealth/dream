import Dream from '../../Dream.js'
import CannotReloadUnsavedDream from '../../errors/CannotReloadUnsavedDream.js'
import DreamTransaction from '../DreamTransaction.js'
import Query from '../Query.js'

export default async function reload<DreamInstance extends Dream>(
  dream: DreamInstance,
  txn: DreamTransaction<Dream> | null = null
) {
  if (dream.isNewRecord) throw new CannotReloadUnsavedDream(dream)

  let query: Query<DreamInstance> = new Query<DreamInstance>(dream)

  if (txn) query = query.txn(txn)
  // must always reload from the primary database to avoid the race condition in which changes
  // we have persisted are not yet propagated
  else query = query.connection('primary')

  query = query.removeAllDefaultScopes().where({ [dream.primaryKey as any]: dream.primaryKeyValue } as any)

  const reloadedRecord = await query.firstOrFail()
  dream.setAttributes(reloadedRecord.getAttributes() as any)

  dream['freezeAttributes']()

  return dream
}
