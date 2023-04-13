import { Tables } from './db/reflections'
import db from './db'
import camelize from './helpers/camelize'
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
import { HasManyStatement } from './decorators/associations/has-many'
import { BelongsToStatement } from './decorators/associations/belongs-to'
import { HasOneStatement } from './decorators/associations/has-one'
import { ScopeStatement } from './decorators/scope'
import { HookStatement } from './decorators/hooks/shared'
import * as pluralize from 'pluralize'
import ValidationStatement, { ValidationType } from './decorators/validations/shared'
import { ExtractTableAlias } from 'kysely/dist/cjs/parser/table-parser'
import { marshalDBValue } from './helpers/marshalDBValue'
import sqlAttributes from './helpers/sqlAttributes'
import { DateRange } from './helpers/daterange'
import ValidationError from './exceptions/validation-error'
import InStatement from './ops/in'
import LikeStatement from './ops/like'
import ILikeStatement from './ops/ilike'
import { OpsStatement } from './ops'
import { SyncedAssociations } from './sync/associations'

export default function dream<
  TableName extends keyof DB & keyof SyncedAssociations & string,
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

    public static selectForWhere<
      T extends Dream,
      SE extends SelectExpression<DB, ExtractTableAlias<DB, TableName>>
    >(this: { new (): T } & typeof Dream, selection: SelectArg<DB, ExtractTableAlias<DB, TableName>, SE>) {
      let query: Query<T> = new Query<T>(this)
      return query.selectForWhere(selection)
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

    public static where<T extends Dream, SubTable extends keyof DB>(
      this: { new (): T } & typeof Dream,
      attributes:
        | Updateable<Table>
        | Partial<Record<keyof Table, DateRange | OpsStatement>>
        | Partial<
            Record<keyof Table, SelectQueryBuilder<DB, SubTable, Selection<DB, SubTable, DB[SubTable]>>>
          >
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

    public get isDirty() {
      return !!Object.keys(this.dirtyAttributes).length
    }

    public get isDreamInstance() {
      return true
    }

    public get isPersisted() {
      // todo: clean up types here
      return !!(this as any)[(this.constructor as typeof Dream).primaryKey as any]
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

    public get associations() {
      return (this.constructor as typeof Dream).associations
    }

    public get associationMap() {
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

    public async load<DreamClass extends Dream>(
      this: DreamClass,
      ...associations: AssociationExpression<DreamClass['table'] & keyof SyncedAssociations, any>[]
    ): Promise<void> {
      for (let association of associations) {
        if (Array.isArray(association)) {
          await this.load(...(association as any))
        } else {
          const [type, associationMetadata] = associationMetadataFor(
            association as SyncedAssociations[DreamClass['table']]['AssociationName'],
            this
          )
          if (!type || !associationMetadata) throw `Association not found: ${association as any}`

          const id = (this as any)[(this.constructor as typeof Dream).primaryKey]
          if (!id) throw `Cannot load association on unpersisted record`

          const ModelClass = associationMetadata.modelCB()

          switch (type) {
            case 'hasOne':
              const hasOneAssociation = associationMetadata as HasOneStatement<TableName>
              if (hasOneAssociation.through) {
                let hasOneQuery = db.selectFrom(hasOneAssociation.to)
                // apply scopes here
                hasOneQuery = loadHasManyThrough(
                  hasOneAssociation,
                  hasOneQuery,
                  this.constructor as any,
                  this
                ) as SelectQueryBuilder<DB, keyof DB, {}>
                const hasOneResults = await hasOneQuery.execute()
                if (hasOneResults[0]) (this as any)[association] = new ModelClass(hasOneResults[0])
              } else {
                let hasOneQuery = db.selectFrom(hasOneAssociation.to)
                // apply scopes here
                const hasOneResult = await hasOneQuery
                  .where(hasOneAssociation.foreignKey() as any, '=', id)
                  .selectAll()
                  .executeTakeFirst()

                ;(this as any)[association] = new ModelClass(hasOneResult)
              }
              break

            case 'hasMany':
              const hasManyAssociation = associationMetadata as HasManyStatement<TableName>

              if (hasManyAssociation.through) {
                let hasManyQuery = db.selectFrom(hasManyAssociation.to)
                // apply scopes here
                hasManyQuery = loadHasManyThrough(
                  hasManyAssociation,
                  hasManyQuery,
                  this.constructor as any,
                  this
                ) as SelectQueryBuilder<DB, keyof DB, {}>
                const hasManyResults = await hasManyQuery.execute()
                ;(this as any)[association] = hasManyResults.map(r => new ModelClass(r))
              } else {
                const hasManyQuery = db.selectFrom(associationMetadata.to)
                // apply scopes here
                const hasManyResults = await hasManyQuery
                  .where(associationMetadata.foreignKey() as any, '=', id)
                  .selectAll()
                  .execute()
                ;(this as any)[association] = hasManyResults.map(r => new ModelClass(r))
              }
              break

            case 'belongsTo':
              const belongsToAssociation = associationMetadata as BelongsToStatement<TableName>
              const foreignKey = (this as any)[belongsToAssociation.foreignKey()]
              const belongsToQuery = db.selectFrom(associationMetadata.to)
              // apply scopes here
              const belongsToResult = await belongsToQuery
                .where(ModelClass.primaryKey as any, '=', foreignKey)
                .selectAll()
                .executeTakeFirst()
              ;(this as any)[association] = new ModelClass(belongsToResult)
              break
          }
        }
      }
    }

    public async reload<T extends Dream>(this: T) {
      const base = this.constructor as typeof Dream

      const query: Query<T> = new Query<T>(base)
      await query
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
    public whereStatement:
      | Updateable<Table>
      | SelectQueryBuilder<DB, TableName, {}>
      | Partial<Record<keyof Table, DateRange | OpsStatement>>
      | null = null
    public limitStatement: { count: number } | null = null
    public orderStatement: { column: keyof Table & string; direction: 'asc' | 'desc' } | null = null
    public selectStatement: SelectArg<DB, TableName, SelectExpression<DB, TableName>> | null = null
    // public includesStatements: IncludesStatement<TableName>[] = []
    public shouldBypassDefaultScopes: boolean = false
    public dreamClass: typeof Dream

    constructor(DreamClass: typeof Dream) {
      this.dreamClass = DreamClass
    }

    public bypassDefaultScopes() {
      this.shouldBypassDefaultScopes = true
      return this
    }

    // public includes<IncludesExpression = SyncedAssociations[TableName] | '${SyncedAssociations[TableName]}'>() {
    public includes<IncludesExpression extends SyncedAssociations[TableName]['AssociationName']>(
      ...args: AssociationExpression<DreamClass['table'] & keyof SyncedAssociations, any>[]
    ) {
      // this.includesStatements = [
      //   ...new Set([
      //     ...this.includesStatements,
      //     ...args.map(
      //       arg =>
      //         ({
      //           expression: arg,
      //         } as IncludesStatement<TableName, any>)
      //     ),
      //   ]),
      // ]
      return this
    }

    public where(
      attributes:
        | Updateable<Table>
        | SelectQueryBuilder<DB, TableName, {}>
        | Partial<Record<keyof Table, DateRange | OpsStatement>>
    ) {
      this.whereStatement = { ...this.whereStatement, ...attributes }
      return this
    }

    public select<SE extends SelectExpression<DB, TableName>>(selection: SelectArg<DB, TableName, SE>) {
      this.selectStatement = selection
      return this
    }

    public selectForWhere<SE extends SelectExpression<DB, ExtractTableAlias<DB, TableName>>>(
      selection: SelectArg<DB, ExtractTableAlias<DB, TableName>, SE>
    ) {
      return db.selectFrom(tableName).select(selection)
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
      const results = await query.execute()
      const DreamClass = Dream
      return results.map(r => new DreamClass(r as Updateable<Table>) as DreamClass)
    }

    public async first() {
      if (!this.orderStatement) this.order(Dream.primaryKey as keyof Table & string, 'asc')

      const query = this.buildSelect()
      const results = await query.executeTakeFirst()

      if (results) return new this.dreamClass(results as any) as DreamClass
      else return null
    }

    public async last() {
      if (!this.orderStatement) this.order(Dream.primaryKey, 'desc')

      const query = this.buildSelect()
      const results = await query.executeTakeFirst()

      if (results) return new Dream(results) as DreamClass
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

    public conditionallyApplyScopes() {
      if (this.shouldBypassDefaultScopes) return

      const thisScopes = this.dreamClass.scopes.default.filter(s => s.className === this.dreamClass.name)
      for (const scope of thisScopes) {
        ;(this.dreamClass as any)[scope.method](this)
      }
    }

    public buildDestroy() {
      let query = db.deleteFrom(tableName as TableName)
      if (this.whereStatement) {
        Object.keys(this.whereStatement).forEach(attr => {
          query = query.where(attr as any, '=', (this.whereStatement as any)[attr])
        })
      }
      return query
    }

    public buildSelect({ bypassSelectAll = false }: { bypassSelectAll?: boolean } = {}) {
      this.conditionallyApplyScopes()

      let query = db.selectFrom(tableName)
      if (!bypassSelectAll) query = query.selectAll()

      if (this.selectStatement) {
        query = query.select(this.selectStatement as any)
      }

      if (this.whereStatement) {
        Object.keys(this.whereStatement).forEach(attr => {
          const val = (this.whereStatement as any)[attr]

          if (val === null) {
            query = query.where(attr as any, 'is', val)
          } else if (val.constructor === SelectQueryBuilder) {
            query = query.where(attr as any, 'in', val)
          } else if (val.constructor === InStatement) {
            query = query.where(attr as any, 'in', val.in)
          } else if (val.constructor === LikeStatement) {
            query = query.where(attr as any, 'like', val.like)
          } else if (val.constructor === ILikeStatement) {
            query = query.where(attr as any, 'ilike', val.ilike)
          } else if (val.constructor === DateRange) {
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
  function associationMetadataFor<T extends Dream>(
    association: SyncedAssociations[T['table']]['AssociationName'],
    dream: T
  ): [
    'hasOne' | 'hasMany' | 'belongsTo' | null,
    HasOneStatement<any> | HasManyStatement<any> | BelongsToStatement<any> | null
  ] {
    const hasOneMatch = (dream.constructor as typeof Dream).associations.hasOne.find(
      d => (d.as as any) === association
    )
    if (hasOneMatch) return ['hasOne', hasOneMatch]

    const hasManyMatch = (dream.constructor as typeof Dream).associations.hasMany.find(
      d => (d.as as any) === association
    )
    if (hasManyMatch) return ['hasMany', hasManyMatch]

    const belongsToMatch = (dream.constructor as typeof Dream).associations.belongsTo.find(
      d => (d.as as any) === association
    )
    if (belongsToMatch) return ['belongsTo', belongsToMatch]

    return [null, null]
  }

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
      await (dream as any)[statement.method]()
    }
  }

  function loadHasManyThrough<T extends Dream>(
    association: HasManyStatement<TableName> | HasOneStatement<TableName>,
    query: SelectQueryBuilder<DB, TableName, {}>,
    BaseModelClass: DreamModel<any, any>,
    dream: T
  ) {
    if (!association.through)
      throw `
        Should not be loading has many through, since this association does not have a through attribute.
        Attributes provided were:
          ${JSON.stringify(association)}
      `

    const throughKey = association.through!
    const [throughAssociationType, _throughAssociationMetadata] = associationMetadataFor(
      throughKey as any,
      dream
    )
    const throughAssociationMetadata: HasOneStatement<any> | HasManyStatement<any> =
      _throughAssociationMetadata as HasManyStatement<any> | BelongsToStatement<any>
    if (!throughAssociationMetadata)
      throw `
        Unable to find association metadata for:
          ${dream.constructor.name} ${throughKey}
      `

    const FinalModelClass = association.modelCB()

    // if we are dealing with a nested through situation
    if (throughAssociationMetadata.throughClass) {
      const ThroughModelClass = throughAssociationMetadata.throughClass()
      query = recursiveThrough(
        throughAssociationMetadata,
        query,
        ThroughModelClass,
        BaseModelClass,
        FinalModelClass,
        association.foreignKey(),
        dream
      )
    } else {
      if (throughAssociationType === 'belongsTo') {
        query = query.innerJoin(
          throughAssociationMetadata.to,
          // @ts-ignore
          `${throughAssociationMetadata.to}.${pluralize.singular(association.to)}_id`,
          `${association.to}.${association.modelCB().primaryKey}`
        )
        // @ts-ignore
        query = query.innerJoin(
          BaseModelClass.table,
          // @ts-ignore
          `${BaseModelClass.table}.${throughAssociationMetadata.foreignKey()}`,
          `${throughAssociationMetadata.to}.${throughAssociationMetadata.modelCB().primaryKey}`
        )
      } else {
        query = query.innerJoin(
          throughAssociationMetadata.to,
          // @ts-ignore
          `${throughAssociationMetadata.to}.${throughAssociationMetadata.modelCB().primaryKey}`,
          `${association.to}.${association.foreignKey()}`
        )
        // @ts-ignore
        query = query.innerJoin(
          BaseModelClass.table,
          // @ts-ignore
          `${BaseModelClass.table}.${BaseModelClass.primaryKey}`,
          `${throughAssociationMetadata.to}.${throughAssociationMetadata.foreignKey()}`
        )
      }
    }

    const select = [
      `${Dream.table}.${Dream.primaryKey}`,
      ...DBColumns[association.to].map(column => `${FinalModelClass.table}.${column} as ${column}`),
    ]

    query = query
      // @ts-ignore
      .select(select as any)
      .where(`${Dream.table}.${Dream.primaryKey}` as any, '=', (dream as any)[BaseModelClass.primaryKey])

    return query
  }

  const recursiveThrough = (
    association: HasManyStatement<TableName> | HasOneStatement<TableName>,
    query: SelectQueryBuilder<DB, TableName, {}>,
    CurrentModelClass: DreamModel<any, any>,
    BaseModelClass: DreamModel<any, any>,
    PreviousModelClass: DreamModel<any, any>,
    previousForeignKey: string,
    dream: Dream
  ) => {
    const ThisModelClass = association.modelCB()
    const ThroughModelClass = association.throughClass!()
    const throughKey = association.through!
    const [throughAssociationType, throughAssociationMetadata] = associationMetadataFor(
      throughKey as any,
      dream
    )
    if (!throughAssociationMetadata || !throughAssociationType)
      throw `
          Missing association for ${throughKey}
        `

    query = query.innerJoin(
      association.to,
      // @ts-ignore
      `${association.to}.${ThisModelClass.primaryKey}`,
      `${PreviousModelClass.table}.${previousForeignKey}`
    )

    if (
      ['hasMany', 'hasOne'].includes(throughAssociationType!) &&
      (throughAssociationMetadata as HasManyStatement<TableName> | HasOneStatement<TableName>).throughClass
    ) {
      const typedThroughAssociationMetadata = throughAssociationMetadata as
        | HasManyStatement<TableName>
        | HasOneStatement<TableName>
      query = recursiveThrough(
        typedThroughAssociationMetadata!,
        query,
        ThroughModelClass,
        BaseModelClass,
        CurrentModelClass,
        throughAssociationMetadata!.foreignKey(),
        dream
      )
    } else {
      query = query.innerJoin(
        throughAssociationMetadata!.to,
        // @ts-ignore
        `${throughAssociationMetadata!.to}.${throughAssociationMetadata!.modelCB().primaryKey}`,
        `${association.to}.${association.foreignKey()}`
      )

      // @ts-ignore
      query = query.innerJoin(
        BaseModelClass.table,
        // @ts-ignore
        `${BaseModelClass.table}.${BaseModelClass.primaryKey}`,
        `${throughAssociationMetadata!.to}.${throughAssociationMetadata!.foreignKey()}`
      )
    }

    return query
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
  TB extends keyof SyncedAssociations & string,
  Property extends keyof SyncedAssociations[TB]['AssociationTableMap'],
  Next
> = AssociationExpression<
  SyncedAssociations[TB]['AssociationTableMap'][Property] & keyof SyncedAssociations,
  Next
>

type AssociationExpression<TB extends keyof SyncedAssociations & string, AE = unknown> = AE extends string
  ? keyof SyncedAssociations[TB]['AssociationTableMap']
  : AE extends string[]
  ? (keyof SyncedAssociations[TB]['AssociationTableMap'])[]
  : AE extends Partial<{
      [Property in keyof SyncedAssociations[TB]['AssociationTableMap']]: NestedAssociationExpression<
        TB,
        Property,
        any
      >
    }>
  ? Partial<{
      [Property in keyof SyncedAssociations[TB]['AssociationTableMap']]: NestedAssociationExpression<
        TB,
        Property,
        AE[Property]
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
