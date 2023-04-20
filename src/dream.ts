import db from './db'
import { DB, DBColumns } from './sync/schema'
import {
  CompiledQuery,
  Selectable,
  SelectArg,
  SelectExpression,
  Selection,
  SelectQueryBuilder,
  SelectType,
  Updateable,
} from 'kysely'
import { DateTime } from 'luxon'
import { HasManyStatement } from './decorators/associations/has-many'
import { BelongsToStatement } from './decorators/associations/belongs-to'
import { HasOneStatement } from './decorators/associations/has-one'
import { ScopeStatement } from './decorators/scope'
import { HookStatement } from './decorators/hooks/shared'
import ValidationStatement, { ValidationType } from './decorators/validations/shared'
import { ExtractTableAlias } from 'kysely/dist/cjs/parser/table-parser'
import { marshalDBValue } from './helpers/marshalDBValue'
import sqlAttributes from './helpers/sqlAttributes'
import { Range } from './helpers/range'
import ValidationError from './exceptions/validation-error'
import InStatement from './ops/in'
import LikeStatement from './ops/like'
import ILikeStatement from './ops/ilike'
import { OpsStatement } from './ops'
import { SyncedAssociations } from './sync/associations'
import { Inc } from './helpers/typeutils'
import { WhereStatement } from './decorators/associations/shared'

export default function dream<
  TableName extends keyof DB & keyof SyncedAssociations,
  IdColumnName extends keyof DB[TableName] & string,
  QueryAssociationExpression extends AssociationExpression<
    TableName & keyof DB & keyof SyncedAssociations,
    any
  > = AssociationExpression<TableName & keyof DB & keyof SyncedAssociations, any>
