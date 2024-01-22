import Dream from '../../dream'
import Query from '../query'
import DreamTransaction from '../transaction'
import { DreamConstructorType } from '../types'

export default async function reload<DreamInstance extends Dream>(
  dream: DreamInstance,
  txn: DreamTransaction<DreamConstructorType<DreamInstance>> | null = null
) {
  const base = dream.constructor as DreamConstructorType<DreamInstance>
  let query: Query<DreamConstructorType<DreamInstance>> = new Query<DreamConstructorType<DreamInstance>>(base)

  if (txn) query = query.txn(txn)

  query = query
    .unscoped()
    // @ts-ignore
    .where({ [base.primaryKey as any]: dream[base.primaryKey] } as Updateable<Table>)

  // TODO: cleanup type chaos
  // @ts-ignore
  const newRecord = (await query.first()) as I
  dream.setAttributes(newRecord.attributes())

  dream['freezeAttributes']()

  return dream
}
