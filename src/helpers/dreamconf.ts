import { DbConfig } from './path/types'

export default class Dreamconf<DB = any, Schema = any, AllDefaultScopeNames = any, PassthroughColumns = any> {
  public DB: DB
  public env: EnvOpts
  public allDefaultScopeNames: AllDefaultScopeNames
  public passthroughColumns: PassthroughColumns
  public schema: Schema

  constructor({ DB, env, allDefaultScopeNames, passthroughColumns, schema }: DreamconfOpts) {
    this.DB = DB
    this.allDefaultScopeNames = allDefaultScopeNames
    this.passthroughColumns = passthroughColumns
    this.env = env
    this.schema = schema
  }
}

export interface DreamconfOpts {
  DB: any
  env: EnvOpts
  allDefaultScopeNames: any
  passthroughColumns: any
  schema: any
}

export interface EnvOpts {
  db: DbConfig
}
