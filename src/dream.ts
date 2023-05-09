import { CompiledQuery, SelectArg, SelectExpression, SelectType, Updateable } from 'kysely'
import db from './db'
import { DB, DBColumns } from './sync/schema'
import { HasManyStatement } from './decorators/associations/has-many'
import { BelongsToStatement } from './decorators/associations/belongs-to'
import { HasOneStatement } from './decorators/associations/has-one'
import { ScopeStatement } from './decorators/scope'
import { HookStatement, blankHooksFactory } from './decorators/hooks/shared'
import ValidationStatement, { ValidationType } from './decorators/validations/shared'
import { ExtractTableAlias } from 'kysely/dist/cjs/parser/table-parser'
import { marshalDBValue } from './helpers/marshalDBValue'
import { SyncedBelongsToAssociations } from './sync/associations'
import {
  AssociatedModelParam,
  WhereStatement,
  blankAssociationsFactory,
} from './decorators/associations/shared'
import { AssociationTableNames, IdType } from './db/reflections'
import CanOnlyPassBelongsToModelParam from './exceptions/can-only-pass-belongs-to-model-param'
import { AssociationExpression, AssociationModelParam, DreamConstructorType } from './dream/types'
import Query from './dream/query'
import runHooksFor from './dream/internal/runHooksFor'
import checkValidationsFor from './dream/internal/checkValidationsFor'
import DreamTransaction from './dream/transaction'
import DreamClassTransactionBuilder from './dream/class-transaction-builder'
import safelyRunCommitHooks from './dream/internal/safelyRunCommitHooks'
import saveDream from './dream/internal/saveDream'
import DreamInstanceTransactionBuilder from './dream/instance-transaction-builder'
import pascalize from './helpers/pascalize'
import loadModels from './helpers/loadModels'
import getModelKey from './helpers/getModelKey'
import FailedToSaveDream from './exceptions/failed-to-save-dream'

export default class Dream {
  public static get primaryKey(): string {
    return 'id'
  }

  public static createdAtField = 'createdAt'

  public static associations: {
    belongsTo: BelongsToStatement<any>[]
    hasMany: HasManyStatement<any>[]
    hasOne: HasOneStatement<any>[]
  } = blankAssociationsFactory()

  public static scopes: {
    default: ScopeStatement[]
    named: ScopeStatement[]
  } = {
    default: [],
    named: [],
  }

  public static extendedBy: (typeof Dream)[] | null

  public static sti: {
    active: boolean
    value: string | null
  } = {
    active: false,
    value: null,
  }

  public static hooks: {
    beforeCreate: HookStatement[]
    beforeUpdate: HookStatement[]
    beforeSave: HookStatement[]
    beforeDestroy: HookStatement[]
    afterCreate: HookStatement[]
    afterCreateCommit: HookStatement[]
    afterUpdate: HookStatement[]
    afterUpdateCommit: HookStatement[]
    afterSave: HookStatement[]
    afterSaveCommit: HookStatement[]
    afterDestroy: HookStatement[]
    afterDestroyCommit: HookStatement[]
  } = blankHooksFactory()

  public static validations: ValidationStatement[] = []

  public static get isDream() {
    return true
  }

