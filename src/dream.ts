import { DateTime } from 'luxon'
import {
  CompiledQuery,
  DeleteQueryBuilder,
  InsertQueryBuilder,
  SelectQueryBuilder,
  Updateable,
  UpdateQueryBuilder,
} from 'kysely'

import db from './db'
import HasMany, { HasManyOptions, HasManyStatement } from './decorators/associations/has-many'
import BelongsTo, { BelongsToOptions, BelongsToStatement } from './decorators/associations/belongs-to'
import HasOne, { HasOneOptions, HasOneStatement } from './decorators/associations/has-one'
import { ScopeStatement } from './decorators/scope'
import { HookStatement, blankHooksFactory, BeforeHookOpts, AfterHookOpts } from './decorators/hooks/shared'
import BeforeCreate from './decorators/hooks/before-create'
import BeforeSave from './decorators/hooks/before-save'
import BeforeUpdate from './decorators/hooks/before-update'
import BeforeDestroy from './decorators/hooks/before-destroy'
import AfterCreate from './decorators/hooks/after-create'
import AfterCreateCommit from './decorators/hooks/after-create-commit'
import AfterSave from './decorators/hooks/after-save'
import AfterSaveCommit from './decorators/hooks/after-save-commit'
import AfterUpdate from './decorators/hooks/after-update'
import AfterUpdateCommit from './decorators/hooks/after-update-commit'
import AfterDestroy from './decorators/hooks/after-destroy'
import AfterDestroyCommit from './decorators/hooks/after-destroy-commit'
import ValidationStatement, { ValidationType } from './decorators/validations/shared'
import { PassthroughWhere, WhereStatement, blankAssociationsFactory } from './decorators/associations/shared'
import { AssociationTableNames } from './db/reflections'
import {
  DreamConstructorType,
  IdType,
  NextPreloadArgumentType,
  UpdateablePropertiesForClass,
  UpdateableProperties,
  AttributeKeys,
  UpdateableAssociationProperties,
  DreamColumnNames,
  OrderDir,
  VariadicPluckThroughArgs,
  VariadicPluckEachThroughArgs,
  VariadicJoinsArgs,
  VariadicLoadArgs,
  DreamBelongsToAssociationMetadata,
  DreamAttributes,
  TableColumnNames,
  DreamParamSafeColumnNames,
} from './dream/types'
import Query, { FindEachOpts } from './dream/query'
import runValidations from './dream/internal/runValidations'
import DreamTransaction from './dream/transaction'
import DreamClassTransactionBuilder from './dream/class-transaction-builder'
import saveDream from './dream/internal/saveDream'
import DreamInstanceTransactionBuilder from './dream/instance-transaction-builder'
import pascalize from './helpers/pascalize'
import getModelKey from './helpers/getModelKey'
import { VirtualAttributeStatement } from './decorators/virtual'
import cachedTypeForAttribute from './helpers/db/cachedTypeForAttribute'
import DreamSerializer from './serializer'
import MissingSerializer from './exceptions/missing-serializer'
import MissingTable from './exceptions/missing-table'
import associationQuery from './dream/internal/associations/associationQuery'
import associationUpdateQuery from './dream/internal/associations/associationUpdateQuery'
import createAssociation from './dream/internal/associations/createAssociation'
import reload from './dream/internal/reload'
import destroyDream from './dream/internal/destroyDream'
import destroyAssociation from './dream/internal/associations/destroyAssociation'
import { DatabaseError } from 'pg'
import LoadBuilder from './dream/load-builder'
import { DbConnectionType } from './db/types'
import MissingDB from './exceptions/missing-db'
import Dreamconf from './helpers/dreamconf'
import resortAllRecords from './decorators/sortable/helpers/resortAllRecords'
import Sortable, { SortableFieldConfig } from './decorators/sortable'
import NonExistentScopeProvidedToResort from './exceptions/non-existent-scope-provided-to-resort'
import cloneDeepSafe from './helpers/cloneDeepSafe'
import NonLoadedAssociation from './exceptions/associations/non-loaded-association'
import associationToGetterSetterProp from './decorators/associations/associationToGetterSetterProp'
import { isString } from './helpers/typechecks'
import CreateOrFindByFailedToCreateAndFind from './exceptions/create-or-find-by-failed-to-create-and-find'
import CanOnlyPassBelongsToModelParam from './exceptions/associations/can-only-pass-belongs-to-model-param'
import CannotPassNullOrUndefinedToRequiredBelongsTo from './exceptions/associations/cannot-pass-null-or-undefined-to-required-belongs-to'
import { marshalDBValue } from './helpers/marshalDBValue'
import isJsonColumn from './helpers/db/types/isJsonColumn'
import CalendarDate from './helpers/CalendarDate'

export default class Dream {
  public static get primaryKey() {
    return this.prototype.primaryKey
  }

  public static get table() {
    return this.prototype.table
  }

  public get createdAtField() {
    return 'createdAt' as const
  }

  public get updatedAtField() {
    return 'updatedAt' as const
  }

  public get deletedAtField() {
    return 'deletedAt' as const
  }

  protected static associations: {
    belongsTo: BelongsToStatement<any, any, any, any>[]
    hasMany: HasManyStatement<any, any, any, any>[]
    hasOne: HasOneStatement<any, any, any, any>[]
  } = blankAssociationsFactory(this)

  protected static scopes: {
    default: ScopeStatement[]
    named: ScopeStatement[]
  } = {
    default: [],
    named: [],
  }

  protected static virtualAttributes: VirtualAttributeStatement[] = []
  protected static sortableFields: SortableFieldConfig[] = []

  protected static extendedBy: (typeof Dream)[] | null = null

  protected static sti: {
    active: boolean
    baseClass: typeof Dream | null
    value: string | null
  } = {
    active: false,
    baseClass: null,
    value: null,
  }

  protected static hooks: {
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
  } = blankHooksFactory(this)

  protected static validations: ValidationStatement[] = []
  protected static customValidations: string[] = []
  protected static replicaSafe = false

  public static get isDream() {
    return true
  }

  protected static get isSTIBase() {
    return !!this.extendedBy?.length && !this.isSTIChild
  }

