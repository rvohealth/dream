import { Kysely, Transaction as KyselyTransaction } from 'kysely'
import _db from '../db/index.js'
import Dream from '../Dream.js'
import DreamTransaction from '../dream/DreamTransaction.js'
import { DreamConstructorType, SqlCommandType } from '../dream/types.js'
import { DbConnectionType } from './types.js'

export default class ConnectedToDB<DreamInstance extends Dream> {
  protected readonly dreamClass: DreamConstructorType<DreamInstance>
  protected dreamTransaction: DreamTransaction<Dream> | null = null
  protected connectionOverride?: DbConnectionType

  /**
   * @internal
   *
   * stores the Dream models joined in this Query instance
   */
  protected readonly innerJoinDreamClasses: readonly (typeof Dream)[] = Object.freeze([])

  constructor(
    public dreamInstance: DreamInstance,
    opts: ConnectedToDBOpts = {}
  ) {
    this.dreamClass = dreamInstance.constructor as DreamConstructorType<DreamInstance>
    this.dreamTransaction = opts.transaction || null
    this.connectionOverride = opts.connection
    this.innerJoinDreamClasses = Object.freeze(opts.innerJoinDreamClasses || [])
  }

  public dbConnectionType(sqlCommandType: SqlCommandType): DbConnectionType {
    if (this.dreamTransaction) return 'primary'

    switch (sqlCommandType) {
      case 'select':
        return this.connectionOverride || (this.isReplicaSafe() ? 'replica' : 'primary')

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

  private isReplicaSafe(): boolean {
    return this.innerJoinDreamClasses.reduce(
      (accumulator, dreamClass) => accumulator && dreamClass['replicaSafe'],
      this.dreamClass['replicaSafe']
    )
  }
}

export interface ConnectedToDBOpts {
  transaction?: DreamTransaction<Dream> | null | undefined
  connection?: DbConnectionType
  innerJoinDreamClasses?: readonly (typeof Dream)[]
}
