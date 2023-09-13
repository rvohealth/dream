import { CompiledQuery, SelectArg, SelectExpression, Updateable } from 'kysely'
import db from './db'
import { HasManyStatement } from './decorators/associations/has-many'
import { BelongsToStatement } from './decorators/associations/belongs-to'
import { HasOneStatement } from './decorators/associations/has-one'
import { ScopeStatement } from './decorators/scope'
import { HookStatement, blankHooksFactory } from './decorators/hooks/shared'
import ValidationStatement, { ValidationType } from './decorators/validations/shared'
import { ExtractTableAlias } from 'kysely/dist/cjs/parser/table-parser'
import { marshalDBValue } from './helpers/marshalDBValue'
import {
  AssociatedModelParam,
  WhereStatement,
  blankAssociationsFactory,
} from './decorators/associations/shared'
import { AssociationTableNames } from './db/reflections'
import CanOnlyPassBelongsToModelParam from './exceptions/associations/can-only-pass-belongs-to-model-param'
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
  AssociationNameToDotReference,
  FinalJoinsWherePluckArgumentType,
} from './dream/types'
import Query from './dream/query'
import runHooksFor from './dream/internal/runHooksFor'
import checkValidationsFor from './dream/internal/checkValidationsFor'
import DreamTransaction from './dream/transaction'
import DreamClassTransactionBuilder from './dream/class-transaction-builder'
import safelyRunCommitHooks from './dream/internal/safelyRunCommitHooks'
import saveDream from './dream/internal/saveDream'
import DreamInstanceTransactionBuilder from './dream/instance-transaction-builder'
import pascalize from './helpers/pascalize'
import getModelKey from './helpers/getModelKey'
import { VirtualAttributeStatement } from './decorators/virtual'
import ValidationError from './exceptions/validation-error'
import cachedTypeForAttribute from './helpers/db/cachedTypeForAttribute'
import isDecimal from './helpers/db/isDecimal'
import CannotPassNullOrUndefinedToRequiredBelongsTo from './exceptions/associations/cannot-pass-null-or-undefined-to-required-belongs-to'
import DreamSerializer from './serializer'
import MissingSerializer from './exceptions/missing-serializer'
import MissingTable from './exceptions/missing-table'
import CannotCreateAssociationWithThroughContext from './exceptions/associations/cannot-create-association-with-through-context'
import CannotDestroyAssociationWithThroughContext from './exceptions/associations/cannot-destroy-association-with-through-context'
import associationQuery from './dream/internal/associations/associationQuery'
import createAssociation from './dream/internal/associations/createAssociation'
import reload from './dream/internal/reload'
import destroyDream from './dream/internal/destroyDream'
import destroyAssociation from './dream/internal/associations/destroyAssociation'
import { DatabaseError } from 'pg'
import LoadBuilder from './dream/load-builder'
import { DbConnectionType } from './db/types'
import MissingDB from './exceptions/missing-db'

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
  } = blankHooksFactory(this)

  public static validations: ValidationStatement[] = []
  public static replicaSafe = false

  public static get isDream() {
    return true
  }

  public static get isSTIBase() {
    return !!this.extendedBy?.length && !this.isSTIChild
  }

  public static get isSTIChild() {
    return !!this.sti?.active
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
  >(): (keyof Table)[] {
    return (this.prototype.dbColumns as any)[this.prototype.table]
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
    const query: Query<T> = new Query<T>(this)
    return query.unscoped()
  }

  public static async all<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName],
    IdColumn = T['primaryKey'] & keyof Table
  >(this: T): Promise<InstanceType<T>[]> {
    const query: Query<T> = new Query<T>(this)
    return await query.all()
  }

  public static connection<T extends typeof Dream>(this: T, connection: DbConnectionType): Query<T> {
    const query: Query<T> = new Query<T>(this, { connection })
    return query
  }

  public static async count<T extends typeof Dream>(this: T): Promise<number> {
    const query: Query<T> = new Query<T>(this)
    return await query.count()
  }

  public static async max<
    DreamClass extends typeof Dream,
    I extends InstanceType<DreamClass>,
    TableName extends I['table'],
    DB extends I['DB'],
    SimpleFieldType extends keyof Updateable<DB[TableName]>
  >(this: DreamClass, field: SimpleFieldType): Promise<number> {
    const query: Query<DreamClass> = new Query<DreamClass>(this)
    return await query.max(field as any)
  }

  public static async min<
    DreamClass extends typeof Dream,
    I extends InstanceType<DreamClass>,
    TableName extends I['table'],
    DB extends I['DB'],
    SimpleFieldType extends keyof Updateable<DB[TableName]>
  >(this: DreamClass, field: SimpleFieldType): Promise<number> {
    const query: Query<DreamClass> = new Query<DreamClass>(this)
    return await query.min(field as any)
  }

  public static async create<T extends typeof Dream>(this: T, opts?: UpdateablePropertiesForClass<T>) {
    return (await new (this as any)(opts as any).save()) as InstanceType<T>
  }

  public static async createOrFindBy<T extends typeof Dream>(
    this: T,
    opts: WhereStatement<
      InstanceType<T>['DB'],
      InstanceType<T>['syncedAssociations'],
      InstanceType<T>['table']
    >,
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
        return await this.findBy(opts)
      throw err
    }
  }

  public static async find<
    T extends typeof Dream,
    InterpretedDB extends InstanceType<T>['interpretedDB'],
    TableName extends keyof InterpretedDB = InstanceType<T>['table'] & keyof InterpretedDB
  >(
    this: T,
    id: InterpretedDB[TableName][T['primaryKey'] & keyof InterpretedDB[TableName]]
  ): Promise<(InstanceType<T> & Dream) | null> {
    const query: Query<T> = new Query<T>(this)
    return await query.find(id)
  }

  public static async findBy<T extends typeof Dream>(
    this: T,
    attributes: WhereStatement<
      InstanceType<T>['DB'],
      InstanceType<T>['syncedAssociations'],
      InstanceType<T>['table']
    >
  ): Promise<(InstanceType<T> & Dream) | null> {
    const query: Query<T> = new Query<T>(this)
    return await query.findBy(attributes)
  }

  public static async findOrCreateBy<T extends typeof Dream>(
    this: T,
    opts: WhereStatement<
      InstanceType<T>['DB'],
      InstanceType<T>['syncedAssociations'],
      InstanceType<T>['table']
    >,
    extraOpts: CreateOrFindByExtraOps<T> = {}
  ) {
    const existingRecord = await this.findBy(opts)
    if (existingRecord) return existingRecord

    return (await new (this as any)({
      ...opts,
      ...(extraOpts?.createWith || {}),
    }).save()) as InstanceType<T>
  }

  public static async first<T extends typeof Dream>(this: T): Promise<InstanceType<T> | null> {
    const query: Query<T> = new Query<T>(this)
    return (await query.first()) as (InstanceType<T> & Dream) | null
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
    //
    G extends FTableName extends undefined
      ? undefined
      : (keyof SyncedAssociations[FTableName & keyof SyncedAssociations] & string)[]
  >(this: T, a: A, b?: B, c?: C, d?: D, e?: E, f?: F, g?: G) {
    const query: Query<T> = new Query<T>(this)

    return query.preload(a as any, b as any, c as any, d as any, e as any, f as any, g as any)
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
    //
    G extends FTableName extends undefined
      ? undefined
      : WhereStatement<DB, SyncedAssociations, FTableName & AssociationTableNames<DB, SyncedAssociations>>
  >(this: T, a: A, b?: B, c?: C, d?: D, e?: E, f?: F, g?: G) {
    const query: Query<T> = new Query<T>(this)

    return query.joins(a as any, b as any, c as any, d as any, e as any, f as any, g as any)
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
    const query: Query<T> = new Query<T>(this)

    return await query.joinsPluck(a as any, b as any, c as any, d as any, e as any, f as any, g as any)
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
    I extends InstanceType<T>,
    DB extends I['DB'],
    SE extends SelectExpression<DB, ExtractTableAlias<DB, InstanceType<T>['table']>>
  >(this: T, selection: SelectArg<DB, ExtractTableAlias<DB, InstanceType<T>['table']>, SE>) {
    let query: Query<T> = new Query<T>(this)
    return query.nestedSelect(selection as any)
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
    let query: Query<T> = new Query<T>(this)
    query = query.order(column as any, direction)
    return query
  }

  public static async pluck<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    SE extends SelectExpression<DB, ExtractTableAlias<DB, I['table']>>
  >(this: T, ...fields: SelectArg<DB, ExtractTableAlias<DB, I['table']>, SE>[]) {
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

    const res = await db('primary')
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
    return new Query<T>(this).where(attributes)
  }

  public static whereNot<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    SyncedAssociations extends I['syncedAssociations'],
    TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB = InstanceType<T>['table']
  >(this: T, attributes: WhereStatement<DB, SyncedAssociations, TableName>): Query<T> {
    return new Query<T>(this).whereNot(attributes)
  }

  public static new<T extends typeof Dream>(this: T, opts?: UpdateablePropertiesForClass<T>) {
    return new this(opts as any) as InstanceType<T>
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

  public get interpretedDB(): any {
    throw 'must have get interpretedDB defined on child'
  }

  public get dbColumns(): any {
    throw 'must have get dbColumns defined on child'
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
      const associationMetadata = this.associationMap()[associationName]
      const associationRecord = (this as any)[associationName] as Dream | undefined
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
  private dreamTransaction: DreamTransaction<any> | null = null
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

  public cachedTypeFor<
    I extends Dream,
    DB extends I['DB'],
    SyncedAssociations extends I['syncedAssociations'],
    TableName extends keyof DB = I['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName]
  >(this: I, attribute: keyof Table): string {
    return cachedTypeForAttribute<DB, SyncedAssociations>(attribute, { table: this.table })
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
    return (
      (this.frozenAttributes as any)[attribute] === undefined ||
      (this.frozenAttributes as any)[attribute] !== (this.attributes() as any)[attribute]
    )
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
    return isDecimal<DB, SyncedAssociations>(attribute, { table: this.table })
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
    //
    G extends FTableName extends undefined
      ? undefined
      : (keyof SyncedAssociations[FTableName & keyof SyncedAssociations] & string)[]
  >(this: I, a: A, b?: B, c?: C, d?: D, e?: E, f?: F, g?: G): LoadBuilder<I> {
    return new LoadBuilder<I>(this).load(a as any, b as any, c as any, d as any, e as any, f as any, g as any)
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
    const self = this as any
    const marshalledOpts: any = {}
    Object.keys(attributes as any).forEach(attr => {
      const associationMetaData = this.associationMap()[attr]

      if (associationMetaData && associationMetaData.type !== 'BelongsTo') {
        throw new CanOnlyPassBelongsToModelParam(self.constructor, associationMetaData)
      } else if (associationMetaData) {
        const belongsToAssociationMetaData = associationMetaData as BelongsToStatement<any, any, any>
        const associatedObject = (attributes as any)[attr]
        self[attr] = associatedObject

        if (!(associationMetaData as BelongsToStatement<any, any, any>).optional && !associatedObject)
          throw new CannotPassNullOrUndefinedToRequiredBelongsTo(
            this.constructor as DreamConstructorType<I>,
            associationMetaData as BelongsToStatement<any, any, any>
          )

        const foreignKey = belongsToAssociationMetaData.foreignKey()
        self[foreignKey] = marshalledOpts[foreignKey] = associatedObject?.primaryKeyValue
        if (belongsToAssociationMetaData.polymorphic) {
          const foreignKeyTypeField = belongsToAssociationMetaData.foreignKeyTypeField()
          self[foreignKeyTypeField] = marshalledOpts[foreignKeyTypeField] =
            associatedObject?.constructor?.name
        }
      } else {
        // TODO: cleanup type chaos
        self[attr] = marshalledOpts[attr] = marshalDBValue<DB, SyncedAssociations>(
          (attributes as any)[attr],
          {
            column: attr as any,
            table: this.table,
          }
        )
      }
    })

    return marshalledOpts
  }

  public async save<I extends Dream>(this: I): Promise<I> {
    if (this.hasUnsavedAssociations) {
      await Dream.transaction(async txn => {
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
