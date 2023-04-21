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
import { AssociationTableNames } from './db/reflections'

export default function dream<
  TableName extends AssociationTableNames,
  IdColumnName extends keyof DB[TableName] & string,
  QueryAssociationExpression extends AssociationExpression<
    TableName & AssociationTableNames,
    any
  > = AssociationExpression<TableName & AssociationTableNames, any>
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
    public whereJoinsStatement: JoinsWhereAssociationExpression<
      TableName,
      AssociationExpression<TableName, any>
    >[] = []
    public limitStatement: { count: number } | null = null
    public orStatements: Query<DreamClass>[] = []
    public orderStatement: { column: keyof Table & string; direction: 'asc' | 'desc' } | null = null
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
        | JoinsWhereAssociationExpression<TableName & AssociationTableNames, T['joinsStatements'][number]>
    ) {
      if (attributes.constructor === Array) {
        // @ts-ignore
        this.whereJoinsStatement = [...this.whereJoinsStatement, ...attributes]
      } else {
        Object.keys(attributes).forEach(key => {
          if (columns.includes(key)) {
            this.whereStatement ||= {}
            // @ts-ignore
            this.whereStatement[key] = attributes[key]
          } else {
            // @ts-ignore
            this.whereJoinsStatement.push({ [key]: attributes[key] })
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
      // dreams is a Rating
      // Rating belongs to: rateables (Posts / Compositions)
      // loadedAssociations is an array of Posts and Compositions
      // if rating.rateable_id === loadedAssociation.primaryKeyvalue
      //  rating.rateable = loadedAssociation
      for (const loadedAssociation of loadedAssociations) {
        if (association.type === 'BelongsTo') {
          dreams
            .filter((dream: any) => {
              if (association.polymorphic) {
                return (
                  dream[association.foreignKeyTypeField()] === loadedAssociation.constructor.name &&
                  dream[association.foreignKey()] === loadedAssociation.primaryKeyValue
                )
              } else {
                return dream[association.foreignKey()] === loadedAssociation.primaryKeyValue
              }
            })
            .forEach((dream: any) => {
              dream[association.as] = loadedAssociation
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
            .forEach((dream: any) => {
              if (association.type === 'HasOne') {
                dream[association.as] ||= loadedAssociation
              } else {
                dream[association.as] ||= []
                dream[association.as].push(loadedAssociation)
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
        if (association.polymorphic) {
          // Rating polymorphically BelongsTo Composition and Post
          // for each of Composition and Post
          for (const associatedModel of association.modelCB() as DreamModel<any, any>[]) {
            const relevantAssociatedModels = dreams.filter((dream: any) => {
              return (dream as any)[association.foreignKeyTypeField()] === associatedModel.name
            })

            if (relevantAssociatedModels.length) {
              associationQuery = associatedModel.where({
                [associatedModel.primaryKey]: relevantAssociatedModels.map(
                  (dream: any) => (dream as any)[association.foreignKey()]
                ),
              })

              this.hydrateAssociation(dreams, association, await associationQuery.all())
            }
          }
        } else {
          const associatedModel = association.modelCB() as DreamModel<any, any>
          associationQuery = associatedModel.where({
            [associatedModel.primaryKey]: dreams.map(dream => (dream as any)[association.foreignKey()]),
          })

          this.hydrateAssociation(dreams, association, await associationQuery.all())
        }
      } else {
        const associatedModel = association.modelCB() as DreamModel<any, any>

        if (association.polymorphic) {
          associationQuery = associatedModel.where({
            [association.foreignKey()]: dreams.map(dream => dream.primaryKeyValue),
            [association.foreignKeyTypeField()]: associatedModel.name,
          })
        } else {
          associationQuery = associatedModel.where({
            [association.foreignKey()]: dreams.map(dream => dream.primaryKeyValue),
          })
        }

        if (association.where) associationQuery = associationQuery.where(association.where)

        this.hydrateAssociation(dreams, association, await associationQuery.all())
      }

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
      // whereJoinsStatement: { commenters: { id: <some commenter id> } }
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
        if (association.modelCB().constructor === Array) throw 'Cannot join on a polymorphic BelongsTo'

        // @ts-ignore
        query = query.innerJoin(
          // @ts-ignore
          joinTableExpression,
          `${previousAssociationTableOrAlias}.${association.foreignKey() as string}`,
          `${currentAssociationTableOrAlias as string}.${
            (association.modelCB() as DreamModel<any, any>).primaryKey
          }`
        )
      } else {
        // @ts-ignore
        query = query.innerJoin(
          // @ts-ignore
          joinTableExpression,
          `${previousAssociationTableOrAlias}.${association.modelCB().primaryKey}`,
          `${currentAssociationTableOrAlias as string}.${association.foreignKey() as string}`
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

    public recursivelyJoin<PreviousTableName extends AssociationTableNames>({
      query,
      joinsStatement,
      dreamClass,
      previousAssociationTableOrAlias,
    }: {
      query: SelectQueryBuilder<DB, ExtractTableAlias<DB, TableName>, {}>
      joinsStatement:
        | JoinsWhereAssociationExpression<PreviousTableName, AssociationExpression<PreviousTableName, any>>
        | Updateable<DB[PreviousTableName]>
      dreamClass: DreamModel<any, any>
      previousAssociationTableOrAlias: string
    }): SelectQueryBuilder<DB, ExtractTableAlias<DB, TableName>, {}> {
      if (joinsStatement.constructor === Array) {
        joinsStatement.forEach(oneJoinsStatement => {
          query = this.recursivelyJoin({
            query,
            joinsStatement: oneJoinsStatement,
            dreamClass,
            previousAssociationTableOrAlias,
          }) as SelectQueryBuilder<DB, ExtractTableAlias<DB, TableName>, {}>
        })

        return query
      } else if (joinsStatement.constructor === String) {
        const results = this.applyOneJoin({
          query,
          dreamClass,
          previousAssociationTableOrAlias,
          currentAssociationTableOrAlias: joinsStatement,
        })

        return results.query
      }

      for (const currentAssociationTableOrAlias of Object.keys(joinsStatement) as string[]) {
        const results = this.applyOneJoin({
          query,
          dreamClass,
          previousAssociationTableOrAlias,
          currentAssociationTableOrAlias,
        })

        query = results.query
        const association = results.association

        query = this.recursivelyJoin<any>({
          query,
          // @ts-ignore
          joinsStatement: joinsStatement[currentAssociationTableOrAlias],
          dreamClass: association.modelCB(),
          previousAssociationTableOrAlias: currentAssociationTableOrAlias,
        })
      }

      return query
    }

    public applyWhereStatement<T extends Query<DreamClass>>(
      this: T,
      query: SelectQueryBuilder<DB, ExtractTableAlias<DB, TableName>, {}>,
      whereStatement:
        | WhereStatement<TableName>
        | JoinsWhereAssociationExpression<TableName & AssociationTableNames, T['joinsStatements'][number]>
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

    public recursivelyApplyJoinWhereStatement<PreviousTableName extends AssociationTableNames>(
      query: SelectQueryBuilder<DB, ExtractTableAlias<DB, TableName>, {}>,
      whereJoinsStatement:
        | JoinsWhereAssociationExpression<PreviousTableName, AssociationExpression<PreviousTableName, any>>
        | Updateable<DB[PreviousTableName]>,
      previousAssociationTableOrAlias: string
    ) {
      for (const key of Object.keys(whereJoinsStatement) as (
        | keyof SyncedAssociations[PreviousTableName]
        | keyof Updateable<DB[PreviousTableName]>
      )[]) {
        const columnValue = (whereJoinsStatement as Updateable<DB[PreviousTableName]>)[
          key as keyof Updateable<DB[PreviousTableName]>
        ]

        if (columnValue!.constructor !== Object) {
          // @ts-ignore
          query = query.where(`${previousAssociationTableOrAlias}.${key}`, '=', columnValue)
        } else {
          let currentAssociationTableOrAlias = key as
            | (keyof SyncedAssociations[PreviousTableName] & string)
            | string

          query = this.recursivelyApplyJoinWhereStatement<any>(
            query,
            // @ts-ignore
            whereJoinsStatement[currentAssociationTableOrAlias],
            currentAssociationTableOrAlias
          )
        }
      }

      return query
    }

    public buildSelect({ bypassSelectAll = false }: { bypassSelectAll?: boolean } = {}) {
      this.conditionallyApplyScopes()

      let query = db.selectFrom(tableName)
      if (!bypassSelectAll) query = query.selectAll(tableName as any)

      if (this.joinsStatements.length) {
        query = this.recursivelyJoin<any>({
          query,
          joinsStatement: this.joinsStatements,
          // @ts-ignore
          dreamClass: this.dreamClass,
          previousAssociationTableOrAlias: this.dreamClass.table,
        })
      }

      this.orStatements.forEach(orStatement => {
        query = query.union(orStatement.toKysely() as any)
      })

      if (this.whereStatement) {
        query = this.applyWhereStatement(query, this.whereStatement)
      }

      if (this.whereJoinsStatement.length) {
        this.whereJoinsStatement.forEach(whereJoinsStatement => {
          // @ts-ignore
          query = this.recursivelyApplyJoinWhereStatement<any>(query, whereJoinsStatement)
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
  TB extends AssociationTableNames,
  Property extends keyof SyncedAssociations[TB],
  Next
> = AssociationExpression<SyncedAssociations[TB][Property] & AssociationTableNames, Next>

type AssociationExpression<
  TB extends AssociationTableNames,
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
  TB extends AssociationTableNames,
  AE extends AssociationExpression<TB, any>,
  Depth extends number = 0
> = Depth extends 10
  ? never
  : AE extends any[]
  ? JoinsWhereAssociationExpression<TB, AE[number], Inc<Depth>>[]
  : AE extends keyof SyncedAssociations[TB]
  ? Partial<{
      [AssociationName in keyof SyncedAssociations[TB]]: Updateable<
        DB[SyncedAssociations[TB][AssociationName] & AssociationTableNames]
      >
    }>
  : AE extends Partial<{
      [AssociationName in keyof SyncedAssociations[TB]]: NestedAssociationExpression<TB, AssociationName, any>
    }>
  ? Partial<{
      [AssociationName in keyof SyncedAssociations[TB]]: JoinsWhereAssociationExpression<
        SyncedAssociations[TB][AssociationName] & AssociationTableNames,
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
  TableName extends AssociationTableNames,
  IdColumnName extends keyof DB[TableName] & string
> = ReturnType<typeof dream<TableName, IdColumnName>>

export type DreamModelInstance<
  TableName extends AssociationTableNames,
  IdColumnName extends keyof DB[TableName] & string
> = InstanceType<ReturnType<typeof dream<TableName, IdColumnName>>>

export interface AliasCondition<PreviousTableName extends AssociationTableNames> {
  conditionToExecute: boolean
  alias: keyof SyncedAssociations[PreviousTableName]
  column: keyof Updateable<DB[PreviousTableName]>
  columnValue: any
}
