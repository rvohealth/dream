import { DbConfig } from './path/types'

export default class Dreamconf<DB = any, Schema = any, GlobalSchema = any> {
  public DB: DB
  public env: EnvOpts
  public schema: Schema
  public globalSchema: GlobalSchema

  constructor({ DB, env, schema, globalSchema }: DreamconfOpts) {
    this.DB = DB
    this.env = env
    this.schema = schema
    this.globalSchema = globalSchema
  }
}

export interface DreamconfOpts {
  DB: any
  env: EnvOpts
  schema: any
  globalSchema: any
}

export interface EnvOpts {
  db: DbConfig
}
