import { DbConfig } from './helpers/path/types'

export default class Dreamconf<
  DB extends any = any,
  InterpretedDB extends any = any,
  SyncedAssociations extends any = any,
  SyncedBelongsToAssociations extends any = any,
  VirtualColumns extends any = any,
  DBColumns extends any = any,
  DBTypeCache extends any = any,
> {
  public DB: DB
  public interpretedDB: InterpretedDB
  public syncedAssociations: SyncedAssociations
  public syncedBelongsToAssociations: SyncedBelongsToAssociations
  public virtualColumns: VirtualColumns
  public dbColumns: DBColumns
  public dbTypeCache: DBTypeCache
  public env: EnvOpts
  constructor({
    DB,
    interpretedDB,
    syncedAssociations,
    syncedBelongsToAssociations,
    virtualColumns,
    dbColumns,
    dbTypeCache,
    env,
  }: DreamconfOpts) {
    this.DB = DB
    this.interpretedDB = interpretedDB
    this.syncedAssociations = syncedAssociations
    this.syncedBelongsToAssociations = syncedBelongsToAssociations
    this.virtualColumns = virtualColumns
    this.dbColumns = dbColumns
    this.dbTypeCache = dbTypeCache
    this.env = env
  }
}

export interface DreamconfOpts {
  DB: any
  interpretedDB: any
  syncedAssociations: any
  syncedBelongsToAssociations: any
  virtualColumns: any
  dbColumns: any
  dbTypeCache: any
  env: EnvOpts
}

export interface EnvOpts {
  db: DbConfig
}

export enum AssociationDepths {
  ONE = 'ONE',
  TWO = 'TWO',
  THREE = 'THREE',
  FOUR = 'FOUR',
  FIVE = 'FIVE',
  SIX = 'SIX',
  SEVEN = 'SEVEN',
  EIGHT = 'EIGHT',
}
