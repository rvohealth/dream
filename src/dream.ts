import { DateTime } from 'luxon'
import { CompiledQuery, SelectArg, SelectExpression, Updateable } from 'kysely'
import db from './db'
import { HasManyStatement } from './decorators/associations/has-many'
import { BelongsToStatement } from './decorators/associations/belongs-to'
import { HasOneStatement } from './decorators/associations/has-one'
import { ScopeStatement } from './decorators/scope'
import { HookStatement, blankHooksFactory } from './decorators/hooks/shared'
import ValidationStatement, { ValidationType } from './decorators/validations/shared'
import { ExtractTableAlias } from 'kysely/dist/cjs/parser/table-parser'
import {
  AssociatedModelParam,
  TableColumnName,
  WhereStatement,
  blankAssociationsFactory,
} from './decorators/associations/shared'
import { AssociationTableNames } from './db/reflections'
import {
  DreamConstructorType,
  IdType,
  PreloadArgumentTypeAssociatedTableNames,
  JoinsArgumentTypeAssociatedTableNames,
  NextJoinsWhereArgumentType,
  NextPreloadArgumentType,
  UpdateablePropertiesForClass,
  UpdateableProperties,
  NextJoinsWherePluckArgumentType,
  FinalJoinsWherePluckArgumentType,
} from './dream/types'
import Query from './dream/query'
import checkValidationsFor from './dream/internal/checkValidationsFor'
import DreamTransaction from './dream/transaction'
import DreamClassTransactionBuilder from './dream/class-transaction-builder'
import saveDream from './dream/internal/saveDream'
import DreamInstanceTransactionBuilder from './dream/instance-transaction-builder'
import pascalize from './helpers/pascalize'
import getModelKey from './helpers/getModelKey'
import { VirtualAttributeStatement } from './decorators/virtual'
import cachedTypeForAttribute from './helpers/db/cachedTypeForAttribute'
import isDecimal from './helpers/db/types/isDecimal'
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
import Dreamconf from '../shared/dreamconf'
import resortAllRecords from './decorators/sortable/helpers/resortAllRecords'
import { SortableFieldConfig } from './decorators/sortable'
import NonExistentScopeProvidedToResort from './exceptions/non-existent-scope-provided-to-resort'
import cloneDeep from 'lodash.clonedeep'
import NonLoadedAssociation from './exceptions/associations/non-loaded-association'
import extractAttributesFromUpdateableProperties from './dream/internal/extractAttributesFromUpdateableProperties'
import associationToGetterSetterProp from './decorators/associations/associationToGetterSetterProp'
import { isString } from './helpers/typechecks'

export default class Dream {
  public static get primaryKey(): string {
    return 'id'
  }

  public static createdAtField = 'createdAt'

  public static associations: {
    belongsTo: BelongsToStatement<any, any, any>[]
    hasMany: HasManyStatement<any, any, any>[]
    hasOne: HasOneStatement<any, any, any>[]
  } = blankAssociationsFactory(this)

  public static scopes: {
    default: ScopeStatement[]
    named: ScopeStatement[]
  } = {
    default: [],
    named: [],
  }

  public static virtualAttributes: VirtualAttributeStatement[] = []
  public static sortableFields: SortableFieldConfig[] = []

  public static extendedBy: (typeof Dream)[] | null = null

  public static sti: {
    active: boolean
    baseClass: typeof Dream | null
    value: string | null
  } = {
    active: false,
    baseClass: null,
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
  } = blankHooksFactory(this)

  public static validations: ValidationStatement[] = []
  public static replicaSafe = false

  public static get isDream() {
    return true
  }

  public static get isSTIBase() {
    return !!this.extendedBy?.length && !this.isSTIChild
  }

  public static get stiBaseClassOrOwnClass(): typeof Dream {
    return this.sti.baseClass || this
  }

  public get stiBaseClassOrOwnClass(): typeof Dream {
    return (this.constructor as typeof Dream).stiBaseClassOrOwnClass
  }

  public static get isSTIChild() {
    return !!this.sti?.active
  }

