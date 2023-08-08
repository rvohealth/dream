import { CompiledQuery, SelectArg, SelectExpression, Updateable } from 'kysely'
import db from './db'
import { DB, DBColumns, InterpretedDB } from './sync/schema'
import { HasManyStatement } from './decorators/associations/has-many'
import { BelongsToStatement } from './decorators/associations/belongs-to'
import { HasOneStatement } from './decorators/associations/has-one'
import { ScopeStatement } from './decorators/scope'
import { HookStatement, blankHooksFactory } from './decorators/hooks/shared'
import ValidationStatement, { ValidationType } from './decorators/validations/shared'
import { ExtractTableAlias } from 'kysely/dist/cjs/parser/table-parser'
import { marshalDBValue } from './helpers/marshalDBValue'
import { SyncedAssociations } from './sync/associations'
import {
  AssociatedModelParam,
  WhereStatement,
  blankAssociationsFactory,
} from './decorators/associations/shared'
import { AssociationTableNames } from './db/reflections'
import CanOnlyPassBelongsToModelParam from './exceptions/associations/can-only-pass-belongs-to-model-param'
import {
  AssociationExpression,
  DreamConstructorType,
  IdType,
  UpdateableFields,
  UpdateableInstanceFields,
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
import CannotCastToNonSTIChild from './exceptions/sti/cannot-cast-to-non-sti-child'
import CannotCastNonSTIModelToChild from './exceptions/sti/cannot-cast-non-sti-model-to-child'
import CannotCreateAssociationWithThroughContext from './exceptions/associations/cannot-create-association-with-through-context'
import CannotDestroyAssociationWithThroughContext from './exceptions/associations/cannot-destroy-association-with-through-context'
import associationQuery from './dream/internal/associations/associationQuery'
import createAssociation from './dream/internal/associations/createAssociation'
import reload from './dream/internal/reload'
import destroyDream from './dream/internal/destroyDream'
import destroyAssociation from './dream/internal/associations/destroyAssociation'
import { DatabaseError } from 'pg'

export default class Dream {
  public static get primaryKey(): string {
    return 'id'
  }

  public static createdAtField = 'createdAt'

  public static associations: {
    belongsTo: BelongsToStatement<any>[]
    hasMany: HasManyStatement<any>[]
    hasOne: HasOneStatement<any>[]
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

  public static get isDream() {
    return true
  }

  public static get isSTIBase() {
    return !!this.extendedBy?.length
  }

  public static get isSTIChild() {
    return !!this.sti?.active
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

  public static unscoped<T extends typeof Dream>(this: T) {
    const query: Query<T> = new Query<T>(this)
    return query.unscoped()
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

  public static async max<
    DreamClass extends typeof Dream,
    TableName extends InstanceType<DreamClass>['table'],
    SimpleFieldType extends keyof Updateable<DB[TableName]>
  >(this: DreamClass, field: SimpleFieldType): Promise<number> {
    const query: Query<DreamClass> = new Query<DreamClass>(this)
    return await query.max(field as any)
  }

  public static async min<
    DreamClass extends typeof Dream,
    TableName extends InstanceType<DreamClass>['table'],
    SimpleFieldType extends keyof Updateable<DB[TableName]>
  >(this: DreamClass, field: SimpleFieldType): Promise<number> {
    const query: Query<DreamClass> = new Query<DreamClass>(this)
    return await query.min(field as any)
  }

  public static async create<T extends typeof Dream>(this: T, opts?: UpdateableFields<T>) {
    return (await new (this as any)(opts as any).save()) as InstanceType<T>
  }

  public static async createOrFindBy<T extends typeof Dream>(
    this: T,
    opts: WhereStatement<InstanceType<T>['table']>,
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
    attributes: WhereStatement<InstanceType<T>['table']>
  ): Promise<(InstanceType<T> & Dream) | null> {
    const query: Query<T> = new Query<T>(this)
    return await query.findBy(attributes)
  }

  public static async findOrCreateBy<T extends typeof Dream>(
    this: T,
    opts: WhereStatement<InstanceType<T>['table']>,
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

  public static includes<
    T extends typeof Dream,
    TableName extends AssociationTableNames = InstanceType<T>['table'],
    QueryAssociationExpression extends AssociationExpression<
      TableName & AssociationTableNames,
      any
    > = AssociationExpression<TableName & AssociationTableNames, any>
  >(this: T, ...associations: QueryAssociationExpression[]) {
    const query: Query<T> = new Query<T>(this)

    return query.includes(...(associations as any))
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

  public static new<T extends typeof Dream>(this: T, opts?: UpdateableFields<T>) {
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
    throw new MissingTable(this.constructor as typeof Dream)
  }

  public get serializer(): typeof DreamSerializer {
    throw new MissingSerializer(this.constructor as typeof Dream)
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
  public originalAttributes: { [key: string]: any } = {}
  public attributesFromBeforeLastSave: { [key: string]: any } = {}
  private dreamTransaction: DreamTransaction | null = null
  constructor(opts?: Updateable<DB[keyof DB]>) {
    if (opts) {
      this.setAttributes(opts)

      // if id is set, then we freeze attributes after setting them, so that
      // any modifications afterwards will indicate updates.
      if (this.isPersisted) {
        this.freezeAttributes()
        this.originalAttributes = opts
      } else {
        ;(this.constructor as typeof Dream).columns().forEach(column => {
          this.originalAttributes[column] = undefined
        })
      }
    }
  }

  public as<T extends typeof Dream>(dreamClass: T): InstanceType<T> {
    const construct = this.constructor as typeof Dream
    if (!construct.isSTIBase) throw new CannotCastToNonSTIChild(construct, dreamClass)

    const extendedBy = construct.extendedBy!
    if (!extendedBy.includes(dreamClass)) throw new CannotCastToNonSTIChild(construct, dreamClass)

    return dreamClass.new(this.attributes() as any)
  }

  public asChild<I extends Dream, T extends typeof Dream>(this: I) {
    const construct = this.constructor as typeof Dream
    if (!construct.isSTIBase) throw new CannotCastNonSTIModelToChild(construct)

    const extendedBy = construct.extendedBy!
    if (!extendedBy) throw new CannotCastNonSTIModelToChild(construct)

    const dreamClass = extendedBy.find(d => d.name === (this as any).type) as typeof Dream | null
    if (!dreamClass) throw new CannotCastNonSTIModelToChild(construct)

    return dreamClass.new(this.attributes() as any)
  }

  public attributes<I extends Dream>(this: I): Updateable<DB[I['table']]> {
    const obj: Updateable<DB[I['table']]> = {}
    ;(this.constructor as typeof Dream).columns().forEach(column => {
      ;(obj as any)[column] = (this as any)[column]
    })
    return obj
  }

  public cachedTypeFor<
    I extends Dream,
    TableName extends keyof DB = I['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName]
  >(this: I, attribute: keyof Table): string {
    return cachedTypeForAttribute(attribute, { table: this.table })
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

  public changes<
    I extends Dream,
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
    TableName extends AssociationTableNames = I['table'] & AssociationTableNames,
    Table extends DB[keyof DB] = DB[TableName],
    Attr extends keyof Updateable<Table> = keyof Updateable<Table>
  >(this: I, attribute: Attr): Updateable<Table>[Attr] {
    if (Object.keys(this.dirtyAttributes()).includes(attribute as string)) {
      return (this.frozenAttributes as any)[attribute]
    } else if (this.isPersisted) {
      return (this.attributesFromBeforeLastSave as any)[attribute]
    } else {
      return (this.originalAttributes as any)[attribute]
    }
  }

  public columns<
    I extends Dream,
    TableName extends keyof DB = I['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName]
  >(): (keyof Table)[] {
    return (this.constructor as typeof Dream).columns()
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

  public async destroy<I extends Dream, TableName extends keyof DB = I['table'] & keyof DB>(
    this: I
  ): Promise<I> {
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
    TableName extends keyof DB = I['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName]
  >(this: I, attribute: keyof Table): boolean {
    return isDecimal(attribute, { table: this.table })
  }

  public async createAssociation<
    I extends Dream,
    AssociationName extends keyof SyncedAssociations[I['table']],
    PossibleArrayAssociationType = I[AssociationName & keyof I],
    AssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
      ? ElementType
      : PossibleArrayAssociationType
  >(
    this: I,
    associationName: AssociationName,
    opts: UpdateableFields<AssociationType & typeof Dream> = {}
  ): Promise<NonNullable<AssociationType>> {
    return createAssociation(this, null, associationName, opts)
  }

  public async destroyAssociation<
    I extends Dream,
    AssociationName extends keyof SyncedAssociations[I['table']],
    PossibleArrayAssociationType = I[AssociationName & keyof I],
    AssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
      ? ElementType
      : PossibleArrayAssociationType
  >(
    this: I,
    associationName: AssociationName,
    opts: UpdateableFields<AssociationType & typeof Dream> = {}
  ): Promise<number> {
    return destroyAssociation(this, null, associationName, opts)
  }

  public associationQuery<I extends Dream, AssociationName extends keyof SyncedAssociations[I['table']]>(
    this: I,
    associationName: AssociationName
  ) {
    return associationQuery(this, null, associationName)
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
    return reload(this)
  }

  public serialize<I extends Dream>(this: I, { casing = null }: { casing?: 'camel' | 'snake' | null } = {}) {
    const serializer = new this.serializer(this)
    if (casing) serializer.casing(casing)
    return serializer.render()
  }

  public setAttributes<
    I extends Dream,
    TableName extends keyof DB = I['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName]
  >(this: I, attributes: Updateable<Table> | AssociatedModelParam<I>) {
    const self = this as any
    Object.keys(attributes as any).forEach(attr => {
      const associationMetaData = this.associationMap[attr]

      if (associationMetaData && associationMetaData.type !== 'BelongsTo') {
        throw new CanOnlyPassBelongsToModelParam(self.constructor, associationMetaData)
      } else if (associationMetaData) {
        const belongsToAssociationMetaData = associationMetaData as BelongsToStatement<any>
        const associatedObject = (attributes as any)[attr]
        self[attr] = associatedObject

        if (!(associationMetaData as BelongsToStatement<any>).optional && !associatedObject)
          throw new CannotPassNullOrUndefinedToRequiredBelongsTo(
            this.constructor as typeof Dream,
            associationMetaData as BelongsToStatement<any>
          )

        self[belongsToAssociationMetaData.foreignKey()] = associatedObject?.primaryKeyValue
        if (belongsToAssociationMetaData.polymorphic)
          self[belongsToAssociationMetaData.foreignKeyTypeField()] = associatedObject?.constructor?.name
      } else {
        // TODO: cleanup type chaos
        self[attr] = marshalDBValue((attributes as any)[attr], { column: attr as any, table: this.table })
      }
    })
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

  public txn<I extends Dream>(this: I, txn: DreamTransaction): DreamInstanceTransactionBuilder<I> {
    return new DreamInstanceTransactionBuilder<I>(this, txn)
  }

  public async update<I extends Dream>(this: I, attributes: UpdateableInstanceFields<I>): Promise<I> {
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
  createWith?: WhereStatement<InstanceType<T>['table']> | UpdateableFields<T>
}
