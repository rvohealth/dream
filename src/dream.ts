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
import CannotJoinPolymorphicBelongsToError from './exceptions/cannot-join-polymorphic-belongs-to-error'
import ValidationError from './exceptions/validation-error'
import { SyncedAssociations, SyncedBelongsToAssociations } from './sync/associations'
import { Inc } from './helpers/typeutils'
import { WhereStatement } from './decorators/associations/shared'
import { AssociationTableNames } from './db/reflections'
import OpsStatement from './ops/ops-statement'
import CanOnlyPassBelongsToModelParam from './exceptions/can-only-pass-belongs-to-model-param'

// export default function dream<
//   TableName extends AssociationTableNames,
//   IdColumnName extends keyof DB[TableName] & string,
//   QueryAssociationExpression extends AssociationExpression<
//     TableName & AssociationTableNames,
//     any
//   > = AssociationExpression<TableName & AssociationTableNames, any>,
//   BelongsToModelAssociationNames extends keyof SyncedBelongsToAssociations[TableName] = keyof SyncedBelongsToAssociations[TableName]
// >(tableName: TableName, primaryKey: IdColumnName = 'id' as IdColumnName) {
//   const columns = DBColumns[tableName]
//   const tableNames = Object.keys(DBColumns)

//   type Table = DB[TableName]
//   type IdColumn = Table[IdColumnName]
//   type Data = Selectable<Table>
//   type Id = Readonly<SelectType<IdColumn>>
//   type AssociationModelParam = Partial<
//     Record<
//       BelongsToModelAssociationNames,
//       DreamModelInstance<
//         SyncedBelongsToAssociations[TableName][BelongsToModelAssociationNames][keyof SyncedBelongsToAssociations[TableName][BelongsToModelAssociationNames]] &
//           AssociationTableNames,
//         any
//       >
//     >
//   >
//   type ModelParams = Updateable<Table> | AssociationModelParam

export default class Dream {
  // public static primaryKey<
  //   T extends typeof Dream,
  //   TableName extends keyof DB = T['table'] & keyof DB,
  //   Table extends DB[keyof DB] = DB[TableName]
  // >(this: T): keyof Table {
  //   return 'id' as keyof Table
  // }
  public static get primaryKey(): string {
    return 'id'
  }

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

  public static get table(): AssociationTableNames {
    throw 'override table method in child'
  }

