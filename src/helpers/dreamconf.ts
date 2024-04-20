import { DbConfig } from './path/types'

export default class Dreamconf<DB = any, Schema = any> {
  public DB: DB
  public schema: Schema
  public env: EnvOpts
  constructor({ DB, schema, env }: DreamconfOpts) {
    this.DB = DB
    this.schema = schema
    this.env = env
  }
}

export interface DreamconfOpts {
  DB: any
  schema: any
  env: EnvOpts
}

export interface EnvOpts {
  db: DbConfig
}