  public static async globalName<T extends typeof Dream>(this: T) {
    const modelKey = await getModelKey(this)
    return pascalize(modelKey!)
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
    opts?: Updateable<DB[InstanceType<T>['table']]> | AssociatedModelParam<T>
  ) {
    return (await new (this as any)(opts as any).save()) as InstanceType<T>
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
    TableName extends AssociationTableNames = InstanceType<T>['table'],
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

  public static nestedSelect<
    T extends typeof Dream,
    SE extends SelectExpression<DB, ExtractTableAlias<DB, InstanceType<T>['table']>>
  >(this: T, selection: SelectArg<DB, ExtractTableAlias<DB, InstanceType<T>['table']>, SE>) {
    let query: Query<T> = new Query<T>(this)
    return query.nestedSelect(selection as any)
  }

  public static order<
    T extends typeof Dream,
    ColumnName extends keyof Table & string,
    TableName extends AssociationTableNames = InstanceType<T>['table'],
    Table extends DB[keyof DB] = DB[TableName]
  >(this: T, column: ColumnName, direction: 'asc' | 'desc' = 'asc') {
    let query: Query<T> = new Query<T>(this)
    query = query.order(column as any, direction)
    return query
  }

  public static async pluck<
    T extends typeof Dream,
    SE extends SelectExpression<DB, ExtractTableAlias<DB, InstanceType<T>['table']>>,
    TableName extends AssociationTableNames = InstanceType<T>['table']
  >(this: T, ...fields: SelectArg<DB, ExtractTableAlias<DB, InstanceType<T>['table']>, SE>[]) {
    let query: Query<T> = new Query<T>(this)
    return await query.pluck(...(fields as any[]))
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

  public static txn<T extends typeof Dream>(this: T, txn: DreamTransaction): DreamClassTransactionBuilder<T> {
    return new DreamClassTransactionBuilder<T>(this, txn)
  }

  public static async transaction<T extends typeof Dream>(
    this: T,
    callback: (txn: DreamTransaction) => Promise<unknown>
  ) {
    const dreamTransaction = new DreamTransaction()

    const res = await db.transaction().execute(async kyselyTransaction => {
      dreamTransaction.kyselyTransaction = kyselyTransaction
      await (callback as (txn: DreamTransaction) => Promise<unknown>)(dreamTransaction)
    })

    await dreamTransaction.runAfterCommitHooks()

    return res
  }

  public static where<
    T extends typeof Dream,
    TableName extends AssociationTableNames = InstanceType<T>['table']
  >(this: T, attributes: WhereStatement<TableName>) {
    // @ts-ignore
    return new Query<T>(this).where(attributes)
  }

  public static whereNot<
    T extends typeof Dream,
    TableName extends AssociationTableNames = InstanceType<T>['table']
  >(this: T, attributes: WhereStatement<TableName>) {
    // @ts-ignore
    return new Query<T>(this).whereNot(attributes)
  }

  public static new<
    T extends typeof Dream,
    TableName extends AssociationTableNames = InstanceType<T>['table'],
    Table extends DB[keyof DB] = DB[TableName]
  >(this: T, opts?: Updateable<Table> | AssociatedModelParam<T>) {
    return new this(opts as any) as InstanceType<T>
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

  public get hasDirtyAttributes() {
    return !!Object.keys(this.dirtyAttributes()).length
  }

  public get hasUnsavedAssociations() {
    return !!this.unsavedAssociations.length
  }

  public get isDirty() {
    return this.hasDirtyAttributes || this.hasUnsavedAssociations
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
    this.errors = checkValidationsFor(this)
    return !Object.keys(this.errors).filter(key => !!this.errors[key].length).length
  }

  public get primaryKey() {
    return (this.constructor as typeof Dream).primaryKey
  }

  public get primaryKeyValue(): IdType {
    return (this as any)[this.primaryKey] || null
  }

  public get table(): AssociationTableNames {
    throw 'override table method in child'
  }

  public get unsavedAssociations(): (
    | BelongsToStatement<any>
    | HasOneStatement<any>
    | HasManyStatement<any>
  )[] {
    const unsaved: (BelongsToStatement<any> | HasOneStatement<any> | HasManyStatement<any>)[] = []
    for (const associationName in this.associationMap) {
      const associationMetadata = this.associationMap[associationName]
      const associationRecord = (this as any)[associationName] as Dream | undefined
      if (associationRecord?.isDreamInstance && associationRecord?.isDirty) {
        unsaved.push(associationMetadata)
      }
    }
    return unsaved
  }

  public errors: { [key: string]: ValidationType[] } = {}
  public frozenAttributes: { [key: string]: any } = {}
  private dreamTransaction: DreamTransaction | null = null

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

  public async destroy<I extends Dream, TableName extends keyof DB = I['table'] & keyof DB>(
    this: I
  ): Promise<I> {
    await runHooksFor('beforeDestroy', this)

    const Base = this.constructor as DreamConstructorType<I>

    await db
      .deleteFrom(this.table as TableName)
      .where(Base.primaryKey as any, '=', (this as any)[Base.primaryKey])
      .execute()

    await runHooksFor('afterDestroy', this)

    await safelyRunCommitHooks(this, 'afterDestroyCommit', null)

    return this
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

      if (associationMetaData && associationMetaData.type !== 'BelongsTo') {
        throw new CanOnlyPassBelongsToModelParam(self.constructor, associationMetaData)
      } else if (associationMetaData) {
        const associatedObject = (attributes as any)[attr]
        self[attr] = associatedObject

        self[associationMetaData.foreignKey()] = associatedObject.primaryKeyValue
        if (associationMetaData.polymorphic)
          self[associationMetaData.foreignKeyTypeField()] = associatedObject.constructor.name
      } else {
        // TODO: cleanup type chaos
        self[attr] = marshalDBValue((attributes as any)[attr])
      }
    })
  }

  public async save<I extends Dream>(this: I): Promise<I> {
    try {
      if (this.hasUnsavedAssociations) {
        await Dream.transaction(async txn => {
          await saveDream(this, txn)
        })
        return this
      } else {
        return await saveDream(this, null)
      }
    } catch (error) {
      throw new FailedToSaveDream(this.constructor as typeof Dream, error as Error)
    }
  }

  public txn<I extends Dream>(this: I, txn: DreamTransaction): DreamInstanceTransactionBuilder<I> {
    return new DreamInstanceTransactionBuilder<I>(this, txn)
  }

  public async update<
    I extends Dream,
    TableName extends keyof DB = I['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName],
    BelongsToModelAssociationNames extends keyof SyncedBelongsToAssociations[I['table']] = keyof SyncedBelongsToAssociations[I['table']],
    AssociatedModelParam extends AssociationModelParam<
      I,
      BelongsToModelAssociationNames
    > = AssociationModelParam<I, BelongsToModelAssociationNames>
  >(this: I, attributes: Updateable<Table> | AssociatedModelParam): Promise<I> {
    this.setAttributes(attributes)
    // call save rather than _save so that any unsaved associations in the
    // attributes are saved with this model in a transaction
    return await this.save()
  }
}
