export default class Dreamconf {
  public DB: any
  public interpretedDB: any
  public syncedAssociations: any
  public syncedBelongsToAssociations: any
  public virtualColumns: any
  public dbColumns: any
  public dbTypeCache: any
  constructor({
    DB,
    interpretedDB,
    syncedAssociations,
    syncedBelongsToAssociations,
    virtualColumns,
    dbColumns,
    dbTypeCache,
  }: DreamconfOpts) {
    this.DB = DB
    this.interpretedDB = interpretedDB
    this.syncedAssociations = syncedAssociations
    this.syncedBelongsToAssociations = syncedBelongsToAssociations
    this.virtualColumns = virtualColumns
    this.dbColumns = dbColumns
    this.dbTypeCache = dbTypeCache
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
  db: DBEnvOpts
}

export interface DBEnvOpts {
  development: {
    primary: Partial<DBOpts>
    replica?: Partial<DBOpts>
  }
  test: {
    primary: Partial<DBOpts>
    replica?: Partial<DBOpts>
  }
  production: {
    primary: Partial<DBOpts>
    replica?: Partial<DBOpts>
  }
}

export interface DBOpts {
  user: string
  password: string
  host: string
  name: string
  port: string
  use_ssl: string
}
