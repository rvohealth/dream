import { Kysely, Transaction as KyselyTransaction } from 'kysely'
import DreamTransaction from '../dream/transaction'
import { SqlCommandType } from '../dream/types'
import { DbConnectionType } from './types'
import _db from '../db'
import Dream from '../dream'

export default class ConnectedToDB<
  DreamClass extends typeof Dream,
  DreamInstance extends InstanceType<DreamClass> = InstanceType<DreamClass>,
> {
  public readonly dreamClass: DreamClass
  public dreamTransaction: DreamTransaction<Dream> | null = null
  public connectionOverride?: DbConnectionType

  constructor(DreamClass: DreamClass, opts: ConnectedToDBOpts = {}) {
    this.dreamClass = DreamClass
    this.dreamTransaction = opts.transaction || null
    this.connectionOverride = opts.connection
  }

  public dbConnectionType(sqlCommandType: SqlCommandType): DbConnectionType {
    if (this.dreamTransaction) return 'primary'

    switch (sqlCommandType) {
      case 'select':
        return this.connectionOverride || (this.dreamClass['replicaSafe'] ? 'replica' : 'primary')

      default:
        return 'primary'
    }
  }

  // ATTENTION FRED
  // stop trying to make this async. You never learn...
  public dbFor(
    sqlCommandType: SqlCommandType
  ): Kysely<DreamInstance['DB']> | KyselyTransaction<DreamInstance['DB']> {
    if (this.dreamTransaction?.kyselyTransaction) return this.dreamTransaction?.kyselyTransaction
    return _db<DreamInstance>(this.dbConnectionType(sqlCommandType), this.dreamClass.prototype.dreamconf)
  }
}

export interface ConnectedToDBOpts {
  transaction?: DreamTransaction<Dream> | null | undefined
  connection?: DbConnectionType
}
