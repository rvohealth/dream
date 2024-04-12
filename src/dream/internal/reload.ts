import Dream from '../../dream'
import CannotReloadUnsavedDream from '../../exceptions/cannot-reload-unsaved-dream'
import Query from '../query'
import DreamTransaction from '../transaction'
import { DreamConstructorType } from '../types'

export default async function reload<DreamInstance extends Dream>(
  dream: DreamInstance,
  txn: DreamTransaction<Dream> | null = null
) {
  if (dream.isNewRecord) throw new CannotReloadUnsavedDream(dream)

  const base = dream.constructor as DreamConstructorType<DreamInstance>
  let query: Query<DreamConstructorType<DreamInstance>> = new Query<DreamConstructorType<DreamInstance>>(base)

  if (txn) query = query.txn(txn)

  query = query
    .unscoped()
    .where({ [base.primaryKey as any]: dream[base.primaryKey as keyof typeof dream] } as any)

  const newRecord = (await query.first()) as DreamInstance
  dream.setAttributes(newRecord.attributes() as any)

  dream['freezeAttributes']()

  return dream
}
