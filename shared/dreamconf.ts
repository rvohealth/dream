import { DbConfig } from './helpers/path/types'

export default class Dreamconf {
  public DB: any
  public interpretedDB: any
  public syncedAssociations: any
  public syncedBelongsToAssociations: any
  public virtualColumns: any
  public dbColumns: any
  public dbTypeCache: any
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
