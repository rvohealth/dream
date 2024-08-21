import { Kysely, Transaction as KyselyTransaction } from 'kysely'
import _db from '../db'
import Dream from '../dream'
import DreamTransaction from '../dream/transaction'
import { DreamConstructorType, SqlCommandType } from '../dream/types'
import { DbConnectionType } from './types'

export default class ConnectedToDB<DreamInstance extends Dream> {
  public readonly dreamClass: DreamConstructorType<DreamInstance>
  public dreamTransaction: DreamTransaction<Dream> | null = null
  public connectionOverride?: DbConnectionType

  constructor(
    public dreamInstance: DreamInstance,
    opts: ConnectedToDBOpts = {}
  ) {
    this.dreamClass = dreamInstance.constructor as DreamConstructorType<DreamInstance>
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
    return _db<DreamInstance>(this.dbConnectionType(sqlCommandType))
  }
}

export interface ConnectedToDBOpts {
  transaction?: DreamTransaction<Dream> | null | undefined
  connection?: DbConnectionType
}
