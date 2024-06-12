import Dream from '../../dream'
import CannotReloadUnsavedDream from '../../exceptions/cannot-reload-unsaved-dream'
import Query from '../query'
import DreamTransaction from '../transaction'

export default async function reload<DreamInstance extends Dream>(
  dream: DreamInstance,
  txn: DreamTransaction<Dream> | null = null
) {
  if (dream.isNewRecord) throw new CannotReloadUnsavedDream(dream)

  let query: Query<DreamInstance> = new Query<DreamInstance>(dream)

  if (txn) query = query.txn(txn)

  query = query.unscoped().where({ [dream.primaryKey as any]: dream.primaryKeyValue } as any)

  const reloadedRecord = (await query.first()) as DreamInstance
  dream.setAttributes(reloadedRecord.getAttributes() as any)

  dream['freezeAttributes']()

  return dream
}
