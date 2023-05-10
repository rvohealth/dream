import { Updateable } from 'kysely'
import Dream from '../dream'
import { SyncedBelongsToAssociations } from '../sync/associations'
import { DB } from '../sync/schema'
import DreamTransaction from './transaction'
import saveDream from './internal/saveDream'
import destroyDream from './internal/destroyDream'
import { AssociationModelParam, UpdateableInstanceFields } from './types'

export default class DreamInstanceTransactionBuilder<DreamInstance extends Dream> {
  public dreamInstance: DreamInstance
  public dreamTransaction: DreamTransaction
  constructor(dreamInstance: DreamInstance, txn: DreamTransaction) {
    this.dreamInstance = dreamInstance
    this.dreamTransaction = txn
  }

  public async destroy<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    TableName extends keyof DB = DreamInstance['table'] & keyof DB
  >(this: I): Promise<DreamInstance> {
    return destroyDream(this.dreamInstance, this.dreamTransaction)
  }

  public async update<
    I extends DreamInstanceTransactionBuilder<DreamInstance>,
    BelongsToModelAssociationNames extends keyof SyncedBelongsToAssociations[DreamInstance['table']] = keyof SyncedBelongsToAssociations[DreamInstance['table']]
  >(
    this: I,
    attributes: UpdateableInstanceFields<DreamInstance, BelongsToModelAssociationNames>
  ): Promise<DreamInstance> {
    this.dreamInstance.setAttributes(attributes)
    return saveDream(this.dreamInstance, this.dreamTransaction)
  }

  public async save<I extends DreamInstanceTransactionBuilder<DreamInstance>>(this: I) {
    return saveDream(this.dreamInstance, this.dreamTransaction)
  }
}
