import { Tables } from './db/reflections'
import db from './db'
import { DB, DBColumns, DBOpts } from './sync/schema'
import { Selectable, SelectExpression, SelectType, Updateable } from 'kysely'
import snakeify from './helpers/snakeify'

export default function dream<Tablename extends Tables>(tableName: Tablename) {
  const columns = DBColumns[tableName]

  type Table = DB[Tablename]
  type IdColumn = Table['id']
  type Data = Selectable<Table>
  type Id = Readonly<SelectType<IdColumn>>

  return class Dream {
    public static primaryKey = 'id'
    public static createdAtField = 'createdAt'

    public static get table(): Tables {
      return tableName
    }

    public static async all<T extends Dream>(this: { new (): T } & typeof Dream): Promise<T[]> {
      const results = await db
        .selectFrom(this.table)
        .select(columns as SelectExpression<DB, keyof DB>[])
        .execute()

      return results.map(record => new this(record) as T)
    }

    public static async create<T extends Dream>(
      this: { new (): T } & typeof Dream,
      opts?: Updateable<Table>
    ): Promise<T> {
      return (await new this(opts).save()) as T
    }

    public static async find<T extends Dream>(this: { new (): T } & typeof Dream, id: Id): Promise<T> {
      const data = await db
        .selectFrom(this.table)
        .select(columns as SelectExpression<DB, keyof DB>[])
        .where('id', '=', id! as unknown as number)
        .executeTakeFirstOrThrow()
      return new this(data) as T
    }

    public static async findBy<T extends Dream>(
      this: { new (): T } & typeof Dream,
      attributes: Updateable<Table>
    ): Promise<T> {
      const query = db.selectFrom(this.table).select(columns as SelectExpression<DB, keyof DB>[])

      Object.keys(attributes).forEach(attr => {
        query.where(attr as any, '=', (attributes as any)[attr])
      })

      const data = await query.executeTakeFirstOrThrow()
      return new this(data) as T
    }

    public static async first<T extends Dream>(this: { new (): T } & typeof Dream): Promise<T> {
      const data = await db
        .selectFrom(this.table)
        .select(columns as SelectExpression<DB, keyof DB>[])
        .executeTakeFirstOrThrow()
      return new this(data) as T
    }

    public static async last<T extends Dream>(this: { new (): T } & typeof Dream): Promise<T> {
      const data = await db
        .selectFrom(this.table)
        .orderBy(snakeify(this.createdAtField), 'desc')
        .select(columns as SelectExpression<DB, keyof DB>[])
        .executeTakeFirstOrThrow()
      return new this(data) as T
    }

    constructor(opts?: Updateable<Table>) {
      if (opts) this.setAttributes(opts)
    }

    public attributes: Updateable<Table> = {}
    public setAttributes(attributes: Updateable<Table>) {
      Object.keys(attributes).forEach(attr => {
        // @ts-ignore
        this[attr] = (attributes as any)[attr]
      })
    }

    public async save<T extends Dream>(this: T): Promise<T> {
      let query = db.insertInto(tableName)
      if (Object.keys(this.attributes).length) {
        query = query.values(this.attributes as any)
      } else {
        query = query.values({ id: 0 } as any)
      }

      const data = await query.returningAll().executeTakeFirstOrThrow()

      const base = this.constructor as typeof Dream
      // @ts-ignore
      return (await base.find(data[base.primaryKey as any] as unknown as Id)) as T
    }
  }
}