  protected static get isSTIChild() {
    return !!this.sti?.active
  }

  protected static get stiBaseClassOrOwnClass(): typeof Dream {
    return this.sti.baseClass || this
  }

  protected get stiBaseClassOrOwnClass(): typeof Dream {
    return (this.constructor as typeof Dream).stiBaseClassOrOwnClass
  }

  protected static addHook(hookType: keyof typeof this.hooks, statement: HookStatement) {
    const existingHook = this.hooks[hookType].find(hook => hook.method === statement.method)
    if (existingHook) return

    this.hooks[hookType] = [...this.hooks[hookType], statement]
  }

  public static HasMany<T extends typeof Dream, AssociationDreamClass extends typeof Dream = typeof Dream>(
    this: T,
    modelCB: () => AssociationDreamClass,
    options: HasManyOptions<InstanceType<T>, AssociationDreamClass> = {}
  ) {
    return HasMany<InstanceType<T>, AssociationDreamClass>(modelCB, options)
  }

  public static BelongsTo<T extends typeof Dream, AssociationDreamClass extends typeof Dream = typeof Dream>(
    this: T,
    modelCB: () => AssociationDreamClass,
    options: BelongsToOptions<InstanceType<T>, AssociationDreamClass> = {}
  ) {
    return BelongsTo<InstanceType<T>, AssociationDreamClass>(modelCB, options)
  }

  public static HasOne<T extends typeof Dream, AssociationDreamClass extends typeof Dream = typeof Dream>(
    this: T,
    modelCB: () => AssociationDreamClass,
    options: HasOneOptions<InstanceType<T>, AssociationDreamClass> = {}
  ) {
    return HasOne<InstanceType<T>, AssociationDreamClass>(modelCB, options)
  }

  public static Sortable<T extends typeof Dream>(
    this: T,
    {
      scope,
    }: {
      scope:
        | keyof DreamBelongsToAssociationMetadata<InstanceType<T>>
        | DreamColumnNames<InstanceType<T>>
        | (keyof DreamBelongsToAssociationMetadata<InstanceType<T>> | DreamColumnNames<InstanceType<T>>)[]
    }
  ) {
    return Sortable({ scope: scope as any })
  }

  public static BeforeCreate<T extends typeof Dream>(this: T, opts: BeforeHookOpts<InstanceType<T>>) {
    return BeforeCreate<InstanceType<T>>(opts)
  }

  public static BeforeSave<T extends typeof Dream>(this: T, opts: BeforeHookOpts<InstanceType<T>>) {
    return BeforeSave<InstanceType<T>>(opts)
  }

  public static BeforeUpdate<T extends typeof Dream>(this: T, opts: BeforeHookOpts<InstanceType<T>>) {
    return BeforeUpdate<InstanceType<T>>(opts)
  }

  public static BeforeDestroy<T extends typeof Dream>(this: T) {
    return BeforeDestroy()
  }

  public static AfterCreate<T extends typeof Dream>(this: T, opts: AfterHookOpts<InstanceType<T>>) {
    return AfterCreate<InstanceType<T>>(opts)
  }

  public static AfterCreateCommit<T extends typeof Dream>(this: T, opts: AfterHookOpts<InstanceType<T>>) {
    return AfterCreateCommit<InstanceType<T>>(opts)
  }

  public static AfterSave<T extends typeof Dream>(this: T, opts: AfterHookOpts<InstanceType<T>>) {
    return AfterSave<InstanceType<T>>(opts)
  }

  public static AfterSaveCommit<T extends typeof Dream>(this: T, opts: AfterHookOpts<InstanceType<T>>) {
    return AfterSaveCommit<InstanceType<T>>(opts)
  }

  public static AfterUpdate<T extends typeof Dream>(this: T, opts: AfterHookOpts<InstanceType<T>>) {
    return AfterUpdate<InstanceType<T>>(opts)
  }

  public static AfterUpdateCommit<T extends typeof Dream>(this: T, opts: AfterHookOpts<InstanceType<T>>) {
    return AfterUpdateCommit<InstanceType<T>>(opts)
  }

  public static AfterDestroy<T extends typeof Dream>(this: T) {
    return AfterDestroy()
  }

  public static AfterDestroyCommit<T extends typeof Dream>(this: T) {
    return AfterDestroyCommit()
  }

  public static async globalName<T extends typeof Dream>(this: T): Promise<string | undefined> {
    const modelKey = await getModelKey(this)
    return pascalize(modelKey)?.replace(/\//g, '')
  }

  public static columns<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName],
  >(): Set<keyof Table & string> {
    const columns = this.prototype.dreamconf.schema[this.table]?.columns
    return new Set(columns ? Object.keys(columns) : [])
  }

  public static paramSafeColumns<T extends typeof Dream, I extends InstanceType<T>>(
    this: T
  ): Set<DreamParamSafeColumnNames<I>> {
    const columns: DreamParamSafeColumnNames<I>[] = [...this.columns()].filter(column => {
      if (this.prototype.primaryKey === column) return false
      if (
        [
          this.prototype.createdAtField,
          this.prototype.updatedAtField,
          this.prototype.deletedAtField,
        ].includes(column as any)
      )
        return false
      if (this.isBelongsToAssociationForeignKey(column)) return false
      if (this.isBelongsToAssociationPolymorphicTypeField(column)) return false
      if (this.sti.active && column === 'type') return false
      return true
    }) as DreamParamSafeColumnNames<I>[]

    return new Set([...columns, ...this.virtualAttributes.map(attr => attr.property)]) as Set<
      DreamParamSafeColumnNames<I>
    >
  }

  public static isVirtualColumn<T extends typeof Dream>(this: T, columnName: string): boolean {
    return this.prototype.isVirtualColumn(columnName)
  }

  public static getAssociation<
    T extends typeof Dream,
    I extends InstanceType<T>,
    Schema extends I['dreamconf']['schema'],
  >(this: T, associationName: Schema[I['table']]['associations'][number]) {
    return this.associationMap()[associationName]
  }