>(tableName: TableName, primaryKey: IdColumnName = 'id' as IdColumnName) {
  const columns = DBColumns[tableName]
  const tableNames = Object.keys(DBColumns)

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
    public static scopes: {
      default: ScopeStatement[]
      named: ScopeStatement[]
    } = {
      default: [],
      named: [],
    }
    public static sti: {
      column: string | null
      value: string | null
    } = {
      column: null,
      value: null,
    }
    public static hooks: {
      beforeCreate: HookStatement[]
      beforeUpdate: HookStatement[]
      beforeSave: HookStatement[]
      beforeDestroy: HookStatement[]
      afterCreate: HookStatement[]
      afterUpdate: HookStatement[]
      afterSave: HookStatement[]
      afterDestroy: HookStatement[]
    } = {
      beforeCreate: [],
      beforeUpdate: [],
      beforeSave: [],
      beforeDestroy: [],
      afterCreate: [],
      afterUpdate: [],
      afterSave: [],
      afterDestroy: [],
    }
    public static validations: ValidationStatement[] = []

    public static get isDream() {
      return true
    }

    public static get table(): TableName {
      return tableName as TableName
    }

    public static get columns(): string[] {
      return columns
    }

    public static get associationMap() {
      const allAssociations = [
        ...this.associations.belongsTo,
        ...this.associations.hasOne,
        ...this.associations.hasMany,
      ]

      const map = {} as {
        [key: typeof allAssociations[number]['as']]:
          | BelongsToStatement<any>
          | HasManyStatement<any>
          | HasOneStatement<any>
      }

      for (const association of allAssociations) {
        map[association.as] = association
      }

      return map
    }

    public static async all<T extends Dream>(this: { new (): T } & typeof Dream): Promise<T[]> {
      const query: Query<T> = new Query<T>(this)
      return await query.all()
    }

    public static async count<T extends Dream>(this: { new (): T } & typeof Dream): Promise<number> {
      const query: Query<T> = new Query<T>(this)
      return await query.count()
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

    public static async find<T extends Dream>(this: { new (): T } & typeof Dream, id: Id): Promise<T | null> {
      const query: Query<T> = new Query<T>(this)
      return await query.where({ [Dream.primaryKey]: id } as any).first()
    }

    public static async findBy<T extends Dream>(
      this: { new (): T } & typeof Dream,
      attributes: Updateable<Table>
    ): Promise<T | null> {
      const query: Query<T> = new Query<T>(this)
      return await query.where(attributes).first()
    }

    public static async first<T extends Dream>(this: { new (): T } & typeof Dream): Promise<T | null> {
      const query: Query<T> = new Query<T>(this)
      return await query.first()
    }

    public static includes<T extends Dream>(
      this: { new (): T } & typeof Dream,
      ...associations: QueryAssociationExpression[]
    ) {
      const query: Query<T> = new Query<T>(this)
      return query.includes(...associations)
    }

    public static async last<T extends Dream>(this: { new (): T } & typeof Dream): Promise<T | null> {
      const query: Query<T> = new Query<T>(this)
      return await query.last()
    }

    public static limit<T extends Dream>(this: { new (): T } & typeof Dream, count: number) {
      let query: Query<T> = new Query<T>(this)
      query = query.limit(count)
      return query
    }

    public static order<T extends Dream, ColumnName extends keyof Table & string>(
      this: { new (): T } & typeof Dream,
      column: ColumnName,
      direction: 'asc' | 'desc' = 'asc'
    ) {
      let query: Query<T> = new Query<T>(this)
      query = query.order(column, direction)
      return query
    }

    public static async pluck<
      T extends Dream,
      SE extends SelectExpression<DB, ExtractTableAlias<DB, TableName>>
    >(this: { new (): T } & typeof Dream, ...fields: SelectArg<DB, ExtractTableAlias<DB, TableName>, SE>[]) {
      let query: Query<T> = new Query<T>(this)
      return await query.pluck(...fields)
    }

    public static nestedSelect<
      T extends Dream,
      SE extends SelectExpression<DB, ExtractTableAlias<DB, TableName>>
    >(this: { new (): T } & typeof Dream, selection: SelectArg<DB, ExtractTableAlias<DB, TableName>, SE>) {
      let query: Query<T> = new Query<T>(this)
      return query.nestedSelect(selection)
    }

    public static scope<T extends Dream>(this: { new (): T } & typeof Dream, scopeName: string) {
      let query: Query<T> = new Query<T>(this)
      query = (this as any)[scopeName](query) as Query<T>
      return query
    }

    public static sql<T extends Dream>(this: { new (): T } & typeof Dream): CompiledQuery<{}> {
      const query: Query<T> = new Query<T>(this)
      return query.sql()
    }

    public static where<T extends Dream>(
      this: { new (): T } & typeof Dream,
      attributes: WhereStatement<TableName>
    ) {
      const query: Query<T> = new Query<T>(this)
      // @ts-ignore
      query.where(attributes)
      return query
    }

    public errors: { [key: string]: ValidationType[] } = {}
    public frozenAttributes: Updateable<Table> = {}
    constructor(opts?: Updateable<Table>) {
      if (opts) {
        this.setAttributes(opts)

        // if id is set, then we freeze attributes after setting them, so that
        // any modifications afterwards will indicate updates.
        if (this.isPersisted) this.freezeAttributes()
      }
    }

    public get primaryKey() {
      return (this.constructor as typeof Dream).primaryKey
    }

    public get primaryKeyValue(): string | number | null {
      return (this as any)[this.primaryKey] || null
    }

    public get isDirty() {
      return !!Object.keys(this.dirtyAttributes).length
    }

    public get isDreamInstance() {
      return true
    }

    public get isPersisted() {
      // todo: clean up types here
      return !!(this as any)[this.primaryKey]
    }

    public get isValid(): boolean {
      const validationErrors = checkValidationsFor(this)
      return !Object.keys(validationErrors).filter(key => !!validationErrors[key].length).length
    }

    public get isInvalid(): boolean {
      return !this.isValid
    }

    public get attributes(): Updateable<Table> {
      const obj: Updateable<Table> = {}
      columns.forEach(column => {
        ;(obj as any)[column] = (this as any)[column]
      })
      return obj
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

    public get associationMap() {
      return (this.constructor as typeof Dream).associationMap
    }

    public get associations() {
      return (this.constructor as typeof Dream).associations
    }

    public get associationNames() {
      const allAssociations = [
        ...this.associations.belongsTo,
        ...this.associations.hasOne,
        ...this.associations.hasMany,
      ]
      return allAssociations.map(association => {
        return association.as
      })
    }

    public get table(): TableName {
      return (this.constructor as typeof Dream).table as TableName
    }

    public async load<T extends Dream>(
      this: T,
      ...associations: QueryAssociationExpression[]
    ): Promise<void> {
      const query: Query<T> = new Query<T>(this.constructor as typeof Dream)
      for (const association of associations) await query.applyIncludes(association, [this])
    }

    public async reload<T extends Dream>(this: T) {
      const base = this.constructor as typeof Dream

      const query: Query<T> = new Query<T>(base)
      query
        .bypassDefaultScopes()
        // @ts-ignore
        .where({ [base.primaryKey as any]: this[base.primaryKey] } as Updateable<Table>)

      // TODO: cleanup type chaos
      // @ts-ignore
      const newRecord = (await query.first()) as T
      this.setAttributes(newRecord.attributes)
      this.freezeAttributes()

      return this
    }

    public setAttributes(attributes: Updateable<Table>) {
      Object.keys(attributes).forEach(attr => {
        // TODO: cleanup type chaos
        ;(this as any)[attr] = marshalDBValue((attributes as any)[attr])
      })
    }

    public async save<T extends Dream>(this: T): Promise<T> {
      if (this.isPersisted) return await this.update()

      await runHooksFor('beforeSave', this)
      await runHooksFor('beforeCreate', this)

      const sqlifiedAttributes = sqlAttributes(this.dirtyAttributes)

      let query = db.insertInto(tableName)
      if (Object.keys(sqlifiedAttributes).length) {
        query = query.values(sqlifiedAttributes as any)
      } else {
        query = query.values({ id: 0 } as any)
      }

      await runValidationsFor(this)
      if (this.isInvalid) throw new ValidationError(this.constructor.name, this.errors)

      const data = await query.returning(columns as any).executeTakeFirstOrThrow()
      const base = this.constructor as typeof Dream

      // sets the id before reloading, since this is a new record
      // TODO: cleanup type chaos
      ;(this as any)[base.primaryKey as any] = data[base.primaryKey]

      await this.reload()

      await runHooksFor('afterSave', this)
      await runHooksFor('afterCreate', this)

      return this
    }

    public async update<T extends Dream>(this: T, attributes?: Updateable<Table>): Promise<T> {
      await runHooksFor('beforeSave', this)
      await runHooksFor('beforeUpdate', this)

      let query = db.updateTable(tableName)
      if (attributes) this.setAttributes(attributes)
      const sqlifiedAttributes = sqlAttributes(this.dirtyAttributes)

      if (Object.keys(sqlifiedAttributes).length === 0) return this
      query = query.set(sqlifiedAttributes as any)

      await runValidationsFor(this)

      await query.executeTakeFirstOrThrow()

      await this.reload()

      await runHooksFor('afterSave', this)
      await runHooksFor('afterUpdate', this)

      return this
    }

    public async destroy<T extends Dream>(this: T): Promise<T> {
      await runHooksFor('beforeDestroy', this)

      const base = this.constructor as typeof Dream
      await db
        .deleteFrom(tableName)
        .where(base.primaryKey as any, '=', (this as any)[base.primaryKey])
        .execute()

      await runHooksFor('afterDestroy', this)
      return this
    }
  }

  class Query<DreamClass extends Dream> {
    public whereStatement: WhereStatement<TableName> | null = null
    public whereJoinStatement:
      | JoinsWhereAssociationExpression<TableName, AssociationExpression<TableName, any>>[]
      | null = null
    public limitStatement: { count: number } | null = null
    public orStatements: Query<DreamClass>[] = []
    public orderStatement: { column: keyof Table & string; direction: 'asc' | 'desc' } | null = null
    public selectStatement: SelectArg<DB, TableName, SelectExpression<DB, TableName>> | null = null
    public includesStatements: QueryAssociationExpression[] = []
    public joinsStatements: QueryAssociationExpression[] = []
    public shouldBypassDefaultScopes: boolean = false
    public dreamClass: typeof Dream

    constructor(DreamClass: typeof Dream) {
      this.dreamClass = DreamClass
    }

    public bypassDefaultScopes() {
      this.shouldBypassDefaultScopes = true
      return this
    }

    public includes(...args: QueryAssociationExpression[]) {
      this.includesStatements = [...this.includesStatements, ...args]
      return this
    }

    public or(orStatement: Query<DreamClass>) {
      this.orStatements = [...this.orStatements, orStatement]
      return this
    }

    public joins(...args: QueryAssociationExpression[]) {
      this.joinsStatements = [...this.joinsStatements, ...args]
      return this
    }

    public where<T extends Query<DreamClass>>(
      this: T,
      attributes:
        | WhereStatement<TableName>
        | JoinsWhereAssociationExpression<
            TableName & keyof DB & keyof SyncedAssociations,
            T['joinsStatements'][number]
          >
    ) {
      if (attributes.constructor === Array) {
        // @ts-ignore
        this.whereJoinStatement ||= []
        // @ts-ignore
        this.whereJoinStatement = [...this.whereJoinStatement, ...attributes]
      } else {
        Object.keys(attributes).forEach(key => {
          if (columns.includes(key)) {
            this.whereStatement ||= {}
            // @ts-ignore
            this.whereStatement[key] = attributes[key]
          } else {
            // @ts-ignore
            this.whereJoinStatement ||= []
            // @ts-ignore
            this.whereJoinStatement.push({ [key]: attributes[key] })
          }
        })
      }

      return this
    }

    public nestedSelect<SE extends SelectExpression<DB, ExtractTableAlias<DB, TableName>>>(
      selection: SelectArg<DB, ExtractTableAlias<DB, TableName>, SE>
    ) {
      const query = this.buildSelect({ bypassSelectAll: true })
      return query.select(selection)
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

    public sql() {
      const query = this.buildSelect()
      return query.compile()
    }

    public toKysely(type: 'select' | 'update' | 'delete' = 'select') {
      switch (type) {
        case 'select':
          return this.buildSelect()

        case 'delete':
          return this.buildDelete()

        case 'update':
          return this.buildUpdate({})
      }
    }

    public async count() {
      const { count } = db.fn
      let query = this.buildSelect({ bypassSelectAll: true })

      query = query.select(count(`${Dream.table}.${Dream.primaryKey}` as any).as('tablecount'))
      const data = (await query.executeTakeFirstOrThrow()) as any

      return parseInt(data.tablecount.toString())
    }

    public async pluck<SE extends SelectExpression<DB, ExtractTableAlias<DB, TableName>>>(
      ...fields: SelectArg<DB, ExtractTableAlias<DB, TableName>, SE>[]
    ) {
      let query = this.buildSelect({ bypassSelectAll: true })
      fields.forEach(field => {
        query = query.select(field)
      })

      const vals = (await query.execute()).map(result => Object.values(result))

      if (fields.length > 1) {
        return vals.map(arr => arr.map(val => marshalDBValue(val)))
      } else {
        return vals.flat().map(val => marshalDBValue(val))
      }
    }

    public async all() {
      const query = this.buildSelect()
      let results: any[]
      try {
        results = await query.execute()
      } catch (error) {
        throw `
          Error executing SQL:
          ${error}

          SQL:
          ${query.compile().sql}
          [ ${query.compile().parameters.join(', ')} ]
        `
      }

      const theAll = results.map(r => new this.dreamClass(r as Updateable<Table>) as DreamClass)
      await this.applyThisDotIncludes(theAll)
      return theAll
    }

    public async first() {
      if (!this.orderStatement) this.order(Dream.primaryKey as keyof Table & string, 'asc')

      const query = this.buildSelect()
      const results = await query.executeTakeFirst()

      if (results) {
        const theFirst = new this.dreamClass(results as any) as DreamClass
        await this.applyThisDotIncludes([theFirst])
        return theFirst
      } else return null
    }

    public async applyThisDotIncludes(dreams: DreamClass[]) {
      for (const includesStatement of this.includesStatements) {
        await this.applyIncludes(includesStatement, dreams)
      }
    }

    public hydrateAssociation(
      dreams: Dream[],
      association: HasManyStatement<any> | HasOneStatement<any> | BelongsToStatement<any>,
      loadedAssociations: Dream[]
    ) {
      for (const loadedAssociation of loadedAssociations) {
        if (association.type === 'BelongsTo') {
          dreams
            .filter(dream => (dream as any)[association.foreignKey()] === loadedAssociation.primaryKeyValue)
            .forEach(dream => {
              ;(dream as any)[association.as] = loadedAssociation
              // TODO
              // if (association.reverseAsType === 'HasOne') {
              //   ;(loadedAssociation as any)[association.reverseAs] = dream
              // } else {
              //   ;(loadedAssociation as any)[association.reverseAs] ||= []
              //   ;(loadedAssociation as any)[association.reverseAs].push(dream)
              // }
            })
        } else {
          dreams
            .filter(dream => (loadedAssociation as any)[association.foreignKey()] === dream.primaryKeyValue)
            .forEach(dream => {
              if (association.type === 'HasOne') {
                ;(dream as any)[association.as] ||= loadedAssociation
              } else {
                ;(dream as any)[association.as] ||= []
                ;(dream as any)[association.as].push(loadedAssociation)
              }
            })
        }
      }
    }

    public async includesBridgeThroughAssociations(
      dreams: Dream[],
      association: HasOneStatement<any> | HasManyStatement<any> | BelongsToStatement<any>
    ): Promise<{
      dreams: Dream[]
      association: HasOneStatement<any> | HasManyStatement<any> | BelongsToStatement<any>
    }> {
      if (association.type === 'BelongsTo' || !association.through) {
        return { dreams, association }
      } else {
        // Post has many Commenters through Comments
        // hydrate Post Comments
        await this.applyOneInclude(association.through, dreams)

        dreams.forEach(dream => {
          if (association.type === 'HasOne') {
            Object.defineProperty(dream, association.as, {
              get() {
                return (dream as any)[association.through!]![association.as]
              },
            })
          } else {
            Object.defineProperty(dream, association.as, {
              get() {
                return ((dream as any)[association.through!] as any[]).flatMap(
                  record => (record as any)![association.as]
                )
              },
            })
          }
        })

        // return:
        //  Comments,
        //  the Comments -> CommentAuthors hasMany association
        // So that Comments may be properly hydrated with many CommentAuthors
        const newDreams = (dreams as any[]).flatMap(dream => dream[association.through!])
        const newAssociation = association.throughClass!().associationMap[association.as]
        return await this.includesBridgeThroughAssociations(newDreams, newAssociation)
      }
    }

    public async applyOneInclude(currentAssociationTableOrAlias: string, dreams: Dream | Dream[]) {
      if (dreams.constructor !== Array) dreams = [dreams as Dream]

      const dream = dreams[0]
      if (!dream) return

      let association = dream.associationMap[currentAssociationTableOrAlias]
      let associationQuery

      const results = await this.includesBridgeThroughAssociations(dreams, association)
      dreams = results.dreams
      association = results.association

      if (association.type === 'BelongsTo') {
        associationQuery = association.modelCB().where({
          [association.modelCB().primaryKey]: dreams.map(dream => (dream as any)[association.foreignKey()]),
        })
      } else {
        associationQuery = association.modelCB().where({
          [association.foreignKey()]: dreams.map(dream => dream.primaryKeyValue),
        })

        if (association.where) associationQuery = associationQuery.where(association.where)
      }

      this.hydrateAssociation(dreams, association, await associationQuery.all())

      return dreams.flatMap(dream => (dream as any)[association.as])
    }

    public async applyIncludes(includesStatement: QueryAssociationExpression, dream: Dream | Dream[]) {
      switch (includesStatement.constructor) {
        case String:
          await this.applyOneInclude(includesStatement as string, dream)
          break
        case Array:
          for (const str of includesStatement as QueryAssociationExpression[]) {
            await this.applyIncludes(str, dream)
          }
          break
        default:
          for (const key of Object.keys(includesStatement)) {
            const nestedDream = await this.applyOneInclude(key, dream)
            if (nestedDream) {
              await this.applyIncludes((includesStatement as any)[key], nestedDream)
            }
          }
      }
    }

    public async last() {
      if (!this.orderStatement) this.order(Dream.primaryKey, 'desc')

      const query = this.buildSelect()
      const results = await query.executeTakeFirst()

      if (results) {
        const theLast = new Dream(results) as DreamClass
        await this.applyThisDotIncludes([theLast])
        return theLast
      } else return null
    }

    public async destroy() {
      const query = this.buildDelete()
      const selectQuery = this.buildSelect()
      const results = await selectQuery.execute()
      await query.execute()
      return results.length
    }

    public async destroyBy(attributes: Updateable<Table>) {
      this.where(attributes)
      const query = this.buildDelete()
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

    public conditionallyApplyScopes() {
      if (this.shouldBypassDefaultScopes) return

      const thisScopes = this.dreamClass.scopes.default.filter(s => s.className === this.dreamClass.name)
      for (const scope of thisScopes) {
        ;(this.dreamClass as any)[scope.method](this)
      }
    }

    public buildDelete() {
      let query = db.deleteFrom(tableName as TableName)
      if (this.whereStatement) {
        Object.keys(this.whereStatement).forEach(attr => {
          query = query.where(attr as any, '=', (this.whereStatement as any)[attr])
        })
      }
      return query
    }

    public joinsBridgeThroughAssociations({
      query,
      dreamClass,
      association,
      previousAssociationTableOrAlias,
    }: {
      query: SelectQueryBuilder<DB, ExtractTableAlias<DB, TableName>, {}>
      dreamClass: DreamModel<any, any>
      association: HasOneStatement<any> | HasManyStatement<any> | BelongsToStatement<any>
      previousAssociationTableOrAlias: string
    }): {
      query: SelectQueryBuilder<DB, ExtractTableAlias<DB, TableName>, {}>
      dreamClass: DreamModel<any, any>
      association: HasOneStatement<any> | HasManyStatement<any> | BelongsToStatement<any>
      previousAssociationTableOrAlias: string
    } {
      if (association.type === 'BelongsTo' || !association.through) {
        return {
          query,
          dreamClass,
          association,
          previousAssociationTableOrAlias,
        }
      } else {
        // Post has many Commenters through Comments
        //  Comments,
        //  the Comments -> CommentAuthors hasMany association
        // dreamClass is Post
        // newDreamClass is Comment
        const results = this.applyOneJoin({
          query,
          dreamClass,
          previousAssociationTableOrAlias,
          currentAssociationTableOrAlias: association.through,
        })

        return this.joinsBridgeThroughAssociations({
          query: results.query,
          dreamClass: association.modelCB(),
          association: association.throughClass!().associationMap[association.as],
          previousAssociationTableOrAlias: association.through,
        })
      }
    }

    public applyOneJoin({
      query,
      dreamClass,
      previousAssociationTableOrAlias,
      currentAssociationTableOrAlias,
    }: {
      query: SelectQueryBuilder<DB, ExtractTableAlias<DB, TableName>, {}>
      dreamClass: DreamModel<any, any>
      previousAssociationTableOrAlias: string
      currentAssociationTableOrAlias: string
    }): {
      query: SelectQueryBuilder<DB, ExtractTableAlias<DB, TableName>, {}>
      association: any
      previousAssociationTableOrAlias: string
      currentAssociationTableOrAlias: string
    } {
      // Given:
      // dreamClass: Post
      // previousAssociationTableOrAlias: posts
      // currentAssociationTableOrAlias: commenters
      // Post has many Commenters through Comments
      // whereJoinStatement: { commenters: { id: <some commenter id> } }
      // association = Post.associationMap[commenters]
      // which gives association = {
      //   through: 'comments',
      //   throughClass: () => Comment,
      //   as: 'commenters',
      //   modelCB: () => Commenter,
      // }
      //
      // We want joinsBridgeThroughAssociations to add to the query:
      // INNER JOINS comments ON posts.id = comments.post_id
      // and update dreamClass to be

      let association = dreamClass.associationMap[currentAssociationTableOrAlias]

      const results = this.joinsBridgeThroughAssociations({
        query,
        dreamClass,
        association,
        previousAssociationTableOrAlias,
      })
      query = results.query
      dreamClass = results.dreamClass
      association = results.association
      previousAssociationTableOrAlias = results.previousAssociationTableOrAlias

      const joinTableExpression =
        currentAssociationTableOrAlias === association.to
          ? currentAssociationTableOrAlias
          : `${association.to} as ${currentAssociationTableOrAlias as string}`

      if (association.type === 'BelongsTo') {
        // @ts-ignore
        query = query.innerJoin(
          // @ts-ignore
          joinTableExpression,
          `${previousAssociationTableOrAlias}.${association.foreignKey()}`,
          `${currentAssociationTableOrAlias as string}.${association.modelCB().primaryKey}`
        )
      } else {
        // @ts-ignore
        query = query.innerJoin(
          // @ts-ignore
          joinTableExpression,
          `${previousAssociationTableOrAlias}.${association.modelCB().primaryKey}`,
          `${currentAssociationTableOrAlias as string}.${association.foreignKey()}`
        )

        if (association.where)
          query = this.applyWhereStatement(query, association.where as WhereStatement<TableName>)
      }

      return {
        query,
        association,
        previousAssociationTableOrAlias,
        currentAssociationTableOrAlias,
      }
    }

    public recursivelyJoin<
      PreviousTableName extends keyof DB & keyof SyncedAssociations,
      CurrentTableName extends keyof DB & keyof SyncedAssociations
    >({
      query,
      whereJoinStatement,
      dreamClass,
      previousAssociationTableOrAlias,
    }: {
      query: SelectQueryBuilder<DB, ExtractTableAlias<DB, TableName>, {}>
      whereJoinStatement:
        | JoinsWhereAssociationExpression<PreviousTableName, AssociationExpression<PreviousTableName, any>>
        | Updateable<DB[PreviousTableName]>
      dreamClass: DreamModel<any, any>
      previousAssociationTableOrAlias: string
    }): AliasCondition<PreviousTableName> | SelectQueryBuilder<DB, ExtractTableAlias<DB, TableName>, {}> {
      for (const key of Object.keys(whereJoinStatement) as (
        | keyof SyncedAssociations[PreviousTableName]
        | keyof Updateable<DB[PreviousTableName]>
      )[]) {
        const columnValue = (whereJoinStatement as Updateable<DB[PreviousTableName]>)[
          key as keyof Updateable<DB[PreviousTableName]>
        ]

        if (columnValue!.constructor !== Object) {
          return {
            conditionToExecute: true,
            alias: previousAssociationTableOrAlias,
            column: key,
            columnValue: columnValue,
          } as AliasCondition<PreviousTableName>
        } else {
          let currentAssociationTableOrAlias = key as
            | (keyof SyncedAssociations[PreviousTableName] & string)
            | string

          const results = this.applyOneJoin({
            query,
            dreamClass,
            previousAssociationTableOrAlias,
            currentAssociationTableOrAlias:
              currentAssociationTableOrAlias as keyof SyncedAssociations[PreviousTableName] & string,
          })

          query = results.query
          const association = results.association

          const result = this.recursivelyJoin<any, any>({
            query,
            // @ts-ignore
            whereJoinStatement: whereJoinStatement[currentAssociationTableOrAlias],
            dreamClass: association.modelCB(),
            previousAssociationTableOrAlias: currentAssociationTableOrAlias,
          })

          if ((result as any).conditionToExecute) {
            // @ts-ignore
            query = query.where(`${result.alias}.${result.column}`, '=', result.columnValue)
          } else {
            // @ts-ignore
            query = result
          }
        }
      }

      return query
    }

    public applyWhereStatement<T extends Query<DreamClass>>(
      this: T,
      query: SelectQueryBuilder<DB, ExtractTableAlias<DB, TableName>, {}>,
      whereStatement:
        | WhereStatement<TableName>
        | JoinsWhereAssociationExpression<
            TableName & keyof DB & keyof SyncedAssociations,
            T['joinsStatements'][number]
          >
    ) {
      Object.keys(whereStatement).forEach(attr => {
        const val = (whereStatement as any)[attr]

        if (val === null) {
          query = query.where(attr as any, 'is', val)
        } else if (val.constructor === SelectQueryBuilder) {
          query = query.where(attr as any, 'in', val)
        } else if (val.constructor === Array) {
          query = query.where(attr as any, 'in', val)
        } else if (val.constructor === InStatement) {
          query = query.where(attr as any, 'in', val.in)
        } else if (val.constructor === LikeStatement) {
          query = query.where(attr as any, 'like', val.like)
        } else if (val.constructor === ILikeStatement) {
          query = query.where(attr as any, 'ilike', val.ilike)
        } else if (
          val.constructor === Range &&
          (val.begin?.constructor || val.end?.constructor) === DateTime
        ) {
          const begin = val.begin?.toUTC()?.toSQL()
          const end = val.end?.toUTC()?.toSQL()
          const excludeEnd = val.excludeEnd

          if (begin && end) {
            query = query.where(attr as any, '>=', begin).where(attr as any, excludeEnd ? '<' : '<=', end)
          } else if (begin) {
            query = query.where(attr as any, '>=', begin)
          } else {
            query = query.where(attr as any, excludeEnd ? '<' : '<=', end)
          }
        } else {
          query = query.where(attr as any, '=', val)
        }
      })

      return query
    }

    public buildSelect({ bypassSelectAll = false }: { bypassSelectAll?: boolean } = {}) {
      this.conditionallyApplyScopes()

      let query = db.selectFrom(tableName)
      if (!bypassSelectAll) query = query.selectAll(tableName as any)

      if (this.selectStatement) {
        query = query.select(this.selectStatement as any)
      }

      this.orStatements.forEach(orStatement => {
        query = query.union(orStatement.toKysely() as any)
      })

      if (this.whereStatement) {
        query = this.applyWhereStatement(query, this.whereStatement)
      }

      if (this.whereJoinStatement) {
        this.whereJoinStatement.forEach(whereJoinStatement => {
          // @ts-ignore
          query = this.recursivelyJoin<any, any>({
            query,
            // @ts-ignore
            whereJoinStatement,
            // @ts-ignore
            dreamClass: this.dreamClass,
            previousAssociationTableOrAlias: this.dreamClass.table,
          })
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

  // internal
  function ensureSTITypeFieldIsSet<T extends Dream>(dream: T) {
    // todo: turn STI logic here into before create applied by decorator
    const Base = dream.constructor as typeof Dream
    if (Base.sti.value && Base.sti.column) {
      ;(dream as any)[Base.sti.column] = Base.sti.value
    }
  }

  async function runHooksFor<T extends Dream>(
    key:
      | 'beforeCreate'
      | 'beforeSave'
      | 'beforeUpdate'
      | 'beforeDestroy'
      | 'afterCreate'
      | 'afterSave'
      | 'afterUpdate'
      | 'afterDestroy',
    dream: T
  ): Promise<void> {
    if (['beforeCreate', 'beforeSave', 'beforeUpdate'].includes(key)) {
      ensureSTITypeFieldIsSet(dream)
    }

    const Base = dream.constructor as typeof Dream
    for (const statement of Base.hooks[key]) {
      try {
        await (dream as any)[statement.method]()
      } catch (error) {
        throw `
          Error running ${key} on ${Base.name}
          ${error}
          statement.method: ${statement.method}
        `
      }
    }
  }

  function checkValidationsFor(dream: Dream) {
    const Base = dream.constructor as typeof Dream
    const validationErrors: { [key: string]: ValidationType[] } = {}

    columns.forEach(column => {
      Base.validations
        .filter(
          // @ts-ignore
          validation => validation.column === column
        )
        .forEach(validation => {
          if (!isValid(dream, validation)) {
            validationErrors[validation.column] ||= []
            validationErrors[validation.column].push(validation.type)
          }
        })
    })

    return validationErrors
  }

  function runValidationsFor(dream: Dream) {
    const Base = dream.constructor as typeof Dream

    columns.forEach(column => {
      Base.validations
        .filter(
          // @ts-ignore
          validation => validation.column === column
        )
        .forEach(validation => runValidation(dream, validation))
    })
  }

  function runValidation(dream: Dream, validation: ValidationStatement) {
    if (!isValid(dream, validation)) addValidationError(dream, validation)
  }

  function isValid(dream: Dream, validation: ValidationStatement) {
    switch (validation.type) {
      case 'presence':
        return ![undefined, null, ''].includes((dream as any)[validation.column])

      case 'contains':
        switch (validation.options!.contains!.value.constructor) {
          case String:
            return new RegExp(validation.options!.contains!.value).test((dream as any)[validation.column])
          case RegExp:
            return (validation.options!.contains!.value as RegExp).test((dream as any)[validation.column])
        }

      case 'length':
        const length = (dream as any)[validation.column]?.length
        return (
          length &&
          length >= validation.options!.length!.min &&
          validation.options!.length!.max &&
          length <= validation.options!.length!.max
        )

      default:
        throw `Unhandled validation type found while running validations: ${validation.type}`
    }
  }

  function addValidationError(dream: Dream, validation: ValidationStatement) {
    dream.errors[validation.column] ||= []
    dream.errors[validation.column].push(validation.type)
  }

  return Dream
}

type NestedAssociationExpression<
  TB extends keyof DB & keyof SyncedAssociations,
  Property extends keyof SyncedAssociations[TB],
  Next
> = AssociationExpression<SyncedAssociations[TB][Property] & keyof DB & keyof SyncedAssociations, Next>

type AssociationExpression<
  TB extends keyof DB & keyof SyncedAssociations,
  AE = unknown,
  Depth extends number = 0
> = Depth extends 10
  ? never
  : AE extends string
  ? keyof SyncedAssociations[TB]
  : AE extends any[]
  ? AssociationExpression<TB, AE[number], Inc<Depth>>[]
  : AE extends Partial<{
      [Property in keyof SyncedAssociations[TB]]: NestedAssociationExpression<TB, Property, any>
    }>
  ? Partial<{
      [Property in keyof SyncedAssociations[TB]]: NestedAssociationExpression<TB, Property, AE[Property]>
    }>
  : never

type JoinsWhereAssociationExpression<
  TB extends keyof DB & keyof SyncedAssociations,
  AE extends AssociationExpression<TB, any>,
  Depth extends number = 0
> = Depth extends 10
  ? never
  : AE extends any[]
  ? JoinsWhereAssociationExpression<TB, AE[number], Inc<Depth>>[]
  : AE extends keyof SyncedAssociations[TB]
  ? Partial<{
      [AssociationName in keyof SyncedAssociations[TB]]: Updateable<
        DB[SyncedAssociations[TB][AssociationName] & keyof DB & keyof SyncedAssociations]
      >
    }>
  : AE extends Partial<{
      [AssociationName in keyof SyncedAssociations[TB]]: NestedAssociationExpression<TB, AssociationName, any>
    }>
  ? Partial<{
      [AssociationName in keyof SyncedAssociations[TB]]: JoinsWhereAssociationExpression<
        SyncedAssociations[TB][AssociationName] & keyof DB & keyof SyncedAssociations,
        NestedAssociationExpression<TB, AssociationName, AE[AssociationName]>
      >
    }>
  : never

export interface IncludesStatement<
  TableName extends keyof DB,
  IncludesExpression = SyncedAssociations[TableName]
> {
  expression: IncludesExpression
}

export type DreamModel<
  TableName extends keyof DB & string,
  IdColumnName extends keyof DB[TableName] & string
> = ReturnType<typeof dream<TableName, IdColumnName>>

export type DreamModelInstance<
  TableName extends keyof DB & string,
  IdColumnName extends keyof DB[TableName] & string
> = InstanceType<ReturnType<typeof dream<TableName, IdColumnName>>>

export interface AliasCondition<PreviousTableName extends keyof DB & keyof SyncedAssociations> {
  conditionToExecute: boolean
  alias: keyof SyncedAssociations[PreviousTableName]
  column: keyof Updateable<DB[PreviousTableName]>
  columnValue: any
}
