import { DbConfig } from './path/types'

export default class Dreamconf<DB = any, Schema = any, PassthroughColumns = any> {
  public DB: DB
  public env: EnvOpts
  public passthroughColumns: PassthroughColumns
  public schema: Schema

  constructor({ DB, env, passthroughColumns, schema }: DreamconfOpts) {
    this.DB = DB
    this.passthroughColumns = passthroughColumns
    this.env = env
    this.schema = schema
  }
}

export interface DreamconfOpts {
  DB: any
  env: EnvOpts
  passthroughColumns: any
  schema: any
}

export interface EnvOpts {
  db: DbConfig
}
