import { Tables } from './db/reflections'
import db from './db'
import { DB, DBColumns } from './sync/schema'
import { Selectable, SelectExpression, SelectQueryBuilder, SelectType, Updateable } from 'kysely'
import snakeify from './helpers/snakeify'
import pluralize = require('pluralize')
import { HasManyStatement } from './associations/has-many'
import { BelongsToStatement } from './associations/belongs-to'
import { HasOneStatement } from './associations/has-one'

export default function dream<
  TableName extends keyof DB & string,
  IdColumnName extends keyof DB[TableName] & string
>(tableName: TableName, primaryKey: IdColumnName = 'id' as IdColumnName) {
  const columns = DBColumns[tableName]

  type Table = DB[TableName]
  type IdColumn = Table[IdColumnName]
  type Data = Selectable<Table>
  type Id = Readonly<SelectType<IdColumn>>

  class Dream {
    public static primaryKey: IdColumnName = primaryKey
    public static createdAtField = 'createdAt'
    public static associations: {
      belongsTo: BelongsToStatement<any>[]
      hasMany: HasManyStatement<any>[]
      hasOne: HasOneStatement<any>[]
    } = {
      belongsTo: [],
      hasMany: [],
      hasOne: [],
    }

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

    public static async destroyAll<T extends Dream>(this: { new (): T } & typeof Dream) {
      const query: Query<T> = new Query<T>(this)
      return await query.destroy()
    }

    public static async destroyBy<T extends Dream>(
      this: { new (): T } & typeof Dream,
      opts?: Updateable<Table>
    ) {
      const query: Query<T> = new Query<T>(this)
      return await query.destroyBy(opts as any)
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
      const query: Query<T> = new Query<T>(this)
      query.limit(count)
      return query
    }

    public static order<T extends Dream, ColumnName extends keyof Table & string>(
      this: { new (): T } & typeof Dream,
      column: ColumnName,
      direction: 'asc' | 'desc' = 'asc'
    ) {
      const query: Query<T> = new Query<T>(this)
      query.order(column, direction)
      return query
    }

    public static where<T extends Dream>(this: { new (): T } & typeof Dream, attributes: Updateable<Table>) {
      const query: Query<T> = new Query<T>(this)
      query.where(attributes)
      return query
    }

    public frozenAttributes: Updateable<Table> = {}
    constructor(opts?: Updateable<Table>) {
      if (opts) {
        this.setAttributes(opts)

        // if id is set, then we freeze attributes after setting them, so that
        // any modifications afterwards will indicate updates.
        if (this.isPersisted) this.freezeAttributes()
      }
    }

    public hasId(attributes: Updateable<Table> = this.attributes) {
      return !!(attributes as any)[(this.constructor as typeof Dream).primaryKey]
    }

    public get isDreamInstance() {
      return true
    }

    public get isPersisted() {
      // todo: clean up types here
      return !!(this as any)[(this.constructor as typeof Dream).primaryKey as any]
    }

    public get attributes(): Updateable<Table> {
      const obj: Updateable<Table> = {}
      columns.forEach(column => {
        ;(obj as any)[column] = (this as any)[column]
      })
      return obj
    }

    public get isDirty() {
      return !!Object.keys(this.dirtyAttributes).length
    }

    public get dirtyAttributes(): Updateable<Table> {
      const obj: Updateable<Table> = {}
      Object.keys(this.attributes).forEach(column => {
        // TODO: clean up types
        if (
          (this.frozenAttributes as any)[column] === undefined ||
          (this.frozenAttributes as any)[column] !== (this.attributes as any)[column]
        )
          (obj as any)[column] = (this.attributes as any)[column]
      })
      return obj
    }

    public freezeAttributes() {
      this.frozenAttributes = { ...this.attributes }
    }

    public async load<T extends Dream>(this: T, association: string) {
      const [type, realAssociation] = this.associationMetadataFor(association)
      if (!type || !realAssociation) throw `Association not found: ${association}`

      const id = (this as any)[(this.constructor as typeof Dream).primaryKey]
      if (!id) throw `Cannot load association on unpersisted record`

      const ModelClass = realAssociation.modelCB()

      switch (type) {
        case 'hasOne':
          const hasOneAssociation = realAssociation as HasOneStatement<TableName>
          const hasOneResult = await db
            .selectFrom(hasOneAssociation.to)
            .where(hasOneAssociation.foreignKey() as any, '=', id)
            .selectAll()
            .executeTakeFirst()

          ;(this as any)[association] = new ModelClass(hasOneResult)
          break

        case 'hasMany':
          const hasManyAssociation = realAssociation as HasManyStatement<TableName>

          if (hasManyAssociation.through) {
            const hasManyQuery = db.selectFrom(Dream.table)
            const hasManyResults = await this.loadHasManyThrough(hasManyAssociation, hasManyQuery)
            ;(this as any)[association] = hasManyResults.map(r => new ModelClass(r))
          } else {
            const hasManyQuery = db.selectFrom(realAssociation.to)
            const hasManyResults = await hasManyQuery
              .where(realAssociation.foreignKey() as any, '=', id)
              .selectAll()
              .execute()
            ;(this as any)[association] = hasManyResults.map(r => new ModelClass(r))
          }
          break

        case 'belongsTo':
          const belongsToAssociation = realAssociation as BelongsToStatement<TableName>
          const foreignKey = (this as any)[belongsToAssociation.foreignKey()]
          const belongsToResult = await db
            .selectFrom(realAssociation.to)
            .where(ModelClass.primaryKey as any, '=', foreignKey)
            .selectAll()
            .executeTakeFirst()

          ;(this as any)[association] = new ModelClass(belongsToResult)
          break
      }

      return (this as any)[association] as typeof ModelClass | null
    }

    async loadHasManyThrough(
      association: HasManyStatement<TableName>,
      query: SelectQueryBuilder<DB, TableName, {}>
    ) {
      if (!association.through)
        throw `
        Should not be loading has many through, since this association does not have a through attribute.
        Attributes provided were:
          ${JSON.stringify(association)}
      `

      const [type, throughAssociationMetadata] = this.associationMetadataFor(association.through().table)
      if (!throughAssociationMetadata)
        throw `
        Unable to find association metadata for:
          ${JSON.stringify(throughAssociationMetadata)}
      `

      const FinalModelClass = association.modelCB()
      const ThroughModelClass = throughAssociationMetadata.modelCB()
      const ThisModelClass = this.constructor as typeof Dream
      query = query.innerJoin(
        throughAssociationMetadata.to,
        // @ts-ignore
        `${throughAssociationMetadata.to}.${throughAssociationMetadata.foreignKey()}`,
        `${Dream.table}.${Dream.primaryKey}`
        // (this as any)[ThisModelClass.primaryKey]
      )

      query = query.innerJoin(
        association.to,
        // @ts-ignore
        `${association.to}.${association.foreignKey()}`,
        `${ThroughModelClass.table}.${ThroughModelClass.primaryKey}`
        // (this as any)[ThisModelClass.primaryKey]
      )

      const select = DBColumns[association.to].map(
        column => `${FinalModelClass.table}.${column} as ${column}`
      )
      query = query
        // @ts-ignore
        .where(`${Dream.table}.${Dream.primaryKey}`, '=', (this as any)[ThisModelClass.primaryKey])
        .select(select as any)

      return await query.execute()
    }

    public associationMetadataFor<T extends Dream>(
      this: T,
      association: string
    ): [
      'hasOne' | 'hasMany' | 'belongsTo' | null,
      HasOneStatement<any> | HasManyStatement<any> | BelongsToStatement<any> | null
    ] {
      const hasOneMatch = (this.constructor as typeof Dream).associations.hasOne.find(
        d => d.as === association
      )
      if (hasOneMatch) return ['hasOne', hasOneMatch]

      const hasManyMatch = (this.constructor as typeof Dream).associations.hasMany.find(
        d => d.as === association
      )
      if (hasManyMatch) return ['hasMany', hasManyMatch]

      const belongsToMatch = (this.constructor as typeof Dream).associations.belongsTo.find(
        d => d.as === association
      )
      if (belongsToMatch) return ['belongsTo', belongsToMatch]

      return [null, null]
    }

    public async reload() {
      const base = this.constructor as typeof Dream

      // TODO: cleanup type chaos
      // @ts-ignore
      const newRecord = (await base.find(this[base.primaryKey as any] as unknown as Id)) as T
      this.setAttributes(newRecord.attributes)
      this.freezeAttributes()

      return this
    }

    public setAttributes(attributes: Updateable<Table>) {
      Object.keys(attributes).forEach(attr => {
        // TODO: cleanup type chaos
        ;(this as any)[attr] = (attributes as any)[attr]
      })
    }

    public async save<T extends Dream>(this: T): Promise<T> {
      if (this.isPersisted) return await this.update()

      let query = db.insertInto(tableName)
      if (Object.keys(this.dirtyAttributes).length) {
        query = query.values(this.dirtyAttributes as any)
      } else {
        query = query.values({ id: 0 } as any)
      }

      const data = await query.returning(columns as any).executeTakeFirstOrThrow()
      const base = this.constructor as typeof Dream

      // sets the id before reloading, since this is a new record
      // TODO: cleanup type chaos
      ;(this as any)[base.primaryKey as any] = data[base.primaryKey]

      return await this.reload()
    }

    public async update<T extends Dream>(this: T, attributes?: Updateable<Table>): Promise<T> {
      let query = db.updateTable(tableName)
      if (attributes) this.setAttributes(attributes)

      if (Object.keys(this.dirtyAttributes).length === 0) return this
      query = query.set(this.dirtyAttributes as any)

      const data = await query.returning(columns as any).executeTakeFirstOrThrow()
      const base = this.constructor as typeof Dream

      await this.reload()
      return this
    }
  }

  class Query<DreamClass extends Dream> {
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
      const query = this.buildSelect()
      const results = await query.execute()
      const DreamClass = Dream
      return results.map(r => new DreamClass(r as Updateable<Table>) as DreamClass)
    }

    public async first() {
      if (!this.orderStatement) this.order(Dream.primaryKey as keyof Table & string, 'asc')

      const query = this.buildSelect()
      const results = await query.executeTakeFirstOrThrow()

      if (results) return new this.dreamClass(results as any) as DreamClass
      else return null
    }

    public async last() {
      if (!this.orderStatement) this.order(Dream.primaryKey, 'desc')

      const query = this.buildSelect()
      const results = await query.execute()

      const res = results.length ? (results as any)[results.length - 1] : null

      if (res) return new Dream(res) as DreamClass
      else return null
    }

    public async destroy() {
      const query = this.buildDestroy()
      const selectQuery = this.buildSelect()
      const results = await selectQuery.execute()
      await query.execute()
      return results.length
    }

    public async destroyBy(attributes: Updateable<Table>) {
      this.where(attributes)
      const query = this.buildDestroy()
      const selectQuery = this.buildSelect()
      const results = await selectQuery.execute()
      await query.execute()
      return results.length
    }

    public async update(attributes: Updateable<Table>) {
      const query = this.buildUpdate(attributes)
      await query.execute()

      const selectQuery = this.buildSelect()
      const results = await selectQuery.execute()

      const DreamClass = Dream
      return results.map(r => new DreamClass(r as any) as DreamClass)
    }

    // private

    public buildDestroy() {
      let query = db.deleteFrom(tableName as TableName)
      if (this.whereStatement) {
        Object.keys(this.whereStatement).forEach(attr => {
          query = query.where(attr as any, '=', (this.whereStatement as any)[attr])
        })
      }
      return query
    }

    public buildSelect() {
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

    public buildUpdate(attributes: Updateable<Table>) {
      let query = db.updateTable(this.dreamClass.table).set(attributes as any)
      if (this.whereStatement) {
        Object.keys(this.whereStatement).forEach(attr => {
          query = query.where(attr as any, '=', (this.whereStatement as any)[attr])
        })
      }
      return query
    }
  }

  return Dream
}

export type DreamModel<
  TableName extends keyof DB & string,
  IdColumnName extends keyof DB[TableName] & string
> = ReturnType<typeof dream<TableName, IdColumnName>>