  public static columns<
    T extends typeof Dream,
    TableName extends keyof DB = T['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName]
  >(): (keyof Table)[] {
    return (DBColumns as any)[this.table]
  }

  public static get associationMap() {
    const allAssociations = [
      ...this.associations.belongsTo,
      ...this.associations.hasOne,
      ...this.associations.hasMany,
    ]

    const map = {} as {
      [key: (typeof allAssociations)[number]['as']]:
        | BelongsToStatement<AssociationTableNames>
        | HasManyStatement<AssociationTableNames>
        | HasOneStatement<AssociationTableNames>
    }

    for (const association of allAssociations) {
      map[association.as] = association
    }

    return map
  }

  public static get associationNames() {
    const allAssociations = [
      ...this.associations.belongsTo,
      ...this.associations.hasOne,
      ...this.associations.hasMany,
    ]
    return allAssociations.map(association => {
      return association.as
    })
  }

  public static async all<
    T extends typeof Dream,
    TableName extends keyof DB = T['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName],
    IdColumn = T['primaryKey'] & keyof Table
  >(this: T): Promise<InstanceType<T>[]> {
    const query: Query<T> = new Query<T>(this)
    return await query.all()
  }

  public static async count<T extends typeof Dream, TableName extends keyof DB = T['table'] & keyof DB>(
    this: T
  ): Promise<number> {
    const query: Query<T> = new Query<T>(this)
    return await query.count()
  }

  public static async create<T extends typeof Dream>(
    this: T,
    opts?:
      | Updateable<DB[T['table']]>
      | Partial<
          Record<
            keyof SyncedBelongsToAssociations[T['table']],
            ReturnType<
              T['associationMap'][keyof T['associationMap']]['modelCB']
            > extends () => (typeof Dream)[]
              ? InstanceType<
                  ReturnType<
                    T['associationMap'][keyof T['associationMap']]['modelCB'] & (() => (typeof Dream)[])
                  >[number]
                >
              : InstanceType<
                  ReturnType<T['associationMap'][keyof T['associationMap']]['modelCB'] & (() => typeof Dream)>
                >
          >
        >
  ) {
    return (await new (this as any)(opts as any).save()) as InstanceType<T>
  }

  public static async destroyAll<T extends typeof Dream>(this: T) {
    const query: Query<T> = new Query<T>(this)
    return await query.destroy()
  }

  public static async destroyBy<
    T extends typeof Dream,
    TableName extends keyof DB = T['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName]
  >(this: T, opts?: Updateable<Table>) {
    const query: Query<T> = new Query<T>(this)
    return await query.destroyBy(opts as any)
  }

  public static async find<
    T extends typeof Dream,
    TableName extends keyof DB = T['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName],
    IdColumn = T['primaryKey'] & keyof Table,
    Id = Readonly<SelectType<IdColumn>>
  >(this: T, id: Id): Promise<(InstanceType<T> & Dream) | null> {
    const query: Query<T> = new Query<T>(this)
    return (await query.where({ [this.primaryKey]: id } as any).first()) as (InstanceType<T> & Dream) | null
  }

  public static async findBy<
    T extends typeof Dream,
    TableName extends keyof DB = T['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName],
    IdColumn = T['primaryKey'] & keyof Table
  >(this: T, attributes: Updateable<DB[T['table']]>): Promise<(InstanceType<T> & Dream) | null> {
    const query: Query<T> = new Query<T>(this)
    return (await query.where(attributes as any).first()) as (InstanceType<T> & Dream) | null
  }

  public static async first<T extends typeof Dream, TableName extends keyof DB = T['table'] & keyof DB>(
    this: T
  ): Promise<InstanceType<T> | null> {
    const query: Query<T> = new Query<T>(this)
    return (await query.first()) as (InstanceType<T> & Dream) | null
  }

  public static includes<
    T extends typeof Dream,
    TableName extends AssociationTableNames = T['table'] & AssociationTableNames,
    QueryAssociationExpression extends AssociationExpression<
      TableName & AssociationTableNames,
      any
    > = AssociationExpression<TableName & AssociationTableNames, any>
  >(this: T, ...associations: QueryAssociationExpression[]) {
    const query: Query<T> = new Query<T>(this)

    // @ts-ignore
    return query.includes(...associations)
  }

  public static joins<
    T extends typeof Dream,
    QueryAssociationExpression extends AssociationExpression<T['table'], any> = AssociationExpression<
      T['table'],
      any
    >
  >(this: T, ...associations: QueryAssociationExpression[]) {
    const query: Query<T> = new Query<T>(this)
    return query.joins(...associations)
  }

  public static async last<T extends typeof Dream>(this: T): Promise<InstanceType<T> | null> {
    const query: Query<T> = new Query<T>(this)
    return (await query.last()) as InstanceType<T> | null
  }

  public static limit<T extends typeof Dream>(this: T, count: number) {
    let query: Query<T> = new Query<T>(this)
    query = query.limit(count)
    return query
  }

  public static order<
    T extends typeof Dream,
    ColumnName extends keyof Table & string,
    TableName extends AssociationTableNames = T['table'] & AssociationTableNames,
    Table extends DB[keyof DB] = DB[TableName]
  >(this: T, column: ColumnName, direction: 'asc' | 'desc' = 'asc') {
    let query: Query<T> = new Query<T>(this)
    query = query.order(column as any, direction)
    return query
  }

  public static async pluck<
    T extends typeof Dream,
    SE extends SelectExpression<DB, ExtractTableAlias<DB, T['table'] & AssociationTableNames>>,
    TableName extends AssociationTableNames = T['table'] & AssociationTableNames
  >(this: T, ...fields: SelectArg<DB, ExtractTableAlias<DB, T['table'] & AssociationTableNames>, SE>[]) {
    let query: Query<T> = new Query<T>(this)
    return await query.pluck(...(fields as any[]))
  }

  public static nestedSelect<
    T extends typeof Dream,
    SE extends SelectExpression<DB, ExtractTableAlias<DB, T['table'] & AssociationTableNames>>,
    TableName extends AssociationTableNames = T['table'] & AssociationTableNames
  >(this: T, selection: SelectArg<DB, ExtractTableAlias<DB, T['table'] & AssociationTableNames>, SE>) {
    let query: Query<T> = new Query<T>(this)
    return query.nestedSelect(selection as any)
  }

  public static scope<T extends typeof Dream>(this: T, scopeName: string) {
    let query: Query<T> = new Query<T>(this)
    query = (this as any)[scopeName](query) as Query<T>
    return query
  }

  public static sql<T extends typeof Dream>(this: T): CompiledQuery<{}> {
    const query: Query<T> = new Query<T>(this)
    return query.sql()
  }

  public static where<
    T extends typeof Dream,
    TableName extends AssociationTableNames = T['table'] & AssociationTableNames
  >(this: T, attributes: WhereStatement<TableName>) {
    const query: Query<T> = new Query<T>(this)
    // @ts-ignore
    query.where(attributes)
    return query
  }

  public static new<
    T extends typeof Dream,
    TableName extends AssociationTableNames = T['table'] & AssociationTableNames,
    Table extends DB[keyof DB] = DB[TableName]
  >(this: T, opts?: Updateable<Table>) {
    return new this(opts) as InstanceType<T>
  }

  public errors: { [key: string]: ValidationType[] } = {}
  public frozenAttributes: { [key: string]: any } = {}
  constructor(opts?: Updateable<DB[keyof DB]>) {
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
    return !!Object.keys(this.dirtyAttributes()).length
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

  public attributes<T extends typeof Dream>(this: InstanceType<T>): Updateable<DB[T['table']]> {
    const obj: Updateable<DB[T['table']]> = {}
    ;(this.constructor as typeof Dream).columns().forEach(column => {
      ;(obj as any)[column] = (this as any)[column]
    })
    return obj
  }

  public dirtyAttributes<
    T extends Dream,
    TableName extends AssociationTableNames = T['table'] & AssociationTableNames,
    Table extends DB[keyof DB] = DB[TableName]
  >(): Updateable<Table> {
    const obj: Updateable<Table> = {}
    Object.keys(this.attributes()).forEach(column => {
      // TODO: clean up types
      if (
        (this.frozenAttributes as any)[column] === undefined ||
        (this.frozenAttributes as any)[column] !== (this.attributes() as any)[column]
      )
        (obj as any)[column] = (this.attributes() as any)[column]
    })
    return obj
  }

  public changedAttributes<
    T extends Dream,
    TableName extends AssociationTableNames = T['table'] & AssociationTableNames,
    Table extends DB[keyof DB] = DB[TableName]
  >(): Updateable<Table> {
    const obj: Updateable<Table> = {}

    Object.keys(this.dirtyAttributes()).forEach(column => {
      ;(obj as any)[column] = (this.frozenAttributes as any)[column]
    })
    return obj
  }

  public freezeAttributes() {
    this.frozenAttributes = { ...this.attributes() }
  }

  public get associationMap() {
    return (this.constructor as typeof Dream).associationMap
  }

  public get associations() {
    return (this.constructor as typeof Dream).associations
  }

  public get associationNames() {
    return (this.constructor as typeof Dream).associationNames
  }

  public get table(): string {
    return (this.constructor as typeof Dream).table
  }

  public columns<
    T extends Dream,
    TableName extends keyof DB = T['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName]
  >(): (keyof Table)[] {
    return (this.constructor as typeof Dream).columns()
  }

  public async load<
    I extends Dream,
    TableName extends AssociationTableNames = I['table'] & AssociationTableNames,
    QueryAssociationExpression extends AssociationExpression<
      ConstructorType<I>['table'] & AssociationTableNames,
      any
    > = AssociationExpression<ConstructorType<I>['table'] & AssociationTableNames, any>
  >(this: I, ...associations: QueryAssociationExpression[]): Promise<void> {
    const base = this.constructor as ConstructorType<I>
    const query: Query<ConstructorType<I>> = new Query<ConstructorType<I>>(base)
    for (const association of associations) await query.applyIncludes(association, [this])
  }

  public async reload<
    I extends Dream,
    TableName extends AssociationTableNames = I['table'] & AssociationTableNames
  >(this: I) {
    const base = this.constructor as ConstructorType<I>
    const query: Query<ConstructorType<I>> = new Query<ConstructorType<I>>(base)
    query
      .bypassDefaultScopes()
      // @ts-ignore
      .where({ [base.primaryKey as any]: this[base.primaryKey] } as Updateable<Table>)

    // TODO: cleanup type chaos
    // @ts-ignore
    const newRecord = (await query.first()) as I
    this.setAttributes(newRecord.attributes())
    this.freezeAttributes()

    return this
  }

  public setAttributes<
    I extends Dream,
    TableName extends keyof DB = I['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName],
    BelongsToModelAssociationNames extends keyof SyncedBelongsToAssociations[TableName] = keyof SyncedBelongsToAssociations[TableName],
    AssociationModelParam = Partial<
      Record<
        BelongsToModelAssociationNames,
        ReturnType<I['associationMap'][keyof I['associationMap']]['modelCB']> extends () => (typeof Dream)[]
          ? InstanceType<
              ReturnType<
                I['associationMap'][keyof I['associationMap']]['modelCB'] & (() => (typeof Dream)[])
              >[number]
            >
          : InstanceType<
              ReturnType<I['associationMap'][keyof I['associationMap']]['modelCB'] & (() => typeof Dream)>
            >
      >
    >
  >(attributes: Updateable<Table> | AssociationModelParam) {
    const self = this as any
    Object.keys(attributes as any).forEach(attr => {
      const associationMetaData = this.associationMap[attr]

      if (associationMetaData) {
        const associatedObject = (attributes as any)[attr]
        self[attr] = associatedObject

        if (associationMetaData.type === 'BelongsTo') {
          self[associationMetaData.foreignKey()] = associatedObject.primaryKeyValue
          if (associationMetaData.polymorphic)
            self[associationMetaData.foreignKeyTypeField()] = associatedObject.constructor.name
        } else {
          throw new CanOnlyPassBelongsToModelParam(self.constructor, associationMetaData)
        }
      } else {
        // TODO: cleanup type chaos
        self[attr] = marshalDBValue((attributes as any)[attr])
      }
    })
  }

  public async save<T extends Dream, TableName extends keyof DB = T['table'] & keyof DB>(
    this: T
  ): Promise<T> {
    if (this.isPersisted) return await this.update()

    await runHooksFor('beforeSave', this)
    await runHooksFor('beforeCreate', this)

    await this.saveUnsavedAssociations()

    const sqlifiedAttributes = sqlAttributes(this.dirtyAttributes())

    let query = db.insertInto(this.table as TableName)
    if (Object.keys(sqlifiedAttributes).length) {
      query = query.values(sqlifiedAttributes as any)
    } else {
      query = query.values({ id: 0 } as any)
    }

    await runValidationsFor(this)
    if (this.isInvalid) throw new ValidationError(this.constructor.name, this.errors)

    const data = await query.returning(this.columns() as any).executeTakeFirstOrThrow()
    const base = this.constructor as typeof Dream

    // sets the id before reloading, since this is a new record
    // TODO: cleanup type chaos
    ;(this as any)[base.primaryKey as any] = data[base.primaryKey]

    await this.reload()

    await runHooksFor('afterSave', this)
    await runHooksFor('afterCreate', this)

    return this
  }

  public async saveUnsavedAssociations() {
    for (const associationName in this.associationMap) {
      const associationMetadata = this.associationMap[associationName]
      const associationRecord = (this as any)[associationName] as Dream | undefined
      if (associationRecord?.isDreamInstance && !associationRecord?.isPersisted) {
        await associationRecord.save()
        ;(this as any)[associationMetadata.foreignKey()] = associationRecord.primaryKeyValue
      }
    }
  }

  public async update<
    I extends Dream,
    TableName extends keyof DB = I['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName],
    BelongsToModelAssociationNames extends keyof SyncedBelongsToAssociations[TableName] = keyof SyncedBelongsToAssociations[TableName],
    AssociationModelParam = Partial<
      Record<
        BelongsToModelAssociationNames,
        ReturnType<I['associationMap'][keyof I['associationMap']]['modelCB']> extends () => (typeof Dream)[]
          ? InstanceType<
              ReturnType<
                I['associationMap'][keyof I['associationMap']]['modelCB'] & (() => (typeof Dream)[])
              >[number]
            >
          : InstanceType<
              ReturnType<I['associationMap'][keyof I['associationMap']]['modelCB'] & (() => typeof Dream)>
            >
      >
    >
  >(this: I, attributes?: Updateable<Table> | AssociationModelParam): Promise<I> {
    await runHooksFor('beforeSave', this)
    await runHooksFor('beforeUpdate', this)

    if (attributes) this.setAttributes(attributes)
    if (this.columns().includes('updated_at' as any)) {
      ;(this as any).updated_at = DateTime.now().toUTC()
    }

    await this.saveUnsavedAssociations()

    let query = db.updateTable(this.table as TableName)
    const sqlifiedAttributes = sqlAttributes(this.dirtyAttributes())

    if (Object.keys(sqlifiedAttributes).length === 0) return this
    query = query.set(sqlifiedAttributes as any)

    await runValidationsFor(this)

    await query.executeTakeFirstOrThrow()

    await this.reload()

    await runHooksFor('afterSave', this)
    await runHooksFor('afterUpdate', this)

    return this
  }

  public async destroy<I extends Dream, TableName extends keyof DB = I['table'] & keyof DB>(
    this: I
  ): Promise<I> {
    await runHooksFor('beforeDestroy', this)

    const base = this.constructor as typeof Dream
    await db
      .deleteFrom(this.table as TableName)
      .where(base.primaryKey as any, '=', (this as any)[base.primaryKey])
      .execute()

    await runHooksFor('afterDestroy', this)
    return this
  }
}

// DreamClass extends typeof Dream,
// TableName extends AssociationTableNames = DreamClass['table'] & AssociationTableNames,
// Table = DB[TableName],
// QueryAssociationExpression extends AssociationExpression<
//   TableName & AssociationTableNames,
//   any
// > = AssociationExpression<TableName & AssociationTableNames, any>
class Query<
  DreamClass extends typeof Dream,
  Table = DB[DreamClass['table']],
  QueryAssociationExpression = AssociationExpression<DreamClass['table'], any>
> {
  public whereStatement: WhereStatement<any> | null = null
  public whereJoinsStatement: JoinsWhereAssociationExpression<
    DreamClass['table'],
    AssociationExpression<DreamClass['table'], any>
  >[] = []
  public limitStatement: { count: number } | null = null
  public orStatements: Query<DreamClass>[] = []
  public orderStatement: { column: keyof DB[keyof DB] & string; direction: 'asc' | 'desc' } | null = null
  public includesStatements: AssociationExpression<DreamClass['table'], any>[] = []
  public joinsStatements: AssociationExpression<DreamClass['table'], any>[] = []
  public shouldBypassDefaultScopes: boolean = false
  public dreamClass: DreamClass

  constructor(DreamClass: DreamClass) {
    this.dreamClass = DreamClass
  }

  public bypassDefaultScopes() {
    this.shouldBypassDefaultScopes = true
    return this
  }

  public includes<
    T extends Query<DreamClass>,
    QueryAssociationExpression extends AssociationExpression<
      DreamClass['table'] & AssociationTableNames,
      any
    > = AssociationExpression<DreamClass['table'] & AssociationTableNames, any>
  >(this: T, ...args: QueryAssociationExpression[]) {
    this.includesStatements = [...(this.includesStatements as any), ...args]
    return this
  }

  public or(orStatement: Query<DreamClass>) {
    this.orStatements = [...this.orStatements, orStatement]
    return this
  }

  public joins<
    T extends Query<DreamClass>,
    QueryAssociationExpression extends AssociationExpression<
      DreamClass['table'],
      any
    > = AssociationExpression<DreamClass['table'], any>
  >(this: T, ...args: QueryAssociationExpression[]) {
    ;(this as any).joinsStatements = [...this.joinsStatements, ...args]
    return this
  }

  public where<T extends Query<DreamClass>>(
    this: T,
    attributes:
      | WhereStatement<DreamClass['table']>
      | JoinsWhereAssociationExpression<DreamClass['table'], T['joinsStatements'][number]>
  ) {
    if (attributes.constructor === Array) {
      // @ts-ignore
      this.whereJoinsStatement = [...(this.whereJoinsStatement as any), ...attributes]
    } else {
      Object.keys(attributes).forEach(key => {
        if (this.dreamClass.columns().includes(key as any)) {
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

  public nestedSelect<
    T extends Query<DreamClass>,
    SE extends SelectExpression<DB, ExtractTableAlias<DB, DreamClass['table']>>
  >(this: T, selection: SelectArg<DB, ExtractTableAlias<DB, DreamClass['table']>, SE>) {
    const query = this.buildSelect({ bypassSelectAll: true })
    return query.select(selection as any)
  }

  public order<ColumnName extends keyof Table & string>(
    column: ColumnName,
    direction: 'asc' | 'desc' = 'asc'
  ) {
    this.orderStatement = { column: column as any, direction }
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

  public async count<T extends Query<DreamClass>>(this: T) {
    const { count } = db.fn
    let query = this.buildSelect({ bypassSelectAll: true })

    query = query.select(
      count(`${this.dreamClass.table}.${this.dreamClass.primaryKey}` as any).as('tablecount')
    )
    const data = (await query.executeTakeFirstOrThrow()) as any

    return parseInt(data.tablecount.toString())
  }

  public async pluck<
    T extends Query<DreamClass>,
    SE extends SelectExpression<DB, ExtractTableAlias<DB, DreamClass['table']>>
  >(this: T, ...fields: SelectArg<DB, ExtractTableAlias<DB, DreamClass['table']>, SE>[]) {
    let query = this.buildSelect({ bypassSelectAll: true })
    fields.forEach(field => {
      query = query.select(field as any)
    })

    const vals = (await query.execute()).map(result => Object.values(result))

    if (fields.length > 1) {
      return vals.map(arr => arr.map(val => marshalDBValue(val)))
    } else {
      return vals.flat().map(val => marshalDBValue(val))
    }
  }

  public async all<T extends Query<DreamClass>>(this: T) {
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

    const theAll = results.map(r => new this.dreamClass(r as Updateable<Table>)) as InstanceType<DreamClass>[]
    await this.applyThisDotIncludes(theAll)
    return theAll
  }

  public async first<T extends Query<DreamClass>>(this: T) {
    if (!this.orderStatement) this.order(this.dreamClass.primaryKey as any, 'asc')

    const query = this.buildSelect()
    const results = await query.executeTakeFirst()

    if (results) {
      const theFirst = new this.dreamClass(results as any) as InstanceType<DreamClass>
      await this.applyThisDotIncludes([theFirst])
      return theFirst
    } else return null
  }

  public async applyThisDotIncludes<T extends Query<DreamClass>>(this: T, dreams: Dream[]) {
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
          })
      } else {
        dreams
          .filter(dream => (loadedAssociation as any)[association.foreignKey()] === dream.primaryKeyValue)
          .forEach((dream: any) => {
            if (association.type === 'HasMany') {
              dream[association.as] ||= []
              dream[association.as].push(loadedAssociation)
            } else {
              dream[association.as] = loadedAssociation
            }
          })
      }
    }

    if (association.type === 'HasMany') {
      dreams.forEach((dream: any) => {
        if (dream[association.as]) Object.freeze(dream[association.as])
      })
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
        if (association.type === 'HasMany') {
          Object.defineProperty(dream, association.as, {
            get() {
              return Object.freeze(
                ((dream as any)[association.through!] as any[]).flatMap(
                  record => (record as any)![association.as]
                )
              )
            },
          })
        } else {
          Object.defineProperty(dream, association.as, {
            get() {
              return (dream as any)[association.through!]![association.as]
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
        for (const associatedModel of association.modelCB() as (typeof Dream)[]) {
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
        const associatedModel = association.modelCB() as typeof Dream
        associationQuery = associatedModel.where({
          [associatedModel.primaryKey]: dreams.map(dream => (dream as any)[association.foreignKey()]),
        })

        this.hydrateAssociation(dreams, association, await associationQuery.all())
      }
    } else {
      const associatedModel = association.modelCB() as typeof Dream
      associationQuery = associatedModel.where({
        [association.foreignKey()]: dreams.map(dream => dream.primaryKeyValue),
      })

      if (association.polymorphic) {
        associationQuery = associationQuery.where({
          [association.foreignKeyTypeField()]: associatedModel.name,
        })
      }

      if (association.where) associationQuery = associationQuery.where(association.where)

      this.hydrateAssociation(dreams, association, await associationQuery.all())
    }

    return dreams.flatMap(dream => (dream as any)[association.as])
  }

  public async applyIncludes(includesStatement: QueryAssociationExpression, dream: Dream | Dream[]) {
    switch ((includesStatement as any).constructor) {
      case String:
        await this.applyOneInclude(includesStatement as string, dream)
        break
      case Array:
        for (const str of includesStatement as QueryAssociationExpression[]) {
          await this.applyIncludes(str, dream)
        }
        break
      default:
        for (const key of Object.keys(includesStatement as any)) {
          const nestedDream = await this.applyOneInclude(key, dream)
          if (nestedDream) {
            await this.applyIncludes((includesStatement as any)[key], nestedDream)
          }
        }
    }
  }

  public async last<T extends Query<DreamClass>>(this: T) {
    if (!this.orderStatement) this.order((this.dreamClass as typeof Dream).primaryKey as any, 'desc')

    const query = this.buildSelect()
    const results = await query.executeTakeFirst()

    if (results) {
      const theLast = new this.dreamClass(results) as InstanceType<DreamClass>
      await this.applyThisDotIncludes([theLast])
      return theLast
    } else return null
  }

  public async destroy<T extends Query<DreamClass>>(this: T): Promise<number> {
    const query = this.buildDelete()
    const selectQuery = this.buildSelect()
    const results = await selectQuery.execute()
    await query.execute()
    return results.length
  }

  public async destroyBy<T extends Query<DreamClass>>(this: T, attributes: Updateable<DreamClass['table']>) {
    this.where(attributes as any)
    const query = this.buildDelete()
    const selectQuery = this.buildSelect()
    const results = await selectQuery.execute()
    await query.execute()
    return results.length
  }

  public async update<T extends Query<DreamClass>>(this: T, attributes: Updateable<DreamClass['table']>) {
    const query = this.buildUpdate(attributes as any)
    await query.execute()

    const selectQuery = this.buildSelect()
    const results = await selectQuery.execute()

    return results.map(r => new this.dreamClass(r as any) as InstanceType<DreamClass>)
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
    let query = db.deleteFrom(this.dreamClass.table as DreamClass['table'])
    if (this.whereStatement) {
      Object.keys(this.whereStatement).forEach(attr => {
        query = query.where(attr as any, '=', (this.whereStatement as any)[attr])
      })
    }
    return query
  }

  public joinsBridgeThroughAssociations<T extends Query<DreamClass>>(
    this: T,
    {
      query,
      dreamClass,
      association,
      previousAssociationTableOrAlias,
    }: {
      query: SelectQueryBuilder<DB, ExtractTableAlias<DB, DreamClass['table']>, {}>
      dreamClass: typeof Dream
      association: HasOneStatement<any> | HasManyStatement<any> | BelongsToStatement<any>
      previousAssociationTableOrAlias: string
    }
  ): {
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, DreamClass['table']>, {}>
    dreamClass: typeof Dream
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

  public applyOneJoin<T extends Query<DreamClass>>(
    this: T,
    {
      query,
      dreamClass,
      previousAssociationTableOrAlias,
      currentAssociationTableOrAlias,
    }: {
      query: SelectQueryBuilder<DB, ExtractTableAlias<DB, DreamClass['table']>, {}>
      dreamClass: typeof Dream
      previousAssociationTableOrAlias: string
      currentAssociationTableOrAlias: string
    }
  ): {
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, DreamClass['table']>, {}>
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

    if (association.type === 'BelongsTo') {
      if (association.modelCB().constructor === Array)
        throw new CannotJoinPolymorphicBelongsToError({
          dreamClass,
          association,
          joinsStatements: this.joinsStatements,
        })

      const to = (association.modelCB() as typeof Dream).table
      const joinTableExpression =
        currentAssociationTableOrAlias === to
          ? currentAssociationTableOrAlias
          : `${to} as ${currentAssociationTableOrAlias as string}`

      // @ts-ignore
      query = query.innerJoin(
        // @ts-ignore
        joinTableExpression,
        `${previousAssociationTableOrAlias}.${association.foreignKey() as string}`,
        `${currentAssociationTableOrAlias as string}.${(association.modelCB() as typeof Dream).primaryKey}`
      )
    } else {
      const to = association.modelCB().table
      const joinTableExpression =
        currentAssociationTableOrAlias === to
          ? currentAssociationTableOrAlias
          : `${to} as ${currentAssociationTableOrAlias as string}`

      // @ts-ignore
      query = query.innerJoin(
        // @ts-ignore
        joinTableExpression,
        `${previousAssociationTableOrAlias}.${association.modelCB().primaryKey}`,
        `${currentAssociationTableOrAlias as string}.${association.foreignKey() as string}`
      )

      if (association.where) {
        const aliasedWhere: any = {}
        Object.keys(association.where).forEach((key: any) => {
          aliasedWhere[`${currentAssociationTableOrAlias as string}.${key}`] = (association as any).where[key]
        })
        query = this.applyWhereStatement(query, aliasedWhere as WhereStatement<DreamClass['table']>)
      }
    }

    return {
      query,
      association,
      previousAssociationTableOrAlias,
      currentAssociationTableOrAlias,
    }
  }

  public recursivelyJoin<T extends Query<DreamClass>, PreviousTableName extends AssociationTableNames>(
    this: T,
    {
      query,
      joinsStatement,
      dreamClass,
      previousAssociationTableOrAlias,
    }: {
      query: SelectQueryBuilder<DB, ExtractTableAlias<DB, DreamClass['table']>, {}>
      joinsStatement:
        | JoinsWhereAssociationExpression<PreviousTableName, AssociationExpression<PreviousTableName, any>>
        | Updateable<DB[PreviousTableName]>
      dreamClass: typeof Dream
      previousAssociationTableOrAlias: string
    }
  ): SelectQueryBuilder<DB, ExtractTableAlias<DB, DreamClass['table']>, {}> {
    if (joinsStatement.constructor === Array) {
      joinsStatement.forEach(oneJoinsStatement => {
        query = this.recursivelyJoin({
          query,
          joinsStatement: oneJoinsStatement,
          dreamClass,
          previousAssociationTableOrAlias,
        }) as SelectQueryBuilder<DB, ExtractTableAlias<DB, DreamClass['table']>, {}>
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

      query = this.recursivelyJoin({
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
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, DreamClass['table']>, {}>,
    whereStatement:
      | WhereStatement<DreamClass['table']>
      | JoinsWhereAssociationExpression<DreamClass['table'], T['joinsStatements'][number]>
  ) {
    Object.keys(whereStatement).forEach(attr => {
      const val = (whereStatement as any)[attr]

      if (val === null) {
        query = query.where(attr as any, 'is', val)
      } else if (val.constructor === SelectQueryBuilder) {
        query = query.where(attr as any, 'in', val)
      } else if (val.constructor === Array) {
        query = query.where(attr as any, 'in', val)
      } else if (val.constructor === OpsStatement) {
        query = query.where(attr as any, val.operator, val.value)
      } else if (val.constructor === Range && (val.begin?.constructor || val.end?.constructor) === DateTime) {
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
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, DreamClass['table']>, {}>,
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

  public buildSelect<T extends Query<DreamClass>>(
    this: T,
    { bypassSelectAll = false }: { bypassSelectAll?: boolean } = {}
  ): SelectQueryBuilder<DB, ExtractTableAlias<DB, DreamClass['table']>, {}> {
    this.conditionallyApplyScopes()

    let query = db.selectFrom(this.dreamClass.table as DreamClass['table'])
    if (!bypassSelectAll)
      query = query.selectAll(this.dreamClass.table as ExtractTableAlias<DB, DreamClass['table']>)

    if (this.joinsStatements.length) {
      query = this.recursivelyJoin({
        query,
        joinsStatement: this.joinsStatements as any,
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

    this.whereJoinsStatement.forEach(whereJoinsStatement => {
      query = this.recursivelyApplyJoinWhereStatement(query, whereJoinsStatement, '')
    })

    if (this.limitStatement) query = query.limit(this.limitStatement.count)
    if (this.orderStatement)
      query = query.orderBy(this.orderStatement.column as any, this.orderStatement.direction)

    return query
  }

  public buildUpdate(attributes: Updateable<Table>) {
    let query = db.updateTable(this.dreamClass.table as DreamClass['table']).set(attributes as any)
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
  dream.columns().forEach(column => {
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
  dream.columns().forEach(column => {
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

//   return Dream
// }

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

export interface AliasCondition<PreviousTableName extends AssociationTableNames> {
  conditionToExecute: boolean
  alias: keyof SyncedAssociations[PreviousTableName]
  column: keyof Updateable<DB[PreviousTableName]>
  columnValue: any
}

export type ConstructorType<T extends Dream> = (new (...arguments_: any[]) => T) & typeof Dream
