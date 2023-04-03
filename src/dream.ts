import { Tables } from './db/reflections'
import db from './db'
import { DB, DBColumns, DBOpts } from './sync/schema'
import { ColumnType, SelectExpression } from 'kysely'
import { InsertObjectOrList } from 'kysely/dist/cjs/parser/insert-values-parser'

export default function dream<Tablename extends Tables>(tableName: Tables) {
  const keys = DBColumns[tableName]
  type ThisTableOpts = DBOpts[Tablename]

  return class Dream {
    public static get tableName(): Tables {
      return tableName
    }

    public static async create(opts: ThisTableOpts) {
      return await new this(opts).save()
    }

    public static async find(id: ThisTableOpts['id']) {
      return await db
        .selectFrom(this.tableName)
        .select(keys as SelectExpression<DB, keyof DB>[])
        .where('id', '=', id! as unknown as number)
        .executeTakeFirstOrThrow()
    }

    public attributes: ThisTableOpts = {}
    constructor(opts?: ThisTableOpts) {
      if (opts) this.setAttributes(opts)
    }

    public setAttributes(opts: ThisTableOpts) {
      Object.keys(opts).forEach(opt => {
        // @ts-ignore
        this.attributes[opt] = opts[opt]
      })
    }

    public async save<T extends Dream>(this: T) {
      const { id } = await db
        .insertInto(tableName)
        .values(this.attributes as InsertObjectOrList<DB, keyof DB>)
        .returning('id')
        .executeTakeFirstOrThrow()

      const base = this.constructor as typeof Dream
      return await base.find(id as unknown as ColumnType<number, number | undefined, number>)
    }
  }
}
