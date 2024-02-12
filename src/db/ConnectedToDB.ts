import DreamTransaction from '../dream/transaction'
import { SqlCommandType } from '../dream/types'
import { DbConnectionType } from './types'
import _db from '../db'
import Dream from '../dream'

export default class ConnectedToDB<
  DreamClass extends typeof Dream,
  DreamInstance extends InstanceType<DreamClass> = InstanceType<DreamClass>,
  DB extends DreamInstance['DB'] = DreamInstance['DB'],
  ColumnType = keyof DB[keyof DB] extends never ? unknown : keyof DB[keyof DB],
> {
  public readonly dreamClass: DreamClass
  public dreamTransaction: DreamTransaction<DB> | null = null
  public connectionOverride?: DbConnectionType
  constructor(DreamClass: DreamClass, opts: ConnectedToDBOpts<DreamClass, ColumnType> = {}) {
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
  public dbFor(sqlCommandType: SqlCommandType) {
    // ): Kysely<InstanceType<DreamClass>['DB'] | Transaction<InstanceType<DreamClass>['DB']>> {
    if (this.dreamTransaction?.kyselyTransaction) return this.dreamTransaction?.kyselyTransaction
    return _db<InstanceType<DreamClass>['DB']>(
      this.dbConnectionType(sqlCommandType),
      this.dreamClass.prototype.dreamconf
    )
  }
}

export interface ConnectedToDBOpts<
  DreamClass extends typeof Dream,
  ColumnType = keyof InstanceType<DreamClass>['DB'][keyof InstanceType<DreamClass>['DB']] extends never
    ? unknown
    : keyof InstanceType<DreamClass>['DB'][keyof InstanceType<DreamClass>['DB']],
  DreamInstance extends InstanceType<DreamClass> = InstanceType<DreamClass>,
  DB extends DreamInstance['DB'] = DreamInstance['DB'],
  SyncedAssociations extends DreamInstance['syncedAssociations'] = DreamInstance['syncedAssociations'],
> {
  transaction?: DreamTransaction<DB> | null | undefined
  connection?: DbConnectionType
}
