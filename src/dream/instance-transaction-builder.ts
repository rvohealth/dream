import { Updateable } from 'kysely'
import Dream from '../dream'
import { SyncedBelongsToAssociations } from '../sync/associations'
import { DB } from '../sync/schema'
import DreamTransaction from './transaction'
import saveDream from './internal/saveDream'
import destroyDream from './internal/destroyDream'
import { AssociationModelParam } from './types'

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
    TableName extends keyof DB = DreamInstance['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName],
    BelongsToModelAssociationNames extends keyof SyncedBelongsToAssociations[DreamInstance['table']] = keyof SyncedBelongsToAssociations[DreamInstance['table']],
    AssociatedModelParam extends AssociationModelParam<
      DreamInstance,
      BelongsToModelAssociationNames
    > = AssociationModelParam<DreamInstance, BelongsToModelAssociationNames>
  >(this: I, attributes: Updateable<Table> | AssociatedModelParam): Promise<DreamInstance> {
    this.dreamInstance.setAttributes(attributes)
    // call save rather than _save so that any unsaved associations in the
    // attributes are saved with this model in a transaction
    return saveDream(this.dreamInstance, this.dreamTransaction)
  }

  public async save<I extends DreamInstanceTransactionBuilder<DreamInstance>>(this: I) {
    return saveDream(this.dreamInstance, this.dreamTransaction)
  }
}
