import { CompiledQuery, SelectArg, SelectExpression, SelectType, Updateable } from 'kysely'
import { DateTime } from 'luxon'
import db from './db'
import { DB, DBColumns } from './sync/schema'
import { HasManyStatement } from './decorators/associations/has-many'
import { BelongsToStatement } from './decorators/associations/belongs-to'
import { HasOneStatement } from './decorators/associations/has-one'
import { ScopeStatement } from './decorators/scope'
import { HookStatement } from './decorators/hooks/shared'
import ValidationStatement, { ValidationType } from './decorators/validations/shared'
import { ExtractTableAlias } from 'kysely/dist/cjs/parser/table-parser'
import { marshalDBValue } from './helpers/marshalDBValue'
import sqlAttributes from './helpers/sqlAttributes'
import ValidationError from './exceptions/validation-error'
import { SyncedBelongsToAssociations } from './sync/associations'
import { WhereStatement } from './decorators/associations/shared'
import { AssociationTableNames } from './db/reflections'
import CanOnlyPassBelongsToModelParam from './exceptions/can-only-pass-belongs-to-model-param'
import { AssociationExpression, DreamConstructorType } from './dream/types'
import Query from './dream/query'
import runHooksFor from './dream/internal/runHooksFor'
import runValidationsFor from './dream/internal/runValidationsFor'
import checkValidationsFor from './dream/internal/checkValidationsFor'

export default class Dream {
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

