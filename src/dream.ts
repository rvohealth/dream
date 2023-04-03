import { Tables } from './db/reflections'
import db from './db'
import { DB, DBColumns, DBOpts } from './sync/schema'
import { Selectable, SelectExpression, SelectType, Updateable } from 'kysely'

export default function dream<Tablename extends Tables>(tableName: Tablename) {
  const columns = DBColumns[tableName]

  type Table = DB[Tablename]
  type IdColumn = Table['id']
  type Data = Selectable<Table>
  type Id = Readonly<SelectType<IdColumn>>

  return class Dream {
    public static get tableName(): Tables {
      return tableName
    }

    public static async create<T extends Dream>(
      this: { new (): T } & typeof Dream,
      opts: Updateable<Table>
    ): Promise<T> {
      return (await new this(opts).save()) as T
    }

    public static async find<T extends Dream>(this: { new (): T } & typeof Dream, id: Id): Promise<T> {
      const data = await db
        .selectFrom(this.tableName)
        .select(columns as SelectExpression<DB, keyof DB>[])
        .where('id', '=', id! as unknown as number)
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
      const { id } = await db
        .insertInto(tableName)
        .values(this.attributes as any)
        .returning('id')
        .executeTakeFirstOrThrow()

      const base = this.constructor as typeof Dream
      return (await base.find(id as unknown as Id)) as T
    }
  }
}