  public static addHook(hookType: keyof typeof this.hooks, statement: HookStatement) {
    const existingHook = this.hooks[hookType].find(hook => hook.method === statement.method)
    if (existingHook) return

    this.hooks[hookType] = [...this.hooks[hookType], statement]
  }

  public static async globalName<T extends typeof Dream>(this: T): Promise<any> {
    const modelKey = await getModelKey(this)
    return pascalize(modelKey!)
  }

  public static columns<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName]
  >(): (keyof Table & string)[] {
    return (this.prototype.dreamconf.dbColumns as any)[this.prototype.table]
  }

  public static getAssociation<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    SyncedAssociations extends I['syncedAssociations']
  >(this: T, associationName: SyncedAssociations[DB][number]) {
    return this.associationMap()[associationName]
  }

  public static associationMap<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    SyncedAssociations extends I['syncedAssociations']
  >(this: T) {
    const allAssociations = [
      ...this.associations.belongsTo,
      ...this.associations.hasOne,
      ...this.associations.hasMany,
    ]

    const map = {} as {
      [key: (typeof allAssociations)[number]['as']]:
        | BelongsToStatement<DB, SyncedAssociations, AssociationTableNames<DB, SyncedAssociations> & keyof DB>
        | HasManyStatement<DB, SyncedAssociations, AssociationTableNames<DB, SyncedAssociations> & keyof DB>
        | HasOneStatement<DB, SyncedAssociations, AssociationTableNames<DB, SyncedAssociations> & keyof DB>
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

  public static unscoped<T extends typeof Dream>(this: T) {
    return this.query().unscoped()
  }

  public static async all<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName],
    IdColumn = T['primaryKey'] & keyof Table
  >(this: T): Promise<InstanceType<T>[]> {
    return await this.query().all()
  }

  public static connection<T extends typeof Dream>(this: T, connection: DbConnectionType): Query<T> {
    const query: Query<T> = new Query<T>(this, { connection })
    return query
  }

  public static async count<T extends typeof Dream>(this: T): Promise<number> {
    return await this.query().count()
  }

  public static async max<
    DreamClass extends typeof Dream,
    I extends InstanceType<DreamClass>,
    TableName extends I['table'],
    DB extends I['DB'],
    SimpleFieldType extends keyof Updateable<DB[TableName]>
  >(this: DreamClass, field: SimpleFieldType): Promise<number> {
    return await this.query().max(field as any)
  }

  public static async min<
    DreamClass extends typeof Dream,
    I extends InstanceType<DreamClass>,
    TableName extends I['table'],
    DB extends I['DB'],
    SimpleFieldType extends keyof Updateable<DB[TableName]>
  >(this: DreamClass, field: SimpleFieldType): Promise<number> {
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
        (err as DatabaseError)?.constructor === DatabaseError &&
        (err as DatabaseError)?.message?.includes('duplicate key value violates unique constraint')
      )
        return await this.findBy(extractAttributesFromUpdateableProperties(this, opts))
      throw err
    }
  }

  public static distinct<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    SyncedAssociations extends I['syncedAssociations'],
    TableName extends InstanceType<T>['table']
  >(this: T, columnName?: TableColumnName<DB, SyncedAssociations, TableName> | null | boolean) {
    return this.query().distinct(columnName as any)
  }

  public static async find<
    T extends typeof Dream,
    InterpretedDB extends InstanceType<T>['dreamconf']['interpretedDB'],
    TableName extends keyof InterpretedDB = InstanceType<T>['table'] & keyof InterpretedDB
  >(
    this: T,
    id: InterpretedDB[TableName][T['primaryKey'] & keyof InterpretedDB[TableName]]
  ): Promise<InstanceType<T> | null> {
    return await this.query().find(id)
  }

  public static query<T extends typeof Dream>(this: T): Query<T> {
    return new Query<T>(this)
  }

  public static async findBy<T extends typeof Dream>(
    this: T,
    attributes: WhereStatement<
      InstanceType<T>['DB'],
      InstanceType<T>['syncedAssociations'],
      InstanceType<T>['table']
    >
  ): Promise<InstanceType<T> | null> {
    return await this.query().findBy(attributes)
  }

  public static async findOrCreateBy<T extends typeof Dream>(
    this: T,
    opts: UpdateablePropertiesForClass<T>,
    extraOpts: CreateOrFindByExtraOps<T> = {}
  ) {
    const existingRecord = await this.findBy(extractAttributesFromUpdateableProperties(this, opts))
    if (existingRecord) return existingRecord

    return (await new (this as any)({
      ...opts,
      ...(extraOpts?.createWith || {}),
    }).save()) as InstanceType<T>
  }

  public static async first<T extends typeof Dream>(this: T): Promise<InstanceType<T> | null> {
    return (await this.query().first()) as InstanceType<T> | null
  }

  public static async exists<T extends typeof Dream>(this: T): Promise<boolean> {
    return await this.query().exists()
  }

  public static preload<
    T extends typeof Dream,
    I extends InstanceType<T>,
    SyncedAssociations extends I['syncedAssociations'],
    TableName extends InstanceType<T>['table'],
    //
    A extends NextPreloadArgumentType<SyncedAssociations, TableName>,
    ATableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, TableName, A>,
    B extends NextPreloadArgumentType<SyncedAssociations, ATableName>,
    BTableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, ATableName, B>,
    C extends NextPreloadArgumentType<SyncedAssociations, BTableName>,
    CTableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, BTableName, C>,
    D extends NextPreloadArgumentType<SyncedAssociations, CTableName>,
    DTableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, CTableName, D>,
    E extends NextPreloadArgumentType<SyncedAssociations, DTableName>,
    ETableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, DTableName, E>,
    F extends NextPreloadArgumentType<SyncedAssociations, ETableName>,
    FTableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, ETableName, F>,
    G extends NextPreloadArgumentType<SyncedAssociations, FTableName>
  >(this: T, a: A, b?: B, c?: C, d?: D, e?: E, f?: F, g?: G) {
    return this.query().preload(a as any, b as any, c as any, d as any, e as any, f as any, g as any)
  }

  public static joins<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    SyncedAssociations extends I['syncedAssociations'],
    TableName extends I['table'] & keyof SyncedAssociations,
    //
    A extends keyof SyncedAssociations[TableName] & string,
    ATableName extends (SyncedAssociations[TableName][A & keyof SyncedAssociations[TableName]] &
      string[])[number],
    //
    B extends NextJoinsWhereArgumentType<DB, SyncedAssociations, ATableName>,
    BTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ATableName, B>,
    C extends NextJoinsWhereArgumentType<DB, SyncedAssociations, BTableName>,
    CTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, BTableName, C>,
    D extends NextJoinsWhereArgumentType<DB, SyncedAssociations, CTableName>,
    DTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, CTableName, D>,
    E extends NextJoinsWhereArgumentType<DB, SyncedAssociations, DTableName>,
    ETableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, DTableName, E>,
    F extends NextJoinsWhereArgumentType<DB, SyncedAssociations, ETableName>,
    FTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ETableName, F>,
    G extends NextJoinsWhereArgumentType<DB, SyncedAssociations, FTableName>
  >(this: T, a: A, b?: B, c?: C, d?: D, e?: E, f?: F, g?: G) {
    return this.query().joins(a as any, b as any, c as any, d as any, e as any, f as any, g as any)
  }

  public static async joinsPluck<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    SyncedAssociations extends I['syncedAssociations'],
    TableName extends I['table'],
    //
    A extends keyof SyncedAssociations[TableName] & string,
    ATableName extends (SyncedAssociations[TableName][A & keyof SyncedAssociations[TableName]] &
      string[])[number],
    //
    B extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, A, A, ATableName>,
    BTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ATableName, B>,
    C extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, B, A, BTableName>,
    CTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, BTableName, C>,
    D extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, C, B, CTableName>,
    DTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, CTableName, D>,
    E extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, D, C, DTableName>,
    ETableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, DTableName, E>,
    F extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, E, D, ETableName>,
    FTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ETableName, F>,
    //
    G extends FinalJoinsWherePluckArgumentType<DB, SyncedAssociations, F, E, FTableName>
  >(this: T, a: A, b: B, c?: C, d?: D, e?: E, f?: F, g?: G) {
    return await this.query().joinsPluck(a as any, b as any, c as any, d as any, e as any, f as any, g as any)
  }

  public static async last<T extends typeof Dream>(this: T): Promise<InstanceType<T> | null> {
    return (await this.query().last()) as InstanceType<T> | null
  }

  public static limit<T extends typeof Dream>(this: T, count: number) {
    return this.query().limit(count)
  }

  public static nestedSelect<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    SE extends SelectExpression<DB, ExtractTableAlias<DB, InstanceType<T>['table']>>
  >(this: T, selection: SelectArg<DB, ExtractTableAlias<DB, InstanceType<T>['table']>, SE>) {
    return this.query().nestedSelect(selection as any)
  }

  public static order<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    SyncedAssociations extends I['syncedAssociations'],
    ColumnName extends keyof Table & string,
    TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB = I['table'],
    Table extends DB[keyof DB] = DB[TableName]
  >(this: T, column: ColumnName, direction: 'asc' | 'desc' = 'asc') {
    return this.query().order(column as any, direction)
  }

  public static async pluck<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    SE extends SelectExpression<DB, ExtractTableAlias<DB, I['table']>>
  >(this: T, ...fields: SelectArg<DB, ExtractTableAlias<DB, I['table']>, SE>[]) {
    return await this.query().pluck(...(fields as any[]))
  }

  public static async resort<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    SE extends SelectExpression<DB, ExtractTableAlias<DB, I['table']>>
  >(this: T, ...fields: SelectArg<DB, ExtractTableAlias<DB, I['table']>, SE>[]) {
    for (const field of fields) {
      const sortableMetadata = this.sortableFields.find(conf => conf.positionField === field)
      if (!sortableMetadata) throw new NonExistentScopeProvidedToResort(fields as string[], this)
      await resortAllRecords(this, field as string, sortableMetadata.scope)
    }
  }

  public static scope<T extends typeof Dream>(this: T, scopeName: string) {
    return (this as any)[scopeName](this.query()) as Query<T>
  }

  public static sql<T extends typeof Dream>(this: T): CompiledQuery<{}> {
    return this.query().sql()
  }

  public static txn<T extends typeof Dream>(
    this: T,
    txn: DreamTransaction<InstanceType<T>['DB']>
  ): DreamClassTransactionBuilder<T> {
    return new DreamClassTransactionBuilder<T>(this, txn)
  }

  public static async transaction<T extends typeof Dream>(
    this: T,
    callback: (txn: DreamTransaction<InstanceType<T>['DB']>) => Promise<unknown>
  ) {
    const dreamTransaction = new DreamTransaction()

    const res = await db('primary', this.prototype.dreamconf)
      .transaction()
      .execute(async kyselyTransaction => {
        dreamTransaction.kyselyTransaction = kyselyTransaction
        await (callback as (txn: DreamTransaction<InstanceType<T>['DB']>) => Promise<unknown>)(
          dreamTransaction
        )
      })

    await dreamTransaction.runAfterCommitHooks()

    return res
  }

  public static where<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    SyncedAssociations extends I['syncedAssociations'],
    TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB = InstanceType<T>['table']
  >(this: T, attributes: WhereStatement<DB, SyncedAssociations, TableName>): Query<T> {
    return this.query().where(attributes)
  }

  public static whereAny<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    SyncedAssociations extends I['syncedAssociations'],
    TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB = InstanceType<T>['table']
  >(this: T, attributes: WhereStatement<DB, SyncedAssociations, TableName>[]): Query<T> {
    return this.query().whereAny(attributes)
  }

  public static whereNot<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    SyncedAssociations extends I['syncedAssociations'],
    TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB = InstanceType<T>['table']
  >(this: T, attributes: WhereStatement<DB, SyncedAssociations, TableName>): Query<T> {
    return this.query().whereNot(attributes)
  }

  public static new<T extends typeof Dream>(this: T, opts?: UpdateablePropertiesForClass<T>) {
    return new this(opts as any) as InstanceType<T>
  }

  public getAssociation<
    I extends Dream,
    DB extends I['DB'],
    SyncedAssociations extends I['syncedAssociations']
  >(this: I, associationName: SyncedAssociations[DB][number]) {
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

  public get DB(): any {
    throw new MissingDB()
  }

  public get syncedAssociations(): any {
    throw 'must have get syncedAssociations defined on child'
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
    | BelongsToStatement<any, any, any>
    | HasOneStatement<any, any, any>
    | HasManyStatement<any, any, any>
  )[] {
    const unsaved: (
      | BelongsToStatement<any, any, any>
      | HasOneStatement<any, any, any>
      | HasManyStatement<any, any, any>
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

  public errors: { [key: string]: ValidationType[] } = {}
  public frozenAttributes: { [key: string]: any } = {}
  public originalAttributes: { [key: string]: any } = {}
  public attributesFromBeforeLastSave: { [key: string]: any } = {}

  constructor(
    opts?: any
    // opts?: Updateable<
    //   InstanceType<DreamModel & typeof Dream>['DB'][InstanceType<DreamModel>['table'] &
    //     keyof InstanceType<DreamModel>['DB']]
    // >
  ) {
    if (opts) {
      const marshalledOpts = this.setAttributes(opts as any)

      // if id is set, then we freeze attributes after setting them, so that
      // any modifications afterwards will indicate updates.
      if (this.isPersisted) {
        this.freezeAttributes()
        this.originalAttributes = { ...marshalledOpts }
        this.attributesFromBeforeLastSave = { ...marshalledOpts }
      } else {
        const columns = (this.constructor as typeof Dream).columns() as string[]
        columns.forEach(column => {
          this.originalAttributes[column] = undefined
          this.attributesFromBeforeLastSave[column] = undefined
        })
      }
    }
  }

  public attributes<I extends Dream, DB extends I['DB']>(this: I): Updateable<DB[I['table']]> {
    const obj: Updateable<DB[I['table']]> = {}
    ;(this.constructor as DreamConstructorType<I>).columns().forEach(column => {
      ;(obj as any)[column] = (this as any)[column]
    })
    return obj
  }

  public static cachedTypeFor<
    T extends typeof Dream,
    DB extends InstanceType<T>['DB'],
    TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName]
  >(this: T, attribute: keyof Table): string {
    return cachedTypeForAttribute(this, attribute)
  }

  public changedAttributes<
    I extends Dream,
    DB extends I['DB'],
    SyncedAssociations extends I['syncedAssociations'],
    TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB = I['table'] &
      AssociationTableNames<DB, SyncedAssociations>,
    Table extends DB[keyof DB] = DB[TableName]
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
    RetType extends Partial<
      Record<
        keyof Updateable<Table>,
        { was: Updateable<Table>[keyof Updateable<Table>]; now: Updateable<Table>[keyof Updateable<Table>] }
      >
    >
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
    Attr extends keyof Updateable<Table> & string
  >(this: I, attribute: Attr): Updateable<Table>[Attr] {
    if (this.frozenAttributes[attribute] !== (this as any)[attribute]) return this.frozenAttributes[attribute]
    return (this.attributesFromBeforeLastSave as any)[attribute]
  }

  public savedChangeToAttribute<
    I extends Dream,
    TableName extends I['table'],
    DB extends I['DB'],
    Table extends DB[TableName],
    Attr extends keyof Updateable<Table> & string
  >(this: I, attribute: Attr): boolean {
    const changes = this.changes()
    const now = (changes as any)?.[attribute]?.now
    const was = (changes as any)?.[attribute]?.was
    return this.isPersisted && now !== was
  }

  public willSaveChangeToAttribute<
    I extends Dream,
    TableName extends I['table'],
    DB extends I['DB'],
    Table extends DB[TableName],
    Attr extends keyof Updateable<Table> & string
  >(this: I, attribute: Attr): boolean {
    return this.attributeIsDirty(attribute as any)
  }

  public columns<
    I extends Dream,
    DB extends I['DB'],
    TableName extends keyof DB = I['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName]
  >(this: I): (keyof Table)[] {
    return (this.constructor as DreamConstructorType<I>).columns()
  }

  public dirtyAttributes<
    I extends Dream,
    DB extends I['DB'],
    SyncedAssociations extends I['syncedAssociations'],
    TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB = I['table'] &
      AssociationTableNames<DB, SyncedAssociations>,
    Table extends DB[keyof DB] = DB[TableName]
  >(this: I): Updateable<Table> {
    const obj: Updateable<Table> = {}

    Object.keys(this.attributes()).forEach(column => {
      // TODO: clean up types
      if (this.attributeIsDirty(column as any)) (obj as any)[column] = (this.attributes() as any)[column]
    })

    return obj
  }

  private attributeIsDirty<
    I extends Dream,
    DB extends I['DB'],
    TableName extends I['table'],
    Table extends DB[TableName],
    Attr extends keyof Updateable<Table> & string
  >(this: I, attribute: Attr): boolean {
    const frozenValue = (this.frozenAttributes as any)[attribute]
    const currentValue = (this.attributes() as any)[attribute]

    return (
      frozenValue === undefined ||
      (frozenValue?.constructor === DateTime
        ? (frozenValue as DateTime).toMillis() !== this.unknownValueToMillis(currentValue)
        : frozenValue !== currentValue)
    )
  }

  private unknownValueToMillis(currentValue: any): number | undefined {
    if (!currentValue) return
    if (isString(currentValue)) currentValue = DateTime.fromISO(currentValue)
    if ((currentValue as DateTime)?.isValid) return currentValue.toMillis()
  }

  public async destroy<I extends Dream>(this: I): Promise<I> {
    return destroyDream(this)
  }

  public equals(other: any): boolean {
    return other?.constructor === this.constructor && other.primaryKeyValue === this.primaryKeyValue
  }

  public freezeAttributes() {
    this.frozenAttributes = { ...this.attributes() }
  }

  public isDecimal<
    I extends Dream,
    DB extends I['DB'],
    SyncedAssociations extends I['syncedAssociations'],
    TableName extends keyof DB = I['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName]
  >(this: I, attribute: keyof Table): boolean {
    return isDecimal(this.constructor as typeof Dream, attribute)
  }

  public async joinsPluck<
    I extends Dream,
    DB extends I['DB'],
    SyncedAssociations extends I['syncedAssociations'],
    TableName extends I['table'],
    //
    A extends keyof SyncedAssociations[TableName] & string,
    ATableName extends (SyncedAssociations[TableName][A & keyof SyncedAssociations[TableName]] &
      string[])[number],
    //
    B extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, A, A, ATableName>,
    BTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ATableName, B>,
    C extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, B, A, BTableName>,
    CTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, BTableName, C>,
    D extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, C, B, CTableName>,
    DTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, CTableName, D>,
    E extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, D, C, DTableName>,
    ETableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, DTableName, E>,
    F extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, E, D, ETableName>,
    FTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ETableName, F>,
    //
    G extends FinalJoinsWherePluckArgumentType<DB, SyncedAssociations, F, E, FTableName>
  >(this: I, a: A, b: B, c?: C, d?: D, e?: E, f?: F, g?: G): Promise<any[]> {
    const construct = this.constructor as DreamConstructorType<I>
    return await construct
      .where({ [this.primaryKey]: this.primaryKeyValue } as any)
      .joinsPluck(a as any, b as any, c as any, d as any, e as any, f as any, g as any)
  }

  /**
   * Deep clones the model, it's attributes, and its associations
   */
  public deepClone<I extends Dream>(this: I): I {
    return cloneDeep(this)
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
      if (!associationDataKeys.includes(property)) clone[property] = cloneDeep(self[property])
    })

    associationDataKeys.forEach(associationDataKey => (clone[associationDataKey] = self[associationDataKey]))

    return clone as I
  }

  public async createAssociation<
    I extends Dream,
    SyncedAssociations extends I['syncedAssociations'],
    AssociationName extends keyof SyncedAssociations[I['table']],
    PossibleArrayAssociationType = I[AssociationName & keyof I],
    AssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
      ? ElementType
      : PossibleArrayAssociationType
  >(
    this: I,
    associationName: AssociationName,
    opts: UpdateablePropertiesForClass<AssociationType & typeof Dream> = {}
  ): Promise<NonNullable<AssociationType>> {
    return createAssociation(this, null, associationName, opts)
  }

  public async destroyAssociation<
    I extends Dream,
    SyncedAssociations extends I['syncedAssociations'],
    AssociationName extends keyof SyncedAssociations[I['table']],
    PossibleArrayAssociationType = I[AssociationName & keyof I],
    AssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
      ? ElementType
      : PossibleArrayAssociationType
  >(
    this: I,
    associationName: AssociationName,
    opts: UpdateablePropertiesForClass<AssociationType & typeof Dream> = {}
  ): Promise<number> {
    return destroyAssociation(this, null, associationName, opts)
  }

  public associationQuery<
    I extends Dream,
    SyncedAssociations extends I['syncedAssociations'],
    AssociationName extends keyof SyncedAssociations[I['table']]
  >(this: I, associationName: AssociationName) {
    return associationQuery(this, null, associationName)
  }

  public associationUpdateQuery<
    I extends Dream,
    SyncedAssociations extends I['syncedAssociations'],
    AssociationName extends keyof SyncedAssociations[I['table']]
  >(this: I, associationName: AssociationName) {
    return associationUpdateQuery(this, null, associationName)
  }

  public load<
    I extends Dream,
    TableName extends I['table'],
    SyncedAssociations extends I['syncedAssociations'],
    //
    A extends NextPreloadArgumentType<SyncedAssociations, TableName>,
    ATableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, TableName, A>,
    B extends NextPreloadArgumentType<SyncedAssociations, ATableName>,
    BTableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, ATableName, B>,
    C extends NextPreloadArgumentType<SyncedAssociations, BTableName>,
    CTableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, BTableName, C>,
    D extends NextPreloadArgumentType<SyncedAssociations, CTableName>,
    DTableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, CTableName, D>,
    E extends NextPreloadArgumentType<SyncedAssociations, DTableName>,
    ETableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, DTableName, E>,
    F extends NextPreloadArgumentType<SyncedAssociations, ETableName>,
    FTableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, ETableName, F>,
    G extends NextPreloadArgumentType<SyncedAssociations, FTableName>
  >(this: I, a: A, b?: B, c?: C, d?: D, e?: E, f?: F, g?: G): LoadBuilder<I> {
    return new LoadBuilder<I>(this).load(a as any, b as any, c as any, d as any, e as any, f as any, g as any)
  }

  public loaded<
    I extends Dream,
    TableName extends I['table'],
    SyncedAssociations extends I['syncedAssociations'],
    //
    A extends NextPreloadArgumentType<SyncedAssociations, TableName>
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

  public setAttributes<
    I extends Dream,
    DB extends I['DB'],
    SyncedAssociations extends I['syncedAssociations'],
    TableName extends keyof DB = I['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName]
  >(this: I, attributes: Updateable<Table> | AssociatedModelParam<I>) {
    const marshalledOpts = extractAttributesFromUpdateableProperties(
      this.constructor as DreamConstructorType<I>,
      attributes as any,
      this
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

  public txn<I extends Dream>(this: I, txn: DreamTransaction<I['DB']>): DreamInstanceTransactionBuilder<I> {
    return new DreamInstanceTransactionBuilder<I>(this, txn)
  }

  public async update<I extends Dream>(this: I, attributes: UpdateableProperties<I>): Promise<I> {
    this.setAttributes(attributes)
    // call save rather than _save so that any unsaved associations in the
    // attributes are saved with this model in a transaction
    return await this.save()
  }

  public _preventDeletion: boolean = false
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
    | WhereStatement<InstanceType<T>['DB'], InstanceType<T>['syncedAssociations'], InstanceType<T>['table']>
    | UpdateablePropertiesForClass<T>
}