  public static columns<
    T extends typeof Dream,
    TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName]
  >(): (keyof Table)[] {
    return (DBColumns as any)[this.prototype.table]
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
    TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName],
    IdColumn = T['primaryKey'] & keyof Table
  >(this: T): Promise<InstanceType<T>[]> {
    const query: Query<T> = new Query<T>(this)
    return await query.all()
  }

  public static async count<T extends typeof Dream>(this: T): Promise<number> {
    const query: Query<T> = new Query<T>(this)
    return await query.count()
  }

  public static async create<T extends typeof Dream>(
    this: T,
    opts?:
      | Updateable<DB[InstanceType<T>['table']]>
      | Partial<
          Record<
            keyof SyncedBelongsToAssociations[InstanceType<T>['table']],
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
    TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName]
  >(this: T, opts?: Updateable<Table>) {
    const query: Query<T> = new Query<T>(this)
    return await query.destroyBy(opts as any)
  }

  public static async find<
    T extends typeof Dream,
    TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName],
    IdColumn = T['primaryKey'] & keyof Table,
    Id = Readonly<SelectType<IdColumn>>
  >(this: T, id: Id): Promise<(InstanceType<T> & Dream) | null> {
    const query: Query<T> = new Query<T>(this)
    return (await query.where({ [this.primaryKey]: id } as any).first()) as (InstanceType<T> & Dream) | null
  }

  public static async findBy<
    T extends typeof Dream,
    TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName],
    IdColumn = T['primaryKey'] & keyof Table
  >(
    this: T,
    attributes: Updateable<DB[InstanceType<T>['table']]>
  ): Promise<(InstanceType<T> & Dream) | null> {
    const query: Query<T> = new Query<T>(this)
    return (await query.where(attributes as any).first()) as (InstanceType<T> & Dream) | null
  }

  public static async first<T extends typeof Dream>(this: T): Promise<InstanceType<T> | null> {
    const query: Query<T> = new Query<T>(this)
    return (await query.first()) as (InstanceType<T> & Dream) | null
  }

  public static includes<
    T extends typeof Dream,
    TableName extends AssociationTableNames = InstanceType<T>['table'] & AssociationTableNames,
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
    QueryAssociationExpression extends AssociationExpression<
      InstanceType<T>['table'],
      any
    > = AssociationExpression<InstanceType<T>['table'], any>
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
    TableName extends AssociationTableNames = InstanceType<T>['table'] & AssociationTableNames,
    Table extends DB[keyof DB] = DB[TableName]
  >(this: T, column: ColumnName, direction: 'asc' | 'desc' = 'asc') {
    let query: Query<T> = new Query<T>(this)
    query = query.order(column as any, direction)
    return query
  }

  public static async pluck<
    T extends typeof Dream,
    SE extends SelectExpression<DB, ExtractTableAlias<DB, InstanceType<T>['table'] & AssociationTableNames>>,
    TableName extends AssociationTableNames = InstanceType<T>['table'] & AssociationTableNames
  >(
    this: T,
    ...fields: SelectArg<DB, ExtractTableAlias<DB, InstanceType<T>['table'] & AssociationTableNames>, SE>[]
  ) {
    let query: Query<T> = new Query<T>(this)
    return await query.pluck(...(fields as any[]))
  }

  public static nestedSelect<
    T extends typeof Dream,
    SE extends SelectExpression<DB, ExtractTableAlias<DB, InstanceType<T>['table'] & AssociationTableNames>>,
    TableName extends AssociationTableNames = InstanceType<T>['table'] & AssociationTableNames
  >(
    this: T,
    selection: SelectArg<DB, ExtractTableAlias<DB, InstanceType<T>['table'] & AssociationTableNames>, SE>
  ) {
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
    TableName extends AssociationTableNames = InstanceType<T>['table'] & AssociationTableNames
  >(this: T, attributes: WhereStatement<TableName>) {
    const query: Query<T> = new Query<T>(this)
    // @ts-ignore
    query.where(attributes)
    return query
  }

  public static new<
    T extends typeof Dream,
    TableName extends AssociationTableNames = InstanceType<T>['table'] & AssociationTableNames,
    Table extends DB[keyof DB] = DB[TableName]
  >(this: T, opts?: Updateable<Table>) {
    return new this(opts) as InstanceType<T>
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

  public get isDirty() {
    return !!Object.keys(this.dirtyAttributes()).length
  }

  public get isDreamInstance() {
    return true
  }

  public get isInvalid(): boolean {
    return !this.isValid
  }

  public get isPersisted() {
    // todo: clean up types here
    return !!(this as any)[this.primaryKey]
  }

  public get isValid(): boolean {
    const validationErrors = checkValidationsFor(this)
    return !Object.keys(validationErrors).filter(key => !!validationErrors[key].length).length
  }

  public get primaryKey() {
    return (this.constructor as typeof Dream).primaryKey
  }

  public get primaryKeyValue(): string | number | null {
    return (this as any)[this.primaryKey] || null
  }

  public get table(): AssociationTableNames {
    throw 'override table method in child'
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

  public attributes<I extends Dream>(this: I): Updateable<DB[I['table']]> {
    const obj: Updateable<DB[I['table']]> = {}
    ;(this.constructor as typeof Dream).columns().forEach(column => {
      ;(obj as any)[column] = (this as any)[column]
    })
    return obj
  }

  public dirtyAttributes<
    I extends Dream,
    TableName extends AssociationTableNames = I['table'] & AssociationTableNames,
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
    I extends Dream,
    TableName extends AssociationTableNames = I['table'] & AssociationTableNames,
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

  public columns<
    I extends Dream,
    TableName extends keyof DB = I['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName]
  >(): (keyof Table)[] {
    return (this.constructor as typeof Dream).columns()
  }

  public async load<
    I extends Dream,
    QueryAssociationExpression extends AssociationExpression<I['table'], any> = AssociationExpression<
      I['table'],
      any
    >
  >(this: I, ...associations: QueryAssociationExpression[]): Promise<void> {
    const base = this.constructor as DreamConstructorType<I>
    const query: Query<DreamConstructorType<I>> = new Query<DreamConstructorType<I>>(base)
    for (const association of associations) await query.applyIncludes(association as any, [this])
  }

  public async reload<I extends Dream>(this: I) {
    const base = this.constructor as DreamConstructorType<I>
    const query: Query<DreamConstructorType<I>> = new Query<DreamConstructorType<I>>(base)
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

  public async save<I extends Dream>(this: I): Promise<I> {
    runValidationsFor(this)
    if (this.isInvalid) throw new ValidationError(this.constructor.name, this.errors)

    const alreadyPersisted = this.isPersisted

    await runHooksFor('beforeSave', this)
    if (alreadyPersisted) await runHooksFor('beforeUpdate', this)
    else await runHooksFor('beforeCreate', this)

    await this.saveUnsavedAssociations()

    const sqlifiedAttributes = sqlAttributes(this.dirtyAttributes())
    const hasChanges = !!Object.keys(sqlifiedAttributes).length
    if (alreadyPersisted && !hasChanges) return this

    let query: any

    if (alreadyPersisted) {
      if (this.columns().includes('updated_at' as any)) {
        ;(this as any).updated_at = DateTime.now().toUTC()
      }
      query = db.updateTable(this.table).set(sqlifiedAttributes as any)
    } else {
      query = db.insertInto(this.table)
      if (hasChanges) {
        query = query.values(sqlifiedAttributes as any)
      } else {
        // TODO: this is an attempt to allow saving of empty models (assuming validation passes)
        query = query.values({ id: 0 } as any)
      }
    }

    if (alreadyPersisted) {
      await query.executeTakeFirstOrThrow()
    } else {
      const data = await query.returning(this.columns()).executeTakeFirstOrThrow()
      this.setAttributes(data)
    }

    // set frozen attributes to what has already been saved
    this.freezeAttributes()

    await runHooksFor('afterSave', this)
    if (alreadyPersisted) await runHooksFor('afterUpdate', this)
    else await runHooksFor('afterCreate', this)

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
    if (!attributes) return this
    this.setAttributes(attributes)
    return await this.save()
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