  public static associationMap<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    Schema extends I['dreamconf']['schema'],
  >(this: T) {
    const allAssociations = [
      ...this.associations.belongsTo,
      ...this.associations.hasOne,
      ...this.associations.hasMany,
    ]

    const map = {} as {
      [key: (typeof allAssociations)[number]['as']]:
        | BelongsToStatement<any, DB, Schema, AssociationTableNames<DB, Schema> & keyof DB>
        | HasManyStatement<any, DB, Schema, AssociationTableNames<DB, Schema> & keyof DB>
        | HasOneStatement<any, DB, Schema, AssociationTableNames<DB, Schema> & keyof DB>
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

  public static unscoped<T extends typeof Dream>(this: T): Query<InstanceType<T>> {
    return this.query().unscoped()
  }

  public static async all<T extends typeof Dream>(this: T): Promise<InstanceType<T>[]> {
    return await this.query().all()
  }

  protected static connection<T extends typeof Dream>(
    this: T,
    connection: DbConnectionType
  ): Query<InstanceType<T>> {
    return new Query<InstanceType<T>>(this.prototype as InstanceType<T>, {
      connection,
    })
  }

  public static async count<T extends typeof Dream>(this: T): Promise<number> {
    return await this.query().count()
  }

  public static async max<T extends typeof Dream>(
    this: T,
    field: DreamColumnNames<InstanceType<T>>
  ): Promise<number> {
    return await this.query().max(field as any)
  }

  public static async min<T extends typeof Dream>(
    this: T,
    field: DreamColumnNames<InstanceType<T>>
  ): Promise<number> {
    return await this.query().min(field as any)
  }

  public static async create<T extends typeof Dream>(this: T, opts?: UpdateablePropertiesForClass<T>) {
    return (await new (this as any)(opts as any).save()) as InstanceType<T>
  }

  public static async createOrFindBy<T extends typeof Dream>(
    this: T,
    opts: UpdateablePropertiesForClass<T>,
    extraOpts: CreateOrFindByExtraOps<T> = {}
  ): Promise<InstanceType<T> | null> {
    let record: InstanceType<T>
    try {
      record = await new (this as any)({
        ...opts,
        ...(extraOpts?.createWith || {}),
      }).save()
      return record
    } catch (err) {
      if (
        err instanceof DatabaseError &&
        err.message.includes('duplicate key value violates unique constraint')
      ) {
        const dreamModel = await this.findBy(this.extractAttributesFromUpdateableProperties(opts))
        if (!dreamModel) throw new CreateOrFindByFailedToCreateAndFind(this)
        return dreamModel
      }
      throw err
    }
  }

  public static distinct<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    TableName extends InstanceType<T>['table'],
  >(this: T, columnName?: TableColumnNames<DB, TableName> | null | boolean) {
    return this.query().distinct(columnName as any)
  }

  public static async find<
    T extends typeof Dream,
    I extends InstanceType<T>,
    Schema extends I['dreamconf']['schema'],
    SchemaIdType = Schema[InstanceType<T>['table']]['columns'][I['primaryKey']]['coercedType'],
  >(this: T, id: SchemaIdType): Promise<InstanceType<T> | null> {
    return await this.query().find(id)
  }

  public static async findEach<T extends typeof Dream>(
    this: T,
    cb: (instance: InstanceType<T>) => void | Promise<void>,
    opts?: FindEachOpts
  ): Promise<void> {
    await this.query().findEach(cb, opts)
  }

  public static async loadInto<
    T extends typeof Dream,
    I extends InstanceType<T>,
    TableName extends I['table'],
    Schema extends I['dreamconf']['schema'],
    const Arr extends readonly unknown[],
  >(this: T, models: Dream[], ...args: [...Arr, VariadicLoadArgs<Schema, TableName, Arr>]) {
    await this.query().loadInto(models, ...(args as any))
  }

  public static query<T extends typeof Dream, I extends InstanceType<T>>(this: T): Query<I> {
    return new Query(this.prototype as I)
  }

  public static async findBy<T extends typeof Dream, I extends InstanceType<T>>(
    this: T,
    attributes: WhereStatement<I['DB'], I['dreamconf']['schema'], I['table']>
  ): Promise<InstanceType<T> | null> {
    return await this.query().findBy(attributes)
  }

  public static async findOrCreateBy<T extends typeof Dream>(
    this: T,
    opts: UpdateablePropertiesForClass<T>,
    extraOpts: CreateOrFindByExtraOps<T> = {}
  ) {
    const existingRecord = await this.findBy(this.extractAttributesFromUpdateableProperties(opts))
    if (existingRecord) return existingRecord

    return (await new (this as any)({
      ...opts,
      ...(extraOpts?.createWith || {}),
    }).save()) as InstanceType<T>
  }

  public static async first<T extends typeof Dream>(this: T): Promise<InstanceType<T> | null> {
    return await this.query().first()
  }

  public static async exists<T extends typeof Dream>(this: T): Promise<boolean> {
    return await this.query().exists()
  }

  public static preload<
    T extends typeof Dream,
    I extends InstanceType<T>,
    Schema extends I['dreamconf']['schema'],
    TableName extends InstanceType<T>['table'],
    const Arr extends readonly unknown[],
  >(this: T, ...args: [...Arr, VariadicLoadArgs<Schema, TableName, Arr>]) {
    return this.query().preload(...(args as any))
  }

  public static joins<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    Schema extends I['dreamconf']['schema'],
    TableName extends I['table'] & keyof Schema,
    const Arr extends readonly unknown[],
  >(this: T, ...args: [...Arr, VariadicJoinsArgs<DB, Schema, TableName, Arr>]) {
    return this.query().joins(...(args as any))
  }

  public static async pluckThrough<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    Schema extends I['dreamconf']['schema'],
    TableName extends I['table'],
    const Arr extends readonly unknown[],
  >(this: T, ...args: [...Arr, VariadicPluckThroughArgs<DB, Schema, TableName, Arr>]): Promise<any[]> {
    return await this.query().pluckThrough(...(args as any))
  }

  public static async pluckEachThrough<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    Schema extends I['dreamconf']['schema'],
    TableName extends I['table'],
    const Arr extends readonly unknown[],
  >(this: T, ...args: [...Arr, VariadicPluckEachThroughArgs<DB, Schema, TableName, Arr>]): Promise<void> {
    await this.query().pluckEachThrough(...(args as any))
  }

  public static async last<T extends typeof Dream>(this: T): Promise<InstanceType<T> | null> {
    return await this.query().last()
  }

  public static limit<T extends typeof Dream>(this: T, count: number | null) {
    return this.query().limit(count)
  }

  public static offset<T extends typeof Dream>(this: T, offset: number | null) {
    return this.query().offset(offset)
  }

  public static nestedSelect<T extends typeof Dream>(this: T, selection: DreamColumnNames<InstanceType<T>>) {
    return this.query().nestedSelect(selection as any)
  }

  public static order<T extends typeof Dream, I extends InstanceType<T>>(
    this: T,
    arg: DreamColumnNames<I> | Partial<Record<DreamColumnNames<I>, OrderDir>> | null
  ): Query<InstanceType<T>> {
    return this.query().order(arg as any)
  }

  public static async pluck<T extends typeof Dream>(this: T, ...fields: DreamColumnNames<InstanceType<T>>[]) {
    return await this.query().pluck(...(fields as any[]))
  }

  public static async pluckEach<T extends typeof Dream, CB extends (plucked: any) => void | Promise<void>>(
    this: T,
    ...fields: (DreamColumnNames<InstanceType<T>> | CB | FindEachOpts)[]
  ) {
    return await this.query().pluckEach(...(fields as any))
  }

  public static async resort<T extends typeof Dream>(
    this: T,
    ...fields: DreamColumnNames<InstanceType<T>>[]
  ) {
    for (const field of fields) {
      const sortableMetadata = this.sortableFields.find(conf => conf.positionField === field)
      if (!sortableMetadata) throw new NonExistentScopeProvidedToResort(fields as string[], this)
      await resortAllRecords(this, field, sortableMetadata.scope)
    }
  }

  public static scope<T extends typeof Dream>(this: T, scopeName: string) {
    return (this as any)[scopeName](this.query()) as Query<InstanceType<T>>
  }

  public static sql<T extends typeof Dream>(this: T): CompiledQuery<object> {
    return this.query().sql()
  }

  public static toKysely<
    T extends typeof Dream,
    QueryType extends 'select' | 'delete' | 'update' | 'insert',
    ToKyselyReturnType = QueryType extends 'select'
      ? SelectQueryBuilder<InstanceType<T>['DB'], InstanceType<T>['table'], any>
      : QueryType extends 'delete'
        ? DeleteQueryBuilder<InstanceType<T>['DB'], InstanceType<T>['table'], any>
        : QueryType extends 'update'
          ? UpdateQueryBuilder<InstanceType<T>['DB'], InstanceType<T>['table'], InstanceType<T>['table'], any>
          : QueryType extends 'insert'
            ? InsertQueryBuilder<InstanceType<T>['DB'], InstanceType<T>['table'], any>
            : never,
  >(this: T, type: QueryType) {
    switch (type) {
      case 'select':
        return this.query().dbFor('select').selectFrom(this.table) as ToKyselyReturnType

      case 'delete':
        return this.query().dbFor('delete').deleteFrom(this.table) as ToKyselyReturnType

      case 'update':
        return this.query().dbFor('update').updateTable(this.table) as ToKyselyReturnType

      case 'insert':
        return this.query().dbFor('insert').insertInto(this.table) as ToKyselyReturnType

      default:
        throw new Error('never')
    }
  }

  public static txn<T extends typeof Dream, I extends InstanceType<T>>(
    this: T,
    txn: DreamTransaction<I>
  ): DreamClassTransactionBuilder<I> {
    return new DreamClassTransactionBuilder<I>(this.prototype as I, txn)
  }

  public static async transaction<T extends typeof Dream>(
    this: T,
    callback: (txn: DreamTransaction<InstanceType<T>>) => unknown
  ) {
    const dreamTransaction = new DreamTransaction()

    const res = await db('primary', this.prototype.dreamconf)
      .transaction()
      .execute(async kyselyTransaction => {
        dreamTransaction.kyselyTransaction = kyselyTransaction
        await (callback as (txn: DreamTransaction<InstanceType<T>>) => Promise<unknown>)(dreamTransaction)
      })

    await dreamTransaction.runAfterCommitHooks(dreamTransaction)

    return res
  }

  public static passthrough<
    T extends typeof Dream,
    I extends InstanceType<T>,
    AllColumns extends I['allColumns'],
  >(this: T, passthroughWhereStatement: PassthroughWhere<AllColumns>): Query<InstanceType<T>> {
    return this.query().passthrough(passthroughWhereStatement)
  }

  public static where<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    Schema extends I['dreamconf']['schema'],
    TableName extends AssociationTableNames<DB, Schema> & keyof DB = InstanceType<T>['table'],
  >(this: T, attributes: WhereStatement<DB, Schema, TableName>): Query<InstanceType<T>> {
    return this.query().where(attributes)
  }

  public static whereAny<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    Schema extends I['dreamconf']['schema'],
    TableName extends AssociationTableNames<DB, Schema> & keyof DB = InstanceType<T>['table'],
  >(this: T, attributes: WhereStatement<DB, Schema, TableName>[]): Query<InstanceType<T>> {
    return this.query().whereAny(attributes)
  }

  public static whereNot<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    Schema extends I['dreamconf']['schema'],
    TableName extends AssociationTableNames<DB, Schema> & keyof DB = InstanceType<T>['table'],
  >(this: T, attributes: WhereStatement<DB, Schema, TableName>): Query<InstanceType<T>> {
    return this.query().whereNot(attributes)
  }

  private static isBelongsToAssociationForeignKey<T extends typeof Dream>(
    this: T,
    column: DreamColumnNames<InstanceType<T>>
  ) {
    return this.belongsToAssociationForeignKeys().includes(column)
  }

  private static isBelongsToAssociationPolymorphicTypeField<T extends typeof Dream>(
    this: T,
    column: DreamColumnNames<InstanceType<T>>
  ) {
    return this.polymorphicTypeColumns().includes(column)
  }

  private static belongsToAssociationForeignKeys() {
    const associationMap = this.associationMap()
    return this.belongsToAssociationNames().map(belongsToKey => associationMap[belongsToKey].foreignKey())
  }

  private static polymorphicTypeColumns() {
    const associationMap = this.associationMap()
    return this.belongsToAssociationNames()
      .filter(key => associationMap[key].polymorphic)
      .map(belongsToKey => associationMap[belongsToKey].foreignKeyTypeField())
  }

  private static belongsToAssociationNames() {
    const associationMap = this.associationMap()
    return Object.keys(associationMap).filter(key => associationMap[key].type === 'BelongsTo')
  }

  public getAssociation<I extends Dream, Schema extends I['dreamconf']['schema']>(
    this: I,
    associationName: keyof Schema[I['table']]['associations']
  ) {
    return (this.constructor as typeof Dream).getAssociation(associationName)
  }

  public associationMap<T extends Dream>(this: T) {
    return (this.constructor as typeof Dream).associationMap()
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

  public get isNewRecord() {
    return !this.isPersisted
  }

  public get isValid(): boolean {
    this._errors = {}
    runValidations(this)
    return !Object.keys(this.errors).filter(key => !!this.errors[key].length).length
  }

  public get primaryKey() {
    return 'id' as const
  }

  public get primaryKeyValue(): IdType {
    return (this as any)[this.primaryKey] || null
  }

  public get DB(): any {
    throw new MissingDB()
  }

  public get allColumns(): any {
    throw 'must have get allColumns defined on child'
  }

  public get dreamconf(): Dreamconf {
    throw 'must have get dreamconf defined on child'
  }

  public get table(): AssociationTableNames<any, any> {
    throw new MissingTable(this.constructor as typeof Dream)
  }

  public get serializer(): typeof DreamSerializer {
    throw new MissingSerializer(this.constructor as typeof Dream)
  }

  public get unsavedAssociations(): (
    | BelongsToStatement<any, any, any, any>
    | HasOneStatement<any, any, any, any>
    | HasManyStatement<any, any, any, any>
  )[] {
    const unsaved: (
      | BelongsToStatement<any, any, any, any>
      | HasOneStatement<any, any, any, any>
      | HasManyStatement<any, any, any, any>
    )[] = []
    for (const associationName in this.associationMap()) {
      const associationMetadata = this.getAssociation(associationName)
      const associationRecord: Dream | null = (this as any).loaded(associationName)
        ? ((this as any)[associationName] as Dream)
        : null

      if (associationRecord?.isDreamInstance && associationRecord?.isDirty) {
        unsaved.push(associationMetadata)
      }
    }
    return unsaved
  }

  private _errors: { [key: string]: ValidationType[] } = {}
  private frozenAttributes: { [key: string]: any } = {}
  private originalAttributes: { [key: string]: any } = {}
  private currentAttributes: { [key: string]: any } = {}
  private attributesFromBeforeLastSave: { [key: string]: any } = {}

  public static new<T extends typeof Dream>(
    this: T,
    opts?: UpdateablePropertiesForClass<T>,
    additionalOpts: { bypassUserDefinedSetters?: boolean } = {}
  ) {
    return new this(opts as any, additionalOpts) as InstanceType<T>
  }

  constructor(
    opts?: any,
    additionalOpts: { bypassUserDefinedSetters?: boolean } = {}
    // opts?: Updateable<
    //   InstanceType<DreamModel & typeof Dream>['DB'][InstanceType<DreamModel>['table'] &
    //     keyof InstanceType<DreamModel>['DB']]
    // >
  ) {
    this.defineAttributeAccessors()

    if (opts) {
      const marshalledOpts = this._setAttributes(opts, additionalOpts)

      // if id is set, then we freeze attributes after setting them, so that
      // any modifications afterwards will indicate updates.
      if (this.isPersisted) {
        this.freezeAttributes()
        this.originalAttributes = { ...marshalledOpts }
        this.attributesFromBeforeLastSave = { ...marshalledOpts }
      } else {
        const columns = (this.constructor as typeof Dream).columns()
        columns.forEach(column => {
          this.originalAttributes[column] = undefined
          this.attributesFromBeforeLastSave[column] = undefined
        })
      }
    }
  }

  protected static extractAttributesFromUpdateableProperties<T extends typeof Dream>(
    this: T,
    attributes: UpdateablePropertiesForClass<T>,
    dreamInstance?: InstanceType<T>,
    { bypassUserDefinedSetters = false }: { bypassUserDefinedSetters?: boolean } = {}
  ): WhereStatement<InstanceType<T>['DB'], InstanceType<T>['dreamconf']['schema'], InstanceType<T>['table']> {
    const marshalledOpts: any = {}

    const setAttributeOnDreamInstance = (attr: any, value: any) => {
      if (!dreamInstance) return

      if (bypassUserDefinedSetters) {
        dreamInstance.setAttribute(attr, value)
      } else {
        dreamInstance.assignAttribute(attr, value)
      }
    }

    Object.keys(attributes as any).forEach(attr => {
      const associationMetaData = this.associationMap()[attr]

      if (associationMetaData && associationMetaData.type !== 'BelongsTo') {
        throw new CanOnlyPassBelongsToModelParam(this, associationMetaData)
      } else if (associationMetaData) {
        const belongsToAssociationMetaData = associationMetaData as BelongsToStatement<any, any, any, any>
        const associatedObject = (attributes as any)[attr] as Dream | null

        // if dream instance is passed, set the loaded association
        if (dreamInstance && associatedObject !== undefined) (dreamInstance as any)[attr] = associatedObject

        if (!(associationMetaData as BelongsToStatement<any, any, any, any>).optional && !associatedObject)
          throw new CannotPassNullOrUndefinedToRequiredBelongsTo(
            this,
            associationMetaData as BelongsToStatement<any, any, any, any>
          )

        const foreignKey = belongsToAssociationMetaData.foreignKey()
        const foreignKeyValue = belongsToAssociationMetaData.primaryKeyValue(associatedObject)
        if (foreignKeyValue !== undefined) {
          marshalledOpts[foreignKey] = foreignKeyValue
          setAttributeOnDreamInstance(foreignKey, marshalledOpts[foreignKey])
        }

        if (belongsToAssociationMetaData.polymorphic) {
          const foreignKeyTypeField = belongsToAssociationMetaData.foreignKeyTypeField()
          marshalledOpts[foreignKeyTypeField] = associatedObject?.stiBaseClassOrOwnClass?.name
          setAttributeOnDreamInstance(foreignKeyTypeField, associatedObject?.stiBaseClassOrOwnClass?.name)
        }
      } else {
        marshalledOpts[attr] = marshalDBValue(this, attr as any, (attributes as any)[attr])
        setAttributeOnDreamInstance(attr, marshalledOpts[attr])
      }
    })

    return marshalledOpts
  }

  protected defineAttributeAccessors() {
    const columns = (this.constructor as typeof Dream).columns()
    columns.forEach(column => {
      // this ensures that the currentAttributes object will contain keys
      // for each of the properties
      if (this.currentAttributes[column] === undefined) this.currentAttributes[column] = undefined

      if (
        !Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), column)?.get &&
        !Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), column)?.set
      ) {
        if (isJsonColumn(this.constructor as typeof Dream, column)) {
          Object.defineProperty(Object.getPrototypeOf(this), column, {
            get() {
              if ([undefined, null].includes(this.currentAttributes[column]))
                return this.currentAttributes[column]
              return JSON.parse(this.currentAttributes[column])
            },

            set(val: any) {
              this.currentAttributes[column] = isString(val) ? val : JSON.stringify(val)
            },

            configurable: true,
          })
        } else {
          Object.defineProperty(Object.getPrototypeOf(this), column, {
            get() {
              return this.currentAttributes[column]
            },

            set(val: any) {
              return (this.currentAttributes[column] = val)
            },

            configurable: true,
          })
        }
      }
    })
  }

  public isVirtualColumn<T extends Dream>(this: T, columnName: string): boolean {
    return (this.constructor as typeof Dream).virtualAttributes
      .map(attr => attr.property)
      .includes(columnName)
  }

  public get errors(): { [key: string]: ValidationType[] } {
    return { ...this._errors }
  }

  /**
   * ### #addError
   *
   * adds an error to the model. Any errors added to the model
   * will cause the record to be invalid, and will prevent the
   * record from saving.
   *
   * ```ts
   *  class User extends ApplicationModel {
   *    ...
   *    @Validate()
   *    public async validateName() {
   *      if (typeof this.name === 'number')
   *        this.addError('name', 'name cannot be a number')
   *    }
   *  }
   * ```
   */
  public addError<I extends Dream, Key extends AttributeKeys<I>>(
    this: I,
    column: Key & string,
    error: string
  ) {
    this._errors[column] ||= []
    this._errors[column].push(error as any)
  }

  /**
   * ### #assignAttribute
   *
   * changes the attribute value for a single attribute,
   * leveraging any custom-defined setters. If you would like to
   * bypass custom-defined setters, use #setAttribute instead
   *
   * ```ts
   *  const user = new User()
   *  user.assignAttribute('email', 'sally@gmail.com')
   * ```
   */
  public assignAttribute<I extends Dream, Key extends AttributeKeys<I>>(
    this: I,
    attr: Key & string,
    val: any
  ): void {
    const self = this as any
    self[attr] = val
  }

  /**
   * ### #setAttribute
   *
   * changes the attribute value for a single attribute internally,
   * bypassing any custom-defined setters. If you would like to set attributes
   * without bypassing custom-defined setters, use #assignAttribute instead
   *
   * ```ts
   *  const user = new User()
   *  user.setAttribute('email', 'sally@gmail.com')
   * ```
   */
  public setAttribute<I extends Dream, Key extends AttributeKeys<I>>(
    this: I,
    attr: Key & string,
    val: any
  ): void {
    const columns = (this.constructor as typeof Dream).columns()
    const self = this as any

    if (columns.has(attr)) {
      self.currentAttributes[attr] = isJsonColumn(this.constructor as typeof Dream, attr)
        ? isString(val)
          ? val
          : JSON.stringify(val)
        : val
    } else {
      self.currentAttributes[attr] = val
    }
  }

  public getAttribute<I extends Dream, Key extends AttributeKeys<I>>(
    this: I,
    attr: Key & string
  ): DreamAttributes<I>[Key] {
    const columns = (this.constructor as typeof Dream).columns()
    const self = this as any

    if (columns.has(attr)) {
      return self.currentAttributes[attr]
    } else {
      return self[attr]
    }
  }

  public attributes<I extends Dream, DB extends I['DB']>(this: I): Updateable<DB[I['table']]> {
    return { ...this.currentAttributes } as Updateable<DB[I['table']]>
  }

  protected static cachedTypeFor<
    T extends typeof Dream,
    DB extends InstanceType<T>['DB'],
    TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName],
  >(this: T, attribute: keyof Table): string {
    return cachedTypeForAttribute(this, attribute)
  }

  public changedAttributes<
    I extends Dream,
    DB extends I['DB'],
    Schema extends I['dreamconf']['schema'],
    TableName extends AssociationTableNames<DB, Schema> & keyof DB = I['table'] &
      AssociationTableNames<DB, Schema>,
    Table extends DB[keyof DB] = DB[TableName],
  >(this: I): Updateable<Table> {
    const obj: Updateable<Table> = {}

    Object.keys(this.dirtyAttributes()).forEach(column => {
      ;(obj as any)[column] = (this.frozenAttributes as any)[column]
    })
    return obj
  }

  public changes<
    I extends Dream,
    DB extends I['DB'],
    TableName extends I['table'],
    Table extends DB[TableName],
    RetType = Partial<
      Record<
        DreamColumnNames<I>,
        { was: Updateable<Table>[DreamColumnNames<I>]; now: Updateable<Table>[DreamColumnNames<I>] }
      >
    >,
  >(this: I): RetType {
    const obj: RetType = {} as RetType

    ;(this.constructor as typeof Dream).columns().forEach(column => {
      const was = this.previousValueForAttribute(column as any)
      const now = (this as any)[column]
      if (was !== now) {
        ;(obj as any)[column] = {
          was,
          now,
        }
      }
    })
    return obj
  }

  public previousValueForAttribute<
    I extends Dream,
    DB extends I['DB'],
    TableName extends I['table'],
    Table extends DB[TableName],
    ColumnName extends DreamColumnNames<I>,
  >(this: I, attribute: ColumnName): Updateable<Table>[ColumnName] {
    if (this.frozenAttributes[attribute] !== (this as any)[attribute]) return this.frozenAttributes[attribute]
    return (this.attributesFromBeforeLastSave as any)[attribute]
  }

  public savedChangeToAttribute<I extends Dream>(this: I, attribute: DreamColumnNames<I>): boolean {
    const changes = this.changes()
    const now = (changes as any)?.[attribute]?.now
    const was = (changes as any)?.[attribute]?.was
    return this.isPersisted && now !== was
  }

  public willSaveChangeToAttribute<I extends Dream>(this: I, attribute: DreamColumnNames<I>): boolean {
    return this.attributeIsDirty(attribute as any)
  }

  public columns<
    I extends Dream,
    DB extends I['DB'],
    TableName extends keyof DB = I['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName],
  >(this: I): Set<keyof Table> {
    return (this.constructor as DreamConstructorType<I>).columns()
  }

  public dirtyAttributes<
    I extends Dream,
    DB extends I['DB'],
    Schema extends I['dreamconf']['schema'],
    TableName extends AssociationTableNames<DB, Schema> & keyof DB = I['table'] &
      AssociationTableNames<DB, Schema>,
    Table extends DB[keyof DB] = DB[TableName],
  >(this: I): Updateable<Table> {
    const obj: Updateable<Table> = {}

    this.columns().forEach(column => {
      // TODO: clean up types
      if (this.attributeIsDirty(column as any)) (obj as any)[column] = (this.attributes() as any)[column]
    })

    return obj
  }

  private attributeIsDirty<I extends Dream>(this: I, attribute: DreamColumnNames<I>): boolean {
    const frozenValue = (this.frozenAttributes as any)[attribute]
    const currentValue = (this.attributes() as any)[attribute]

    if (this.isNewRecord) return true

    if (frozenValue instanceof DateTime) {
      return frozenValue.toMillis() !== this.unknownValueToMillis(currentValue)
    } else if (frozenValue instanceof CalendarDate) {
      return frozenValue.toISO() !== this.unknownValueToDateString(currentValue)
    } else {
      return frozenValue !== currentValue
    }
  }

  private unknownValueToMillis(currentValue: any): number | undefined {
    if (!currentValue) return
    if (isString(currentValue)) currentValue = DateTime.fromISO(currentValue)
    if (currentValue instanceof CalendarDate) currentValue = currentValue.toDateTime()
    if (currentValue instanceof DateTime && currentValue.isValid) return currentValue.toMillis()
  }

  private unknownValueToDateString(currentValue: any): string | undefined {
    if (!currentValue) return
    if (isString(currentValue)) currentValue = CalendarDate.fromISO(currentValue)
    if (currentValue instanceof DateTime) currentValue = CalendarDate.fromDateTime(currentValue)
    if (currentValue instanceof CalendarDate && currentValue.isValid) return currentValue.toISO()!
  }

  public async destroy<I extends Dream>(this: I): Promise<I> {
    return destroyDream(this)
  }

  public equals(other: any): boolean {
    return other?.constructor === this.constructor && other.primaryKeyValue === this.primaryKeyValue
  }

  protected freezeAttributes() {
    this.frozenAttributes = { ...this.attributes() }
  }

  public async pluckThrough<
    I extends Dream,
    DB extends I['DB'],
    Schema extends I['dreamconf']['schema'],
    TableName extends I['table'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicPluckThroughArgs<DB, Schema, TableName, Arr>]): Promise<any[]> {
    const construct = this.constructor as DreamConstructorType<I>
    return await construct
      .where({ [this.primaryKey]: this.primaryKeyValue } as any)
      .pluckThrough(...(args as any))
  }

  public async pluckEachThrough<
    I extends Dream,
    DB extends I['DB'],
    Schema extends I['dreamconf']['schema'],
    TableName extends I['table'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicPluckEachThroughArgs<DB, Schema, TableName, Arr>]): Promise<void> {
    const construct = this.constructor as DreamConstructorType<I>
    await construct
      .where({ [this.primaryKey]: this.primaryKeyValue } as any)
      .pluckEachThrough(...(args as any))
  }

  /**
   * Deep clones the model and it's attributes, but maintains references to
   * loaded associations
   */
  public clone<I extends Dream>(this: I): I {
    const self: any = this
    const clone: any = new self.constructor()

    const associationDataKeys = Object.values((this.constructor as typeof Dream).associationMap()).map(
      association => associationToGetterSetterProp(association)
    )

    Object.keys(this).forEach(property => {
      if (!associationDataKeys.includes(property)) clone[property] = cloneDeepSafe(self[property])
    })

    associationDataKeys.forEach(associationDataKey => (clone[associationDataKey] = self[associationDataKey]))

    return clone as I
  }

  public async createAssociation<
    I extends Dream,
    Schema extends I['dreamconf']['schema'],
    AssociationName extends keyof Schema[I['table']]['associations'],
    PossibleArrayAssociationType = I[AssociationName & keyof I],
    AssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
      ? ElementType
      : PossibleArrayAssociationType,
    RestrictedAssociationType extends AssociationType extends Dream
      ? AssociationType
      : never = AssociationType extends Dream ? AssociationType : never,
  >(
    this: I,
    associationName: AssociationName,
    opts: UpdateableAssociationProperties<I, RestrictedAssociationType> = {} as any
  ): Promise<NonNullable<AssociationType>> {
    return createAssociation(this, null, associationName, opts)
  }

  public async destroyAssociation<
    I extends Dream,
    Schema extends I['dreamconf']['schema'],
    AssociationName extends keyof Schema[I['table']]['associations'],
    AssociationTableName extends Schema[I['table']]['associations'][AssociationName]['tables'][0],
    RestrictedAssociationTableName extends AssociationTableName &
      AssociationTableNames<I['DB'], Schema> &
      keyof I['DB'] = AssociationTableName & AssociationTableNames<I['DB'], Schema> & keyof I['DB'],
  >(
    this: I,
    associationName: AssociationName,
    opts: WhereStatement<I['DB'], Schema, RestrictedAssociationTableName> = {}
  ): Promise<number> {
    return destroyAssociation(this, null, associationName, opts)
  }

  public associationQuery<
    I extends Dream,
    Schema extends I['dreamconf']['schema'],
    AssociationName extends keyof Schema[I['table']]['associations'],
  >(this: I, associationName: AssociationName) {
    return associationQuery(this, null, associationName)
  }

  public associationUpdateQuery<
    I extends Dream,
    Schema extends I['dreamconf']['schema'],
    AssociationName extends keyof Schema[I['table']]['associations'],
  >(this: I, associationName: AssociationName) {
    return associationUpdateQuery(this, null, associationName)
  }

  public passthrough<I extends Dream, AllColumns extends I['allColumns']>(
    this: I,
    passthroughWhereStatement: PassthroughWhere<AllColumns>
  ): LoadBuilder<I> {
    return new LoadBuilder<I>(this).passthrough(passthroughWhereStatement)
  }

  public load<
    I extends Dream,
    TableName extends I['table'],
    Schema extends I['dreamconf']['schema'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicLoadArgs<Schema, TableName, Arr>]): LoadBuilder<I> {
    return new LoadBuilder<I>(this).load(...(args as any))
  }

  public loaded<
    I extends Dream,
    TableName extends I['table'],
    Schema extends I['dreamconf']['schema'],
    //
    A extends NextPreloadArgumentType<Schema, TableName>,
  >(this: I, a: A) {
    try {
      ;(this as any)[a]
      return true
    } catch (error) {
      if ((error as any).constructor !== NonLoadedAssociation) throw error
      return false
    }
  }

  public async reload<I extends Dream>(this: I) {
    return reload(this)
  }

  public serialize<I extends Dream>(this: I, { casing = null }: { casing?: 'camel' | 'snake' | null } = {}) {
    const serializer = new this.serializer(this)
    if (casing) serializer.casing(casing)
    return serializer.render()
  }

  /**
   * ### #assignAttributes
   *
   * takes the attributes passed in and sets their values,
   * leveraging any custom setters defined for these attributes
   *
   * e.g.
   *
   * ```ts
   *  const user = new User()
   *  user.assignAttributes({ email: 'my@email', password: 'my password' })
   * ```
   *
   * #### NOTE:
   * if you are interested in bypassing custom-defined setters,
   * use `#setAttributes` instead.
   */
  public assignAttributes<I extends Dream>(this: I, attributes: UpdateableProperties<I>) {
    return this._setAttributes(attributes, { bypassUserDefinedSetters: false })
  }

  /**
   * ### #setAttributes
   *
   * takes the attributes passed in and sets their values internally,
   * bypassing any custom setters defined for these attributes
   *
   * ```ts
   *  const user = new User()
   *  user.setAttributes({ email: 'my@email', password: 'my password' })
   * ```
   *
   * #### NOTE:
   * if you are interested in leveraging custom-defined setters,
   * use `#assignAttributes` instead.
   */
  public setAttributes<I extends Dream>(this: I, attributes: UpdateableProperties<I>) {
    return this._setAttributes(attributes, { bypassUserDefinedSetters: true })
  }

  private _setAttributes<I extends Dream>(
    this: I,
    attributes: UpdateableProperties<I>,
    additionalOpts: { bypassUserDefinedSetters?: boolean } = {}
  ) {
    const dreamClass = this.constructor as typeof Dream
    const marshalledOpts = dreamClass.extractAttributesFromUpdateableProperties(
      attributes as any,
      this,
      additionalOpts
    )
    return marshalledOpts
  }

  public async save<I extends Dream>(this: I): Promise<I> {
    if (this.hasUnsavedAssociations) {
      await (this.constructor as typeof Dream).transaction(async txn => {
        await saveDream(this, txn)
      })
      return this
    } else {
      return await saveDream(this, null)
    }
  }

  public txn<I extends Dream>(this: I, txn: DreamTransaction<Dream>): DreamInstanceTransactionBuilder<I> {
    return new DreamInstanceTransactionBuilder<I>(this, txn)
  }

  /**
   * ### #update
   *
   * applies all attribute changes passed to the dream,
   * leveraging any custom-defined setters,
   * and then saves the dream instance
   *
   * e.g.
   *
   * ```ts
   *  const user = await User.create({ email: 'saly@gmail.com' })
   *  await user.update({ email: 'sally@gmail.com' })
   * ```
   *
   * #### NOTE:
   * if you are interested in bypassing any custom-defined setters,
   * use `#updateAttributes` instead.
   *
   */
  public async update<I extends Dream>(this: I, attributes: UpdateableProperties<I>): Promise<I> {
    // use #assignAttributes to leverage any custom-defined setters
    this.assignAttributes(attributes)

    // call save rather than _save so that any unsaved associations in the
    // attributes are saved with this model in a transaction
    return await this.save()
  }

  /**
   * ### #updateAttributes
   *
   * applies all attribute changes passed to the dream,
   * bypassing any custom-defined setters,
   * and then saves the dream instance.
   *
   * ```ts
   *  const user = await User.create({ email: 'saly@gmail.com' })
   *  await user.updateAttributes({ email: 'sally@gmail.com' })
   * ```
   * #### NOTE:
   * if you are interested in updating the values without bypassing
   * any custom-defined setters, use `#update` instead.
   */
  public async updateAttributes<I extends Dream>(this: I, attributes: UpdateableProperties<I>): Promise<I> {
    // use #setAttributes to bypass any custom-defined setters
    this.setAttributes(attributes)

    // call save rather than _save so that any unsaved associations in the
    // attributes are saved with this model in a transaction
    return await this.save()
  }

  private _preventDeletion: boolean = false
  public preventDeletion() {
    this._preventDeletion = true
  }

  public unpreventDeletion() {
    this._preventDeletion = false
    return this
  }
}

export interface CreateOrFindByExtraOps<T extends typeof Dream> {
  createWith?:
    | WhereStatement<InstanceType<T>['DB'], InstanceType<T>['dreamconf']['schema'], InstanceType<T>['table']>
    | UpdateablePropertiesForClass<T>
}
