import { Tables } from './db/reflections'
import db from './db'
import { DB, DBColumns } from './sync/schema'
import { Selectable, SelectExpression, SelectType, Updateable } from 'kysely'
import snakeify from './helpers/snakeify'

export default function dream<
  TableIndex extends keyof DB & string,
  IdColumnName extends keyof DB[TableIndex] & string
>(tableName: TableIndex, primaryKey: IdColumnName) {
  const columns = DBColumns[tableName]

  type Table = DB[TableIndex]
  type IdColumn = Table[IdColumnName]
  type Data = Selectable<Table>
  type Id = Readonly<SelectType<IdColumn>>

  class Dream {
    public static primaryKey: IdColumnName = primaryKey
    public static createdAtField = 'createdAt'

    public static get isDream() {
      return true
    }

    public static get table(): Tables {
      return tableName
    }

    public static async all<T extends Dream>(this: { new (): T } & typeof Dream): Promise<T[]> {
      const results = await db
        .selectFrom(this.table)
        .select(columns as any[])
        .execute()

      return results.map(record => new this(record) as T)
    }

    public static async count<T extends Dream>(this: { new (): T } & typeof Dream): Promise<number> {
      const { count } = db.fn
      const data = await db
        .selectFrom(this.table)
        .select(count(`${this.table}.id`).as('tablecount'))
        .executeTakeFirstOrThrow()

      return parseInt(data.tablecount.toString())
    }

    public static async create<T extends Dream>(
      this: { new (): T } & typeof Dream,
      opts?: Updateable<Table>
    ) {
      return (await new this(opts).save()) as T
    }

    public static async find<T extends Dream>(this: { new (): T } & typeof Dream, id: Id): Promise<T> {
      const data = await db
        .selectFrom(this.table)
        .select(columns as any[])
        .where('id', '=', id! as unknown as number)
        .executeTakeFirstOrThrow()
      return new this(data) as T
    }

    public static async findBy<T extends Dream>(
      this: { new (): T } & typeof Dream,
      attributes: Updateable<Table>
    ): Promise<T> {
      const query = db.selectFrom(this.table).select(columns as any[])

      Object.keys(attributes).forEach(attr => {
        query.where(attr as any, '=', (attributes as any)[attr])
      })

      const data = await query.executeTakeFirstOrThrow()
      return new this(data) as T
    }

    public static async first<T extends Dream>(this: { new (): T } & typeof Dream): Promise<T> {
      const data = await db
        .selectFrom(this.table)
        .select(columns as any[])
        .executeTakeFirstOrThrow()
      return new this(data) as T
    }

    public static async last<T extends Dream>(this: { new (): T } & typeof Dream): Promise<T> {
      const data = await db
        .selectFrom(this.table)
        .orderBy(snakeify(this.createdAtField), 'desc')
        .select(columns as any[])
        .executeTakeFirstOrThrow()
      return new this(data) as T
    }

    public static limit<T extends Dream>(this: { new (): T } & typeof Dream, count: number) {
      const query: SelectQuery = new SelectQuery(this.prototype.constructor)
      query.limit(count)
      return query
    }

    public static order<ColumnName extends keyof Table & string>(
      column: ColumnName,
      direction: 'asc' | 'desc' = 'asc'
    ) {
      const query: SelectQuery = new SelectQuery(this)
      query.order(column, direction)
      return query
    }

    public static where<T extends Dream>(this: { new (): T } & typeof Dream, attributes: Updateable<Table>) {
      const query: SelectQuery = new SelectQuery(this.prototype.constructor)
      query.where(attributes)
      return query
    }

    constructor(opts?: Updateable<Table>) {
      if (opts) this.setAttributes(opts)
    }

    public get isDreamInstance() {
      return true
    }

    public get attributes(): Updateable<Table> {
      const obj: Updateable<Table> = {}
      columns.forEach(column => {
        ;(obj as any)[column] = (this as any)[column]
      })
      return obj
    }

    public setAttributes(attributes: Updateable<Table>) {
      Object.keys(attributes).forEach(attr => {
        ;(this as any)[attr] = (attributes as any)[attr]
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

  class SelectQuery {
    public whereStatement: Updateable<Table> | null = null
    public limitStatement: { count: number } | null = null
    public orderStatement: { column: keyof Table & string; direction: 'asc' | 'desc' } | null = null
    public dreamClass: typeof Dream

    constructor(DreamClass: typeof Dream) {
      this.dreamClass = DreamClass
    }

    public where(attributes: Updateable<Table>) {
      this.whereStatement = attributes
      return this
    }

    public order<ColumnName extends keyof Table & string>(
      column: ColumnName,
      direction: 'asc' | 'desc' = 'asc'
    ) {
      this.orderStatement = { column, direction }
      return this
    }

    public limit(count: number) {
      this.limitStatement = { count }
      return this
    }

    public async all() {
      const query = this.build()
      const results = await query.execute()
      const DreamClass = Dream
      return results.map(r => new DreamClass(r as Updateable<Table>))
    }

    public async first() {
      if (!this.orderStatement) this.order(Dream.primaryKey as keyof Table & string, 'asc')

      const query = this.build()
      const results = await query.executeTakeFirstOrThrow()

      if ((results as any)[0]) return new this.dreamClass((results as any)[0])
      else return null
    }

    public async last() {
      if (!this.orderStatement) this.order(Dream.primaryKey, 'desc')

      const query = this.build()
      const results = await query.execute()

      const res = results.length ? (results as any)[results.length - 1] : null

      if (res) return new this.dreamClass(res) as any
      else return null
    }

    public build() {
      let query = db.selectFrom(tableName).selectAll()
      if (this.whereStatement) {
        Object.keys(this.whereStatement).forEach(attr => {
          query = query.where(attr as any, '=', (this.whereStatement as any)[attr])
        })
      }
      if (this.limitStatement) query = query.limit(this.limitStatement.count)
      if (this.orderStatement)
        query = query.orderBy(this.orderStatement.column as any, this.orderStatement.direction)

      return query
    }
  }

  return Dream
}

export type DreamModel<
  TableName extends keyof DB & string,
  IdColumnName extends keyof DB[TableName] & string
> = ReturnType<typeof dream<TableName, IdColumnName>>
