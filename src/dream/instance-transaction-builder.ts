import Dream from '../dream'
import DreamTransaction from './transaction'

export default class DreamInstanceTransactionBuilder<DreamInstance extends Dream> {
  public dreamInstance: DreamInstance
  public dreamTransaction: DreamTransaction
  constructor(dreamInstance: DreamInstance, txn: DreamTransaction) {
    this.dreamInstance = dreamInstance
    this.dreamTransaction = txn
  }
}
