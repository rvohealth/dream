import db from './db'
import * as pluralize from 'pluralize'
import { Tables, TableInterfaces } from './db/reflections'

export default class Dream<T extends TableInterfaces> {
  public static get tableName(): Tables {
    return pluralize(this.prototype.constructor.name) as Tables
  }

  public static async create<T extends TableInterfaces>(opts: T) {
    // await db.insertInto(this.tableName)
  }

  constructor(opts?: T) {}
}
