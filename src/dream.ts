import {
  CompiledQuery,
  DeleteQueryBuilder,
  InsertQueryBuilder,
  SelectQueryBuilder,
  Updateable,
  UpdateQueryBuilder,
} from 'kysely'
import { DateTime } from 'luxon'

import { DatabaseError } from 'pg'
import db from './db'
import { AssociationTableNames } from './db/reflections'
import { DbConnectionType } from './db/types'
import associationToGetterSetterProp from './decorators/associations/associationToGetterSetterProp'
import BelongsTo, { BelongsToOptions, BelongsToStatement } from './decorators/associations/belongs-to'
import HasMany, {
  HasManyOptions,
  HasManyStatement,
  HasManyThroughOptions,
} from './decorators/associations/has-many'
import HasOne, {
  HasOneOptions,
  HasOneStatement,
  HasOneThroughOptions,
} from './decorators/associations/has-one'
import {
  blankAssociationsFactory,
  PassthroughWhere,
  WhereStatement,
  WhereStatementForAssociation,
} from './decorators/associations/shared'
import AfterCreate from './decorators/hooks/after-create'
import AfterCreateCommit from './decorators/hooks/after-create-commit'
import AfterDestroy from './decorators/hooks/after-destroy'
import AfterDestroyCommit from './decorators/hooks/after-destroy-commit'
import AfterSave from './decorators/hooks/after-save'
import AfterSaveCommit from './decorators/hooks/after-save-commit'
import AfterUpdate from './decorators/hooks/after-update'
import AfterUpdateCommit from './decorators/hooks/after-update-commit'
import BeforeCreate from './decorators/hooks/before-create'
import BeforeDestroy from './decorators/hooks/before-destroy'
import BeforeSave from './decorators/hooks/before-save'
import BeforeUpdate from './decorators/hooks/before-update'
import { AfterHookOpts, BeforeHookOpts, blankHooksFactory, HookStatement } from './decorators/hooks/shared'
import { ScopeStatement } from './decorators/scope'
import Sortable, { SortableFieldConfig } from './decorators/sortable'
import resortAllRecords from './decorators/sortable/helpers/resortAllRecords'
import ValidationStatement, { ValidationType } from './decorators/validations/shared'
import { VirtualAttributeStatement } from './decorators/virtual'
import DreamClassTransactionBuilder from './dream/class-transaction-builder'
import DreamInstanceTransactionBuilder from './dream/instance-transaction-builder'
import associationQuery from './dream/internal/associations/associationQuery'
import associationUpdateQuery from './dream/internal/associations/associationUpdateQuery'
import createAssociation from './dream/internal/associations/createAssociation'
import destroyAssociation from './dream/internal/associations/destroyAssociation'
import undestroyAssociation from './dream/internal/associations/undestroyAssociation'
import destroyDream from './dream/internal/destroyDream'
import {
  DestroyOptions,
  destroyOptions,
  reallyDestroyOptions,
  undestroyOptions,
} from './dream/internal/destroyOptions'
import ensureSTITypeFieldIsSet from './dream/internal/ensureSTITypeFieldIsSet'
import reload from './dream/internal/reload'
import runValidations from './dream/internal/runValidations'
import saveDream from './dream/internal/saveDream'
import {
  DEFAULT_BYPASS_ALL_DEFAULT_SCOPES,
  DEFAULT_DEFAULT_SCOPES_TO_BYPASS,
} from './dream/internal/scopeHelpers'
import undestroyDream from './dream/internal/undestroyDream'
import LoadBuilder from './dream/load-builder'
import Query, { FindEachOpts } from './dream/query'
import DreamTransaction from './dream/transaction'
import {
  AllDefaultScopeNames,
  AttributeKeys,
  DefaultOrNamedScopeName,
  DreamAssociationNamesWithoutRequiredWhereClauses,
  DreamAssociationNamesWithRequiredWhereClauses,
  DreamAssociationType,
  DreamAttributes,
  DreamBelongsToAssociationMetadata,
  DreamColumnNames,
  DreamConstructorType,
  DreamParamSafeColumnNames,
  DreamRegisterable,
  DreamSerializeOptions,
  FinalVariadicTableName,
  IdType,
  NextPreloadArgumentType,
  OrderDir,
  PassthroughColumnNames,
  TableColumnNames,
  TableColumnType,
  UpdateableAssociationProperties,
  UpdateableProperties,
  UpdateablePropertiesForClass,
  VariadicCountThroughArgs,
  VariadicJoinsArgs,
  VariadicLoadArgs,
  VariadicMinMaxThroughArgs,
  VariadicPluckEachThroughArgs,
  VariadicPluckThroughArgs,
} from './dream/types'
import { getCachedDreamconfOrFail } from './dreamconf/cache'
import CanOnlyPassBelongsToModelParam from './exceptions/associations/can-only-pass-belongs-to-model-param'
import CannotPassNullOrUndefinedToRequiredBelongsTo from './exceptions/associations/cannot-pass-null-or-undefined-to-required-belongs-to'
import NonLoadedAssociation from './exceptions/associations/non-loaded-association'
import CannotCallUndestroyOnANonSoftDeleteModel from './exceptions/cannot-call-undestroy-on-a-non-soft-delete-model'
import CreateOrFindByFailedToCreateAndFind from './exceptions/create-or-find-by-failed-to-create-and-find'
import MissingSerializer from './exceptions/missing-serializer'
import MissingTable from './exceptions/missing-table'
import NonExistentScopeProvidedToResort from './exceptions/non-existent-scope-provided-to-resort'
import CalendarDate from './helpers/CalendarDate'
import cloneDeepSafe from './helpers/cloneDeepSafe'
import cachedTypeForAttribute from './helpers/db/cachedTypeForAttribute'
import isJsonColumn from './helpers/db/types/isJsonColumn'
import getModelKey from './helpers/getModelKey'
import inferSerializerFromDreamOrViewModel from './helpers/inferSerializerFromDreamOrViewModel'
import { marshalDBValue } from './helpers/marshalDBValue'
import pascalize from './helpers/pascalize'
import { EnvOpts } from './helpers/path/types'
import { isString } from './helpers/typechecks'
import DreamSerializer from './serializer'

export default class Dream {
  public DB: any

  public get env(): EnvOpts {
    throw new Error('Must define env getter in ApplicationModel')
  }

  public get schema(): any {
    throw new Error('Must define schema getter in ApplicationModel')
  }

  public get globalSchema(): any {
    throw new Error('Must define schema getter in ApplicationModel')
  }

  /**
   * Shadows #primaryKey, a getter which can be overwritten to customize the id field
   * for a given model.
   *
   * @returns string
   */
  public static get primaryKey() {
    return this.prototype.primaryKey
  }

  /**
   * Shadows #table, a getter which can be overwritten to customize the table field
   * for a given model.
   *
   * @returns string
   */
  public static get table() {
    return this.prototype.table
  }

  /**
   * Registers core options within dream.
   *
   * if 'serializers' is passed as the type,
   * then the object provided will become
   * the new list of allowed serializers for this
   * model.
   *
   * Once implemented, you will need to make sure
   * to sync up your types, since Dream introspects
   * the keys provided in the serializers object
   * and stores them within the `db/schema.ts` file,
   * enabling us to provide autocomplete for serializer
   * keys. this can be done by running the following
   * in the cli:
   *
   * ```bash
   * NODE_ENV=test yarn psy sync
   * ```
   */
  public static register<T extends DreamRegisterable>(
    type: T,
    opts: T extends 'serializers' ? Record<string, typeof DreamSerializer> : never
  ) {
    switch (type) {
      case 'serializers':
        this.serializers = opts
        break

      default:
        throw new Error(`unexpected type passed to ${this.name}.register: "${type}"`)
    }
  }
  private static serializers: Record<string, typeof DreamSerializer> = {}

  /**
   * A getter which can be overwritten to customize the automatic createdAt timestamp field
   * for a given model.
   *
   * ```ts
   *  class User extends ApplicationModel {
   *    public get createdAtField() {
   *       return 'createdAtTimestamp' as const
   *    }
   *  }
   *
   * const user = await User.first()
   * user.createdAtTimestamp // returns the DateTime that this user was created
   *
   * @returns string
   */
  public get createdAtField(): Readonly<string> {
    return 'createdAt' as const
  }

  /**
   * A getter which can be overwritten to customize the automatic updatedAt timestamp field
   * for a given model.
   *
   * ```ts
   *  class User extends ApplicationModel {
   *    public get updatedAtField() {
   *       return 'updatedAtTimestamp' as const
   *    }
   *  }
   *
   * const user = await User.first()
   * user.updatedAtTimestamp // returns the DateTime that this user was updated
   * ```
   *
   * @returns string
   */
  public get updatedAtField(): Readonly<string> {
    return 'updatedAt' as const
  }

  public get deletedAtField(): Readonly<string> {
    return 'deletedAt' as const
  }

  /**
   * @internal
   *
   * Model storage for association metadata, set when using the association decorators like:
   *   @HasOne
   *   @HasMany
   *   @BelongsTo
   */
  protected static associationMetadataByType: {
    belongsTo: BelongsToStatement<any, any, any, any>[]
    hasMany: HasManyStatement<any, any, any, any>[]
    hasOne: HasOneStatement<any, any, any, any>[]
  } = blankAssociationsFactory(this)

  /**
   * @internal
   *
   * Model storage for scope metadata, set when using the @Scope decorator
   */
  protected static scopes: {
    default: ScopeStatement[]
    named: ScopeStatement[]
  } = {
    default: [],
    named: [],
  }

  /**
   * @internal
   *
   * Model storage for virtual attribute metadata, set when using the @Virtual decorator
   */
  protected static virtualAttributes: VirtualAttributeStatement[] = []

  /**
   * @internal
   *
   * Model storage for sortable metadata, set when using the @Sortable decorator
   */
  protected static sortableFields: SortableFieldConfig[] = []

  /**
   * @internal
   *
   * Model storage for STI metadata, set when using the @STI decorator
   */
  protected static extendedBy: (typeof Dream)[] | null = null

  /**
   * @internal
   *
   * Model storage for STI metadata, set when using the @STI decorator
   */
  protected static sti: {
    active: boolean
    baseClass: typeof Dream | null
    value: string | null
  } = {
    active: false,
    baseClass: null,
    value: null,
  }

  /**
   * @internal
   *
   * Model storage for model hook metadata, set when using the following decorators:
   *   @BeforeCreate
   *   @BeforeUpdate
   *   @BeforeSave
   *   @BeforeDestroy
   *   @AfterCreate
   *   @AfterCreateCommit
   *   @AfterUpdate
   *   @AfterUpdateCommit
   *   @AfterSave
   *   @AfterSaveCommit
   *   @AfterDestroy
   *   @AfterDestroyCommit
   */
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

  /**
   * @internal
   *
   * Model storage for validation metadata, set when using the @Validates decorator
   */
  protected static validations: ValidationStatement[] = []

  /**
   * @internal
   *
   * model storage for custom validation metadata, set when using the @Validate decorator
   */
  protected static customValidations: string[] = []

  /**
   * @internal
   *
   * Model storage for replica-safe metadata, set when using the @ReplicaSafe decorator
   */
  protected static replicaSafe = false

  /**
   * @internal
   *
   * Model storage for soft-delete metadata, set when using the @SoftDelete decorator
   */
  protected static softDelete = false

  /**
   * @internal
   *
   * Provided to distinguish between Dream and other classes
   *
   * @returns true
   */
  public static get isDream() {
    return true
  }

  /**
   * @internal
   *
   * Returns true if this model class is the base class of other STI models
   *
   * @returns boolean
   */
  protected static get isSTIBase() {
    return !!this.extendedBy?.length && !this.isSTIChild
  }

  /**
   * @internal
   *
   * Returns true if this model class a child class of a base STI model
   *
   * @returns boolean
   */
  protected static get isSTIChild() {
    return !!this.sti?.active
  }

  /**
   * @internal
   *
   * Returns either the base STI class, or else this class
   *
   * @returns A dream class
   */
  protected static get stiBaseClassOrOwnClass(): typeof Dream {
    return this.sti.baseClass || this
  }

  /**
   * @internal
   *
   * Shadows .stiBaseClassOrOwnClass. Returns either the base STI class, or else this class
   *
   * @returns A dream class
   */
  protected get stiBaseClassOrOwnClass(): typeof Dream {
    return (this.constructor as typeof Dream).stiBaseClassOrOwnClass
  }

  /**
   * @internal
   *
   * Used by model hook decorators to apply a hook to a specific model.
   *
   * @param hookType - the type of hook you want to attach the provided statement to
   * @param statement - the statement to couple to the provided hookType
   * @returns void
   */
  protected static addHook(hookType: keyof typeof this.hooks, statement: HookStatement) {
    const existingHook = this.hooks[hookType].find(hook => hook.method === statement.method)
    if (existingHook) return

    this.hooks[hookType] = [...this.hooks[hookType], statement]
  }

  /**
   * Shortcut to the @BelongsTo decorator, which also provides extra type protection which cannot be provided
   * with the @BelongsTo decorator.
   *
   * @param modelCB - a function that immediately returns the dream class you are associating with this dream class
   * @param options - the options you want to use to apply to this association
   * @returns A BelongsTo decorator
   */
  public static BelongsTo<T extends typeof Dream, AssociationDreamClass extends typeof Dream = typeof Dream>(
    this: T,
    modelCB: () => AssociationDreamClass,
    options: BelongsToOptions<InstanceType<T>, AssociationDreamClass> = {}
  ) {
    return BelongsTo<InstanceType<T>, AssociationDreamClass>(modelCB, options)
  }

  ///////////
  // HasMany
  ///////////
  public static HasMany<T extends typeof Dream, AssociationDreamClass extends typeof Dream = typeof Dream>(
    this: T,
    modelCB: () => AssociationDreamClass,
    options?: HasManyOptions<InstanceType<T>, AssociationDreamClass>
  ): any

  public static HasMany<T extends typeof Dream, AssociationDreamClass extends typeof Dream = typeof Dream>(
    this: T,
    modelCB: () => AssociationDreamClass,
    options?: HasManyThroughOptions<InstanceType<T>, AssociationDreamClass>
  ): any

  /**
   * Shortcut to the @HasMany decorator, which also provides extra type protection which cannot be provided
   * with the @HasMany decorator.
   *
   * @param modelCB - a function that immediately returns the dream class you are associating with this dream class
   * @param options - the options you want to use to apply to this association
   * @returns A HasMany decorator
   */
  public static HasMany<T extends typeof Dream, AssociationDreamClass extends typeof Dream = typeof Dream>(
    this: T,
    modelCB: () => AssociationDreamClass,
    options: unknown = {}
  ): any {
    return HasMany<InstanceType<T>, AssociationDreamClass>(modelCB, options as any)
  }
  ///////////////
  // end: HasMany
  //////////////

  ///////////
  // HasOne
  ///////////
  public static HasOne<T extends typeof Dream, AssociationDreamClass extends typeof Dream = typeof Dream>(
    this: T,
    modelCB: () => AssociationDreamClass,
    options?: HasOneOptions<InstanceType<T>, AssociationDreamClass>
  ): any

  public static HasOne<T extends typeof Dream, AssociationDreamClass extends typeof Dream = typeof Dream>(
    this: T,
    modelCB: () => AssociationDreamClass,
    options?: HasOneThroughOptions<InstanceType<T>, AssociationDreamClass>
  ): any

  /**
   * Shortcut to the @HasOne decorator, which also provides extra type protection which cannot be provided
   * with the @HasOne decorator.
   *
   * @param modelCB - A function that immediately returns the dream class you are associating with this dream class
   * @param options - The options you want to use to apply to this association
   * @returns A HasOne decorator
   */
  public static HasOne<T extends typeof Dream, AssociationDreamClass extends typeof Dream = typeof Dream>(
    this: T,
    modelCB: () => AssociationDreamClass,
    options: unknown = {}
  ): any {
    return HasOne<InstanceType<T>, AssociationDreamClass>(modelCB, options as any)
  }
  //////////////
  // end: HasOne
  //////////////

  /**
   * Shortcut to the @Sortable decorator, which also provides extra type protection which cannot be provided
   * with the @Sortable decorator.
   *
   * @param scope - The column, association, or combination there-of which you would like to restrict the incrementing logic to
   * @returns A Sortable decorator
   */
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

  /**
   * Shortcut to the @BeforeCreate decorator
   *
   * ```ts
   * class User {
   *   User.BeforeCreate()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The BeforeCreate decorator
   *
   */
  public static BeforeCreate<T extends typeof Dream>(this: T, opts: BeforeHookOpts<InstanceType<T>>) {
    return BeforeCreate<InstanceType<T>>(opts)
  }

  /**
   * Shortcut to the @BeforeSave decorator
   *
   * ```ts
   * class User {
   *   User.BeforeSave()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The BeforeSave decorator
   *
   */
  public static BeforeSave<T extends typeof Dream>(this: T, opts: BeforeHookOpts<InstanceType<T>>) {
    return BeforeSave<InstanceType<T>>(opts)
  }

  /**
   * Shortcut to the @BeforeUpdate decorator
   *
   * ```ts
   * class User {
   *   User.BeforeUpdate()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The BeforeUpdate decorator
   *
   */
  public static BeforeUpdate<T extends typeof Dream>(this: T, opts: BeforeHookOpts<InstanceType<T>>) {
    return BeforeUpdate<InstanceType<T>>(opts)
  }

  /**
   * Shortcut to the @BeforeDestroy decorator
   *
   * ```ts
   * class User {
   *   User.BeforeDestroy()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The BeforeDestroy decorator
   */
  public static BeforeDestroy<T extends typeof Dream>(this: T) {
    return BeforeDestroy()
  }

  /**
   * Shortcut to the @AfterCreate decorator
   *
   * ```ts
   * class User {
   *   User.AfterCreate()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The AfterCreate decorator
   *
   */
  public static AfterCreate<T extends typeof Dream>(this: T, opts: AfterHookOpts<InstanceType<T>>) {
    return AfterCreate<InstanceType<T>>(opts)
  }

  /**
   * Shortcut to the @AfterCreateCommit decorator
   *
   * ```ts
   * class User {
   *   User.AfterCreateCommit()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The AfterCreateCommit decorator
   */
  public static AfterCreateCommit<T extends typeof Dream>(this: T, opts: AfterHookOpts<InstanceType<T>>) {
    return AfterCreateCommit<InstanceType<T>>(opts)
  }

  /**
   * Shortcut to the @AfterSave decorator
   *
   * ```ts
   * class User {
   *   User.AfterSave()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The AfterSave decorator
   *
   */
  public static AfterSave<T extends typeof Dream>(this: T, opts: AfterHookOpts<InstanceType<T>>) {
    return AfterSave<InstanceType<T>>(opts)
  }

  /**
   * Shortcut to the @AfterSaveCommit decorator
   *
   * ```ts
   * class User {
   *   User.AfterSaveCommit()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The AfterSaveCommit decorator
   *
   */
  public static AfterSaveCommit<T extends typeof Dream>(this: T, opts: AfterHookOpts<InstanceType<T>>) {
    return AfterSaveCommit<InstanceType<T>>(opts)
  }

  /**
   * Shortcut to the @AfterUpdate decorator
   *
   * ```ts
   * class User {
   *   User.AfterUpdate()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The AfterUpdate decorator
   *
   */
  public static AfterUpdate<T extends typeof Dream>(this: T, opts: AfterHookOpts<InstanceType<T>>) {
    return AfterUpdate<InstanceType<T>>(opts)
  }

  /**
   * Shortcut to the @AfterUpdateCommit decorator
   *
   * ```ts
   * class User {
   *   User.AfterUpdateCommit()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The AfterUpdateCommit decorator
   *
   */
  public static AfterUpdateCommit<T extends typeof Dream>(this: T, opts: AfterHookOpts<InstanceType<T>>) {
    return AfterUpdateCommit<InstanceType<T>>(opts)
  }

  /**
   * Shortcut to the @AfterDestroy decorator
   *
   * ```ts
   * class User {
   *   User.AfterDestroy()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The AfterDestroy decorator
   *
   */
  public static AfterDestroy<T extends typeof Dream>(this: T) {
    return AfterDestroy()
  }

  /**
   * Shortcut to the @AfterDestroyCommit decorator
   *
   * ```ts
   * class User {
   *   User.AfterDestroyCommit()
   *   public doSomething() {
   *     console.log('hi!')
   *   }
   * }
   * ```
   *
   * @returns The AfterDestroyCommit decorator
   *
   */
  public static AfterDestroyCommit<T extends typeof Dream>(this: T) {
    return AfterDestroyCommit()
  }

  /**
   * Returns a unique global name for the given model.
   * Since in javascript/typescript, it is possible to give
   * two Dream classes the same name, globalName
   * provides a model name which is unique to your class,
   * since it considers the file path to the dream as part
   * of the name.
   *
   * This is used in the console so that all models can be
   * imported to the global namespace without overriding
   * each other.
   *
   * @returns A string representing a unique key for this model based on its filename and path
   */
  public static async globalName<T extends typeof Dream>(this: T): Promise<string | undefined> {
    const modelKey = await getModelKey(this)
    return pascalize(modelKey)?.replace(/\//g, '')
  }

  /**
   * Returns the column names for the given model
   *
   * @returns The column names for the given model
   */
  public static columns<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName],
  >(this: T): Set<keyof Table & string> {
    const columns = this.prototype.schema[this.table]?.columns
    return new Set(columns ? Object.keys(columns) : [])
  }

  /**
   * Returns the list of column names that are safe for
   * casting automatically using `.paramsFor` within a
   * psychic controller. It will return a subset of the
   * `.columns` getter, but which filters out the following:
   *   * createdAt
   *   * updatedAt
   *   * deletedAt
   *   * type fields for STI models
   *   * foreign key fields for belongs to associations (these should usually be verified before being set)
   *   * type fields corresponding to polymorphic associations
   *
   * @returns A subset of columns for the given dream class
   */
  public static paramSafeColumnsOrFallback<
    T extends typeof Dream,
    I extends InstanceType<T>,
    ParamSafeColumnsOverride extends InstanceType<T>['paramSafeColumns' & keyof InstanceType<T>] extends never
      ? undefined
      : InstanceType<T>['paramSafeColumns' & keyof InstanceType<T>] & string[],
    ReturnVal extends ParamSafeColumnsOverride extends string[]
      ? Extract<
          DreamParamSafeColumnNames<I>,
          ParamSafeColumnsOverride[number] & DreamParamSafeColumnNames<I>
        >[]
      : DreamParamSafeColumnNames<I>[],
  >(this: T): ReturnVal {
    const defaultParams = this.defaultParamSafeColumns()
    const userDefinedParams = (this.prototype as any).paramSafeColumns as ReturnVal

    if (Array.isArray(userDefinedParams)) {
      return userDefinedParams.filter(param => defaultParams.includes(param)) as ReturnVal
    }

    return defaultParams as ReturnVal
  }

  protected static defaultParamSafeColumns<T extends typeof Dream, I extends InstanceType<T>>(
    this: T
  ): DreamParamSafeColumnNames<I>[] {
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

    return [
      ...new Set([...columns, ...this.virtualAttributes.map(attr => attr.property)]),
    ] as DreamParamSafeColumnNames<I>[]
  }

  /**
   * @internal
   *
   * Returns true if the column is virtual (set using the @Virtual decorator)
   *
   * @param columnName - the name of the property you are checking for
   * @returns boolean
   */
  public static isVirtualColumn<T extends typeof Dream>(this: T, columnName: string): boolean {
    return this.prototype.isVirtualColumn(columnName)
  }

  /**
   * @internal
   *
   * Locates an association's metadata by key
   *
   * ```ts
   * Post.getAssociationMetadata('user')
   * // {
   * //    modelCB: [Function (anonymous)],
   * //    type: 'BelongsTo',
   * //    as: 'user',
   * //    optional: false,
   * //    polymorphic: false,
   * //    primaryKeyOverride: null,
   * //    primaryKey: [Function: primaryKey],
   * //    primaryKeyValue: [Function: primaryKeyValue],
   * //    foreignKey: [Function: foreignKey],
   * //    foreignKeyTypeField: [Function: foreignKeyTypeField]
   * //  }
   * ```
   *
   * @param associationName - the name of the association you wish to retrieve metadata for
   * @returns Association metadata for the requested association
   */
  private static getAssociationMetadata<
    T extends typeof Dream,
    I extends InstanceType<T>,
    Schema extends I['schema'],
  >(this: T, associationName: Schema[I['table']]['associations'][number]) {
    return this.associationMetadataMap()[associationName]
  }

  /**
   * @internal
   *
   * Returns an array containing all of the associations for this dream class
   *
   * @returns An array containing all of the associations for this dream class
   */
  private static associationMetadataMap<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    Schema extends I['schema'],
  >(this: T) {
    const allAssociations = [
      ...this.associationMetadataByType.belongsTo,
      ...this.associationMetadataByType.hasOne,
      ...this.associationMetadataByType.hasMany,
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

  /**
   * @internal
   *
   * Returns all of the association names for this dream class
   *
   * @returns All of the association names for this dream class
   */
  public static get associationNames() {
    const allAssociations = [
      ...this.associationMetadataByType.belongsTo,
      ...this.associationMetadataByType.hasOne,
      ...this.associationMetadataByType.hasMany,
    ]
    return allAssociations.map(association => {
      return association.as
    })
  }

  /**
   * Returns a query for this model which disregards default scopes
   *
   * @returns A query for this model which disregards default scopes
   */
  public static removeAllDefaultScopes<T extends typeof Dream>(this: T): Query<InstanceType<T>> {
    return this.query().removeAllDefaultScopes()
  }

  /**
   * Prevents a specific default scope from applying when
   * the Query is executed
   *
   * @returns A new Query which will prevent a specific default scope from applying
   */
  public static removeDefaultScope<T extends typeof Dream>(
    this: T,
    scopeName: AllDefaultScopeNames<InstanceType<T>>
  ): Query<InstanceType<T>> {
    return this.query().removeDefaultScope(scopeName)
  }

  /**
   * Retrieves an array containing all records corresponding to
   * this model. Be careful using this, since it will attempt to
   * pull every record into memory at once. For a large number
   * of records, consider using `.findEach`, which will pull
   * the records in batches.
   *
   * ```ts
   * await User.all()
   * ```
   *
   * @returns an array of dreams
   */
  public static async all<T extends typeof Dream>(this: T): Promise<InstanceType<T>[]> {
    return await this.query().all()
  }

  /**
   * @internal
   *
   * Retrieves a query with the requested connection
   *
   * @param connection - The connection you wish to access
   * @returns A query with the requested connection
   */
  protected static connection<T extends typeof Dream>(
    this: T,
    connection: DbConnectionType
  ): Query<InstanceType<T>> {
    return new Query<InstanceType<T>>(this.prototype as InstanceType<T>, {
      connection,
    })
  }

  /**
   * Retrieves the number of records corresponding
   * to this model.
   *
   * @returns The number of records corresponding to this model
   */
  public static async count<T extends typeof Dream>(this: T): Promise<number> {
    return await this.query().count()
  }

  /**
   * Retrieves the max value of the specified column
   * for this model's records.
   *
   * ```ts
   * await User.max('id')
   * // 99
   * ```
   *
   * @param columnName - a column name on the model
   * @returns the max value of the specified column for this model's records
   */
  public static async max<T extends typeof Dream, ColumnName extends DreamColumnNames<InstanceType<T>>>(
    this: T,
    columnName: ColumnName
  ) {
    return await this.query().max(columnName)
  }

  /**
   * Retrieves the min value of the specified column
   * for this model's records.
   *
   *
   * ```ts
   * await User.min('id')
   * // 1
   * ```
   *
   * @param columnName - a column name on the model
   * @returns the min value of the specified column for this model's records
   */
  public static async min<T extends typeof Dream, ColumnName extends DreamColumnNames<InstanceType<T>>>(
    this: T,
    columnName: ColumnName
  ) {
    return await this.query().min(columnName)
  }

  /**
   * Persists a new record, setting the provided attributes
   *
   * ```ts
   * const user = await User.create({ email: 'how@yadoin' })
   * await Post.create({ body: 'howdy', user })
   * ```
   *
   * @param attributes - attributes or belongs to associations you wish to set on this model before persisting
   * @returns A newly persisted dream instance
   */
  public static async create<T extends typeof Dream>(this: T, attributes?: UpdateablePropertiesForClass<T>) {
    const dreamModel = new (this as any)(attributes as any)
    await dreamModel.save()
    return dreamModel as InstanceType<T>
  }

  /**
   * Attempt to create the model. If creation fails
   * due to uniqueness constraint, then find the existing
   * model.
   *
   * This is useful in situations where we want to avoid
   * a race condition creating duplicate records.
   *
   * IMPORTANT: A unique index/uniqueness constraint must exist on
   * at least one of the provided attributes
   *
   * ```ts
   * const logEntry = await LogEntry.createOrFindBy({ externalId }, { createWith: params })
   * ```
   *
   * @param attributes - The base attributes to persist, but also the attributes to use to find when create fails
   * @param extraOpts.createWith - additional attributes to persist when creating, but not used for finding
   * @returns A dream instance
   */
  public static async createOrFindBy<T extends typeof Dream>(
    this: T,
    attributes: UpdateablePropertiesForClass<T>,
    extraOpts: CreateOrFindByExtraOps<T> = {}
  ): Promise<InstanceType<T>> {
    try {
      const dreamModel = this.new({
        ...attributes,
        ...(extraOpts?.createWith || {}),
      })
      await dreamModel.save()
      return dreamModel
    } catch (err) {
      if (
        err instanceof DatabaseError &&
        err.message.includes('duplicate key value violates unique constraint')
      ) {
        const dreamModel = await this.findBy(this.extractAttributesFromUpdateableProperties(attributes))
        if (!dreamModel) throw new CreateOrFindByFailedToCreateAndFind(this)
        return dreamModel
      }
      throw err
    }
  }

  /**
   * Returns a new query instance with the distinct query applied.
   * If no columnName is provided, then distinct will apply to the
   * primary key by default.
   *
   * ```ts
   * await User.distinct('name').pluck('name')
   * ```
   *
   * @param columnName - The column name you wish to apply the distinct clause to
   * @returns A Query scoped to this Dream model with the distinct clause applied
   */
  public static distinct<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    TableName extends InstanceType<T>['table'],
  >(this: T, columnName?: TableColumnNames<DB, TableName> | null | boolean) {
    return this.query().distinct(columnName as any)
  }

  /**
   * Finds a record for the corresponding model with the
   * specified primary key. If not found, null
   * is returned
   *
   * ```ts
   * await User.query().find(123)
   * // User{id: 123}
   * ```
   *
   * @param primaryKey - The primaryKey of the record to look up
   * @returns Either the found record, or else null
   */
  public static async find<
    T extends typeof Dream,
    I extends InstanceType<T>,
    Schema extends I['schema'],
    SchemaIdType = Schema[InstanceType<T>['table']]['columns'][I['primaryKey']]['coercedType'],
  >(this: T, primaryKey: SchemaIdType): Promise<InstanceType<T> | null> {
    return await this.query().find(primaryKey)
  }

  /**
   * Finds a record for the corresponding model with the
   * specified primary key. If not found, an exception is raised.
   *
   * ```ts
   * await User.query().findOrFail(123)
   * // User{id: 123}
   * ```
   *
   * @param primaryKey - The primaryKey of the record to look up
   * @returns Either the found record, or else null
   */
  public static async findOrFail<
    T extends typeof Dream,
    I extends InstanceType<T>,
    Schema extends I['schema'],
    SchemaIdType = Schema[InstanceType<T>['table']]['columns'][I['primaryKey']]['coercedType'],
  >(this: T, primaryKey: SchemaIdType): Promise<InstanceType<T>> {
    return await this.query().findOrFail(primaryKey)
  }

  /**
   * Finds all records for the corresponding model in batches,
   * and then calls the provided callback
   * for each found record. Once all records
   * have been passed for a given batch, the next set of
   * records will be fetched and passed to your callback, until all
   * records matching the corresponding model have been fetched.
   *
   * ```ts
   * await User.findEach(user => {
   *   console.log(user)
   * })
   * // User{email: 'hello@world'}
   * // User{email: 'goodbye@world'}
   * ```
   *
   * @param cb - The callback to call for each found record
   * @param opts.batchSize - the batch size you wish to collect records in. If not provided, it will default to 1000
   * @returns void
   */
  public static async findEach<T extends typeof Dream>(
    this: T,
    cb: (instance: InstanceType<T>) => void | Promise<void>,
    opts?: FindEachOpts
  ): Promise<void> {
    await this.query().findEach(cb, opts)
  }

  /**
   * Given a collection of records, load a common association.
   * This can be useful to reduce database queries when multiple
   * dream classes have identical associations that should be loaded.
   *
   * For example, we can sideload the associations
   * shared by both associations called `localizedTexts`,
   * so long as `localizedTexts` is defined identically (same
   * association type, same target class, same association options,
   * same association name) on both Image and Post:
   *
   * ```ts
   * class Image extends ApplicationModel {
   *   @HasMany(() => LocalizedText)
   *   public localizedTexts: LocalizedText[]
   * }
   *
   * class Post extends ApplicationModel {
   *   @HasMany(() => LocalizedText)
   *   public localizedTexts: LocalizedText[]
   * }
   *
   * const post = await Post.preload('image').first()
   * const image = post.image
   *
   * await Image.loadInto([image, post], 'localizedTexts')
   * ```
   *
   * @param dreams - An array of dream instances to load associations into
   * @param args - A chain of association names
   * @returns A LoadIntoModels instance
   */
  public static async loadInto<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    TableName extends I['table'],
    Schema extends I['schema'],
    const Arr extends readonly unknown[],
  >(this: T, dreams: Dream[], ...args: [...Arr, VariadicLoadArgs<DB, Schema, TableName, Arr>]) {
    await this.query().loadInto(dreams, ...(args as any))
  }

  /**
   * Returns a new instance of Query scoped to the given
   * model class
   *
   * ```ts
   * await User.query().all()
   * // [User{id: 1}, User{id: 2}, ...]
   * ```
   *
   * @returns A new Query instance scoped to this Dream class
   *
   */
  public static query<T extends typeof Dream, I extends InstanceType<T>>(this: T): Query<I> {
    return new Query(this.prototype as I)
  }

  /**
   * @internal
   *
   * Returns a new instance of Query scoped to the given
   * Dream instance
   *
   * ```ts
   * await user = User.first()
   * await user.query().countThrough('posts')
   * // 7
   * ```
   *
   * @returns A new Query instance scoped to this Dream instance
   *
   */
  private query<I extends Dream>(this: I): Query<I> {
    const dreamClass = this.constructor as DreamConstructorType<I>
    return dreamClass.where({ [this.primaryKey]: this.primaryKeyValue } as any)
  }

  /**
   * Finds the first record—ordered by primary key—matching
   * the corresponding model and the specified where statement.
   * If not found, null is returned.
   *
   * ```ts
   * await User.findBy({ email: 'how@yadoin' })
   * // User{email: 'how@yadoin'}
   * ```
   *
   * @param whereStatement - The where statement used to locate the record
   * @returns The first model found matching the whereStatement
   */
  public static async findBy<T extends typeof Dream, I extends InstanceType<T>>(
    this: T,
    whereStatement: WhereStatement<I['DB'], I['schema'], I['table']>
  ): Promise<InstanceType<T> | null> {
    return await this.query().findBy(whereStatement)
  }

  /**
   * Finds the first record—ordered by primary key—matching
   * the corresponding model and the specified where statement.
   * If not found, an exception is raised.
   *
   * ```ts
   * await User.findOrFailBy({ email: 'how@yadoin' })
   * // User{email: 'how@yadoin'}
   * ```
   *
   * @param whereStatement - The where statement used to locate the record
   * @returns The first model found matching the whereStatement
   */
  public static async findOrFailBy<T extends typeof Dream, I extends InstanceType<T>>(
    this: T,
    whereStatement: WhereStatement<I['DB'], I['schema'], I['table']>
  ): Promise<InstanceType<T>> {
    return await this.query().findOrFailBy(whereStatement)
  }

  /**
   * Attempt to find the model with the given attributes.
   * If no record is found, then a new record is created.
   *
   * ```ts
   * const user = await User.findOrCreateBy({ email }, { createWith: params })
   * ```
   *
   * @param attributes - The base attributes for finding, but also the attributes to use when creating
   * @param extraOpts.createWith - additional attributes to persist when creating, but not used for finding
   * @returns A dream instance
   */
  public static async findOrCreateBy<T extends typeof Dream>(
    this: T,
    attributes: UpdateablePropertiesForClass<T>,
    extraOpts: CreateOrFindByExtraOps<T> = {}
  ): Promise<InstanceType<T>> {
    const existingRecord = await this.findBy(this.extractAttributesFromUpdateableProperties(attributes))
    if (existingRecord) return existingRecord

    const dreamModel = new (this as any)({
      ...attributes,
      ...(extraOpts?.createWith || {}),
    })

    await dreamModel.save()

    return dreamModel as InstanceType<T>
  }

  /**
   * Returns true if a record exists for the given
   * model class
   *
   * ```ts
   * await User.exists()
   * // false
   *
   * await User.create({ email: 'how@yadoin' })
   *
   * await User.exists()
   * // true
   * ```
   *
   * @returns boolean
   */
  public static async exists<T extends typeof Dream>(this: T): Promise<boolean> {
    return await this.query().exists()
  }

  /**
   * Applies preload statement to a Query scoped to this model.
   * Upon instantiating records of this model type,
   * specified associations will be preloaded.
   *
   * Preloading/loading is necessary prior to accessing associations
   * on a Dream instance.
   *
   * Preload is useful for avoiding the N+1 query problem
   *
   * ```ts
   * const user = await User.preload('posts', 'comments', { visibilty: 'public' }, 'replies').first()
   * console.log(user.posts[0].comments[0].replies)
   * // [Reply{id: 1}, Reply{id: 2}]
   * ```
   *
   * @param args - A chain of associaition names and where clauses
   * @returns A query for this model with the preload statement applied
   */
  public static preload<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    TableName extends InstanceType<T>['table'],
    Schema extends I['schema'],
    const Arr extends readonly unknown[],
  >(this: T, ...args: [...Arr, VariadicLoadArgs<DB, Schema, TableName, Arr>]) {
    return this.query().preload(...(args as any))
  }

  /**
   * Returns a new Query instance with the provided
   * joins statement attached
   *
   * ```ts
   * await User.joins('posts').first()
   * ```
   *
   * @param args - A chain of associaition names and where clauses
   * @returns A Query for this model with the joins clause applied
   */
  public static joins<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    Schema extends I['schema'],
    TableName extends I['table'] & keyof Schema,
    const Arr extends readonly unknown[],
  >(this: T, ...args: [...Arr, VariadicJoinsArgs<DB, Schema, TableName, Arr>]) {
    return this.query().joins(...(args as any))
  }

  /**
   * Returns the first record corresponding to the
   * model, ordered by primary key.
   *
   * ```ts
   * await User.first()
   * // User{id: 1}
   * ```
   *
   * @returns First record, or null if no record exists
   */
  public static async first<T extends typeof Dream>(this: T): Promise<InstanceType<T> | null> {
    return await this.query().first()
  }

  /**
   * Returns the first record corresponding to the
   * model, ordered by primary key. If no record is
   * found, an exception is raised.
   *
   * ```ts
   * await User.firstOrFail()
   * // User{id: 1}
   * ```
   *
   * @returns First record
   */
  public static async firstOrFail<T extends typeof Dream>(this: T): Promise<InstanceType<T>> {
    return await this.query().firstOrFail()
  }

  /**
   * Returns the last record corresponding to the
   * model, ordered by primary key.
   *
   * ```ts
   * await User.last()
   * // User{id: 99}
   * ```
   *
   * @returns Last record, or null if no record exists
   */
  public static async last<T extends typeof Dream>(this: T): Promise<InstanceType<T> | null> {
    return await this.query().last()
  }

  /**
   * Returns the last record corresponding to the
   * model, ordered by primary key. If no record
   * is found, an exception is raised.
   *
   * ```ts
   * await User.lastOrFail()
   * // User{id: 99}
   * ```
   *
   * @returns Last record
   */
  public static async lastOrFail<T extends typeof Dream>(this: T): Promise<InstanceType<T>> {
    return await this.query().lastOrFail()
  }

  /**
   * Returns a new Query instance, specifying a limit
   *
   * ```ts
   * await User.limit(2).all()
   * // [User{}, User{}]
   * ```
   *
   * @returns A Query for this model with the limit clause applied
   */
  public static limit<T extends typeof Dream>(this: T, count: number | null) {
    return this.query().limit(count)
  }

  /**
   * Returns a new Query instance, specifying an offset
   *
   * ```ts
   * await User.offset(2).order('id').limit(2).all()
   * // [User{id: 3}, User{id: 4}]
   * ```
   *
   * @returns A Query for this model with the offset clause applied
   */
  public static offset<T extends typeof Dream>(this: T, offset: number | null) {
    return this.query().offset(offset)
  }

  /**
   * Returns a new Query instance, attaching the provided
   * order statement
   *
   * ```ts
   * await User.order('id').all()
   * // [User{id: 1}, User{id: 2}, ...]
   * ```
   *
   * ```ts
   * await User.order({ name: 'asc', id: 'desc' }).all()
   * // [User{name: 'a', id: 99}, User{name: 'a', id: 97}, User{ name: 'b', id: 98 } ...]
   * ```
   *
   * @param orderStatement - Either a string or an object specifying order. If a string, the order is implicitly ascending. If the orderStatement is an object, statements will be provided in the order of the keys set in the object
   * @returns A query for this model with the order clause applied
   */
  public static order<T extends typeof Dream, I extends InstanceType<T>>(
    this: T,
    orderStatement: DreamColumnNames<I> | Partial<Record<DreamColumnNames<I>, OrderDir>> | null
  ): Query<InstanceType<T>> {
    return this.query().order(orderStatement as any)
  }

  /**
   * Plucks the provided fields from the corresponding model
   *
   * ```ts
   * await User.pluck('id')
   * // [1, 3, 2]
   * ```
   *
   * If more than one column is requested, a multi-dimensional
   * array is returned:
   *
   * ```ts
   * await User.order('id').pluck('id', 'email')
   * // [[1, 'a@a.com'], [2, 'b@b.com']]
   * ```
   *
   * @param fields - The column or array of columns to pluck
   * @returns An array of pluck results
   */
  public static async pluck<T extends typeof Dream>(this: T, ...fields: DreamColumnNames<InstanceType<T>>[]) {
    return await this.query().pluck(...(fields as any[]))
  }

  /**
   * Plucks the specified fields from the given dream class table
   * in batches, passing each found columns into the
   * provided callback function
   *
   * ```ts
   * await User.order('id').pluckEach('id', (id) => {
   *   console.log(id)
   * })
   * // 1
   * // 2
   * // 3
   * ```
   *
   * @param fields - a list of fields to pluck, followed by a callback function to call for each set of found fields
   * @returns void
   */
  public static async pluckEach<T extends typeof Dream, CB extends (plucked: any) => void | Promise<void>>(
    this: T,
    ...fields: (DreamColumnNames<InstanceType<T>> | CB | FindEachOpts)[]
  ) {
    return await this.query().pluckEach(...(fields as any))
  }

  /**
   * Used in conjunction with the @Sortable decorator, `resort`
   * takes a list of sortable fields, and for each one, finds and
   * sorts each record in the DB matching the field based on the
   * scope provided for each @Sortable decorator found.
   *
   * Calling this method shouldn't be necessary, but if
   * the contents of the database have shifted without firing the
   * correct callback mechanisms at the application layer, calling
   * `resort` will ensure that all sortable fields are set from 1..n
   * with no gaps, accounting for the scopes specified in the
   * corresponding @Sortable decorator.
   *
   * ```ts
   * class Post extends ApplicationModel {
   *   @Sortable({ scope: ['user']})
   *   public position: DreamColumn<User, 'position'>
   * }
   *
   * await Post.all()
   * // [Post{position: 1}, Post{position: 3}, Post{position: 5}]
   *
   * await Post.resort('position')
   * await Post.all()
   * // [Post{position: 1}, Post{position: 2}, Post{position: 3}]
   * ```
   *
   * @param fields - A list of sortable fields to resort
   * @returns void
   *
   */
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

  /**
   * Returns a Query scoped to this model with
   * the specified scope applied.
   *
   * ```ts
   * class User extends ApplicationModel {
   *   @Scope()
   *   public visible(query: Query<User>) {
   *     return query.where({ hidden: false })
   *   }
   * }
   *
   * await User.scope('visible').all()
   * // [User{hidden: false}, User{hidden: false}]
   * ```
   *
   * @param scopeName - The name of the scope
   * @returns a Query scoped to this model with the specified scope applied
   */
  public static scope<T extends typeof Dream>(this: T, scopeName: DefaultOrNamedScopeName<InstanceType<T>>) {
    return (this as any)[scopeName](this.query()) as Query<InstanceType<T>>
  }

  /**
   * Returns the sql that would be executed by a Query
   * scoped to this model.
   *
   * ```ts
   * User.sql()
   * // {
   * //  query: {
   * //    kind: 'SelectQueryNode',
   * //    from: { kind: 'FromNode', froms: [Array] },
   * //    selections: [ [Object] ],
   * //    distinctOn: undefined,
   * //    joins: undefined,
   * //    groupBy: undefined,
   * //    orderBy: undefined,
   * //    where: { kind: 'WhereNode', where: [Object] },
   * //    frontModifiers: undefined,
   * //    endModifiers: undefined,
   * //    limit: undefined,
   * //    offset: undefined,
   * //    with: undefined,
   * //    having: undefined,
   * //    explain: undefined,
   * //    setOperations: undefined
   * //  },
   * //  sql: 'select "users".* from "users" where "users"."deleted_at" is null',
   * //  parameters: []
   * //}
   * ```
   *
   * @returns An object representing the underlying sql statement
   *
   */
  public static sql<T extends typeof Dream>(this: T): CompiledQuery<object> {
    return this.query().sql()
  }

  /**
   * Converts the given Dream class into a Kysely query, enabling
   * you to build custom queries using the Kysely API
   *
   * ```ts
   * await User.toKysely('select').where('email', '=', 'how@yadoin').execute()
   * ```
   *
   * @param type - The type of Kysely query builder instance you would like to obtain
   * @returns A Kysely query. Depending on the type passed, it will return either a SelectQueryBuilder, DeleteQueryBuilder, UpdateQueryBuilder, or an InsertQueryBuilder
   */
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

  /**
   * Applies transaction to a new Query scoped
   * to this model
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   await User.txn(txn).create({ email: 'how@yadoin' })
   * })
   * ```
   *
   * @param txn - A DreamTransaction instance (usually collected by calling `ApplicationModel.transaction`)
   * @returns A Query scoped to this model with the transaction applied
   */
  public static txn<T extends typeof Dream, I extends InstanceType<T>>(
    this: T,
    txn: DreamTransaction<I>
  ): DreamClassTransactionBuilder<I> {
    return new DreamClassTransactionBuilder<I>(this.prototype as I, txn)
  }

  /**
   * Builds a new DreamTransaction instance, provides
   * the instance to the provided callback.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   const user = await User.txn(txn).create({ email: 'how@yadoin' })
   *   await Pet.txn(txn).create({ user })
   * })
   * ```
   *
   * @param callback - A callback function to call. The transaction provided to the callback can be passed to subsequent database calls within the transaction callback.
   * @returns void
   */
  public static async transaction<
    T extends typeof Dream,
    CB extends (txn: DreamTransaction<InstanceType<T>>) => unknown,
    RetType extends ReturnType<CB>,
  >(this: T, callback: CB): Promise<RetType> {
    const dreamTransaction = new DreamTransaction()
    let callbackResponse: RetType = undefined as RetType

    await db('primary', getCachedDreamconfOrFail())
      .transaction()
      .execute(async kyselyTransaction => {
        dreamTransaction.kyselyTransaction = kyselyTransaction
        callbackResponse = (await (callback as (txn: DreamTransaction<InstanceType<T>>) => Promise<unknown>)(
          dreamTransaction
        )) as RetType
      })

    await dreamTransaction.runAfterCommitHooks(dreamTransaction)

    return callbackResponse
  }

  /**
   * Sends data through for use as passthrough data
   * for the associations that require it.
   *
   * ```ts
   * class Post {
   *   @HasMany(() => LocalizedText)
   *   public localizedTexts: LocalizedText[]
   *
   *   @HasOne(() => LocalizedText, {
   *     where: { locale: DreamConst.passthrough },
   *   })
   *   public currentLocalizedText: LocalizedText
   * }
   *
   * await User.passthrough({ locale: 'es-ES' })
   *   .preload('posts', 'currentLocalizedText')
   *   .first()
   * ```
   *
   * @param passthroughWhereStatement - Where statement used for associations that require passthrough data
   * @returns A Query for this model with the passthrough data
   */
  public static passthrough<
    T extends typeof Dream,
    I extends InstanceType<T>,
    PassthroughColumns extends PassthroughColumnNames<I>,
  >(this: T, passthroughWhereStatement: PassthroughWhere<PassthroughColumns>): Query<InstanceType<T>> {
    return this.query().passthrough(passthroughWhereStatement)
  }

  /**
   * Applies a where statement to a new Query instance
   * scoped to this model
   *
   * ```ts
   * await User.where({ email: 'how@yadoin' }).first()
   * // User{email: 'how@yadoin'}
   * ```
   *
   * @param whereStatement - Where statement to apply to the Query
   * @returns A Query for this model with the where clause applied
   */
  public static where<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    Schema extends I['schema'],
    TableName extends AssociationTableNames<DB, Schema> & keyof DB = InstanceType<T>['table'],
  >(this: T, whereStatement: WhereStatement<DB, Schema, TableName>): Query<InstanceType<T>> {
    return this.query().where(whereStatement)
  }

  /**
   * Applies "OR"'d where statements to a Query scoped
   * to this model.
   *
   * ```ts
   * await User.whereAny([{ email: 'how@yadoin' }, { name: 'fred' }]).first()
   * // [User{email: 'how@yadoin'}, User{name: 'fred'}, User{name: 'fred'}]
   * ```
   *
   * @param whereStatements - a list of where statements to `OR` together
   * @returns A Query for this model with the whereAny clause applied
   */
  public static whereAny<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    Schema extends I['schema'],
    TableName extends AssociationTableNames<DB, Schema> & keyof DB = InstanceType<T>['table'],
  >(this: T, statements: WhereStatement<DB, Schema, TableName>[]): Query<InstanceType<T>> {
    return this.query().whereAny(statements)
  }

  /**
   * Applies a whereNot statement to a new Query instance
   * scoped to this model.
   *
   * ```ts
   * await User.whereNot({ email: 'how@yadoin' }).first()
   * // User{email: 'hello@world'}
   * ```
   *
   * @param whereStatement - A where statement to negate and apply to the Query
   * @returns A Query for this model with the whereNot clause applied
   */
  public static whereNot<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    Schema extends I['schema'],
    TableName extends AssociationTableNames<DB, Schema> & keyof DB = InstanceType<T>['table'],
  >(this: T, attributes: WhereStatement<DB, Schema, TableName>): Query<InstanceType<T>> {
    return this.query().whereNot(attributes)
  }

  /**
   * @internal
   *
   * Given a column, checks to see if it is a foreign key
   * belonging to a BelongsTo association
   *
   * ```ts
   * Post.isBelongsToAssociationForeignKey('id')
   * // false
   * Post.isBelongsToAssociationForeignKey('userId')
   * // true
   * ```
   *
   * @param column - A column on this Dream class
   * @returns A boolean
   */
  private static isBelongsToAssociationForeignKey<T extends typeof Dream>(
    this: T,
    column: DreamColumnNames<InstanceType<T>>
  ) {
    return this.belongsToAssociationForeignKeys().includes(column)
  }

  /**
   * @internal
   *
   * Given a column, checks to see if it is a belongs to
   * polymorphic type field
   *
   * ```ts
   * LocalizedText.isBelongsToAssociationPolymorphicTypeField('localizableId')
   * // false
   * LocalizedText.isBelongsToAssociationPolymorphicTypeField('localizableType')
   * // true
   * ```
   *
   * @param column - a column on this dream class
   * @returns A boolean
   */
  private static isBelongsToAssociationPolymorphicTypeField<T extends typeof Dream>(
    this: T,
    column: DreamColumnNames<InstanceType<T>>
  ) {
    return this.polymorphicTypeColumns().includes(column)
  }

  /**
   * @internal
   *
   * Returns an array of column names that are belongs
   * to foreign keys on this dream class
   *
   * ```ts
   * Post.belongsToAssociationForeignKeys()
   * // ['userId']
   * ```
   *
   * @returns An array of column names that are belongs to foreign keys on this dream class
   */
  private static belongsToAssociationForeignKeys() {
    const associationMap = this.associationMetadataMap()
    return this.belongsToAssociationNames().map(belongsToKey => associationMap[belongsToKey].foreignKey())
  }

  /**
   * @internal
   *
   * Returns all polymorphic type columns
   *
   * ```ts
   * LocalizedText.polymorphicTypeColumns()
   * // ['localizableType']
   * ```
   *
   * @returns An array of column names that are polymorphic type fields on the given dream class
   */
  private static polymorphicTypeColumns() {
    const associationMap = this.associationMetadataMap()
    return this.belongsToAssociationNames()
      .filter(key => associationMap[key].polymorphic)
      .map(belongsToKey => associationMap[belongsToKey].foreignKeyTypeField())
  }

  /**
   * @internal
   *
   * Returns a list of association names which
   * correspond to belongs to associations
   * on this model class.
   *
   * ```ts
   * Post.belongsToAssociationNames()
   * // ['user']
   * ```
   *
   * @returns An array of belongs to association names
   */
  private static belongsToAssociationNames() {
    const associationMap = this.associationMetadataMap()
    return Object.keys(associationMap).filter(key => associationMap[key].type === 'BelongsTo')
  }

  /**
   * @internal
   *
   * Returns a list of association names which
   * have `dependent: destroy` set
   *
   * ```ts
   * Post.dependentDestroyAssociationNames()
   * // ['user']
   * ```
   *
   * @returns An array of HasOne/HasMany association names with `dependent: 'destroy'` defined
   */
  private static dependentDestroyAssociationNames() {
    const associationMap = this.associationMetadataMap()
    return Object.keys(associationMap).filter(
      key =>
        (associationMap[key] as HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>)
          .dependent === 'destroy'
    )
  }

  /**
   * @internal
   *
   * Returns the metadata for the provided association
   *
   * ```ts
   * new Post()['getAssociationMetadata']('user')
   * // {
   * //    modelCB: [Function (anonymous)],
   * //    type: 'BelongsTo',
   * //    as: 'user',
   * //    optional: false,
   * //    polymorphic: false,
   * //    primaryKeyOverride: null,
   * //    primaryKey: [Function: primaryKey],
   * //    primaryKeyValue: [Function: primaryKeyValue],
   * //    foreignKey: [Function: foreignKey],
   * //    foreignKeyTypeField: [Function: foreignKeyTypeField]
   * //  }
   * ```
   *
   * @returns Association metadata
   *
   */
  private getAssociationMetadata<I extends Dream, Schema extends I['schema']>(
    this: I,
    associationName: keyof Schema[I['table']]['associations']
  ) {
    return (this.constructor as typeof Dream).getAssociationMetadata(associationName)
  }

  /**
   * @internal
   *
   * Returns all association metadata for the given dream class
   *
   * ```ts
   * new Post()['associationMetadataMap']()
   * // {
   * //     user: {
   * //       modelCB: [Function (anonymous)],
   * //       type: 'BelongsTo',
   * //       as: 'user',
   * //       optional: false,
   * //       polymorphic: false,
   * //       primaryKeyOverride: null,
   * //       primaryKey: [Function: primaryKey],
   * //       primaryKeyValue: [Function: primaryKeyValue],
   * //       foreignKey: [Function: foreignKey],
   * //       foreignKeyTypeField: [Function: foreignKeyTypeField]
   * //     },
   * //     ratings: {
   * //       modelCB: [Function (anonymous)],
   * //       type: 'HasMany',
   * //       as: 'ratings',
   * //       polymorphic: true,
   * //       source: 'ratings',
   * //       preloadThroughColumns: undefined,
   * //       where: undefined,
   * //       whereNot: undefined,
   * //       selfWhere: undefined,
   * //       selfWhereNot: undefined,
   * //       primaryKeyOverride: null,
   * //       primaryKey: [Function: primaryKey],
   * //       primaryKeyValue: [Function: primaryKeyValue],
   * //       through: undefined,
   * //       distinct: undefined,
   * //       order: undefined,
   * //       foreignKey: [Function: foreignKey],
   * //       foreignKeyTypeField: [Function: foreignKeyTypeField]
   * //     },
   * //     ...
   * // }
   * ```
   *
   * @returns association metadata
   */
  private associationMetadataMap<T extends Dream>(this: T) {
    return (this.constructor as typeof Dream).associationMetadataMap()
  }

  /**
   * @internal
   *
   * returns all association data for the given dream class,
   * organized by the type of association
   *
   * ```ts
   * new Post().associationMetadataByType
   * // {
   * //   belongsTo: [
   * //     {
   * //       modelCB: [Function (anonymous)],
   * //       type: 'BelongsTo',
   * //       as: 'user',
   * //       optional: false,
   * //       polymorphic: false,
   * //       primaryKeyOverride: null,
   * //       primaryKey: [Function: primaryKey],
   * //       primaryKeyValue: [Function: primaryKeyValue],
   * //       foreignKey: [Function: foreignKey],
   * //       foreignKeyTypeField: [Function: foreignKeyTypeField]
   * //     },
   * //   ],
   * //   hasMany: [
   * //   ],
   * //   hasOne: []
   * //   }
   * // }
   * ```
   *
   * @returns association metadata by type
   *
   */
  private get associationMetadataByType() {
    return (this.constructor as typeof Dream).associationMetadataByType
  }

  /**
   * @internal
   *
   * Returns an array of association names for the
   * given dream class
   *
   * ```ts
   * new Post().associationNames
   * // [ 'user', 'postVisibility', 'ratings', 'heartRatings' ]
   * ```
   *
   * @returns association names array
   */
  public get associationNames() {
    return (this.constructor as typeof Dream).associationNames
  }

  /**
   * Returns true if any of the attributes on the instance
   * have changed since it was last pulled from the database.
   * It will also return true if the instance is not yet
   * persisted.
   *
   * ```ts
   * const post = Post.new({ body: 'howyadoin' })
   * post.isDirty
   * // true
   *
   * await post.save()
   * post.isDirty
   * // false
   *
   * post.body = 'groiyyyt'
   * post.isDirty
   * // true
   * ```
   *
   * @returns A boolean
   */
  public get isDirty() {
    return !!Object.keys(this.dirtyAttributes()).length
  }

  /**
   * Returns true. This is useful for identifying
   * dream instances from other objects
   *
   * @returns true
   */
  public get isDreamInstance() {
    return true
  }

  /**
   * Runs validation checks against all validations
   * declared using the @Validate and @Validates decorators,
   * and returns true if any of them fail.
   *
   * ```ts
   * class User extends ApplicationModel {
   *   @Validates('presence')
   *   public email: DreamColumn<User, 'email'>
   * }
   * const user = User.new()
   * user.isInvalid
   * // true
   *
   * user.email = 'how@yadoin'
   * user.isInvalid
   * // false
   * ```
   *
   * @returns A boolean
   */
  public get isInvalid(): boolean {
    return !this.isValid
  }

  /**
   * Returns true if the model has not been persisted
   * to the database.
   *
   * ```ts
   * const user = User.new({ email: 'howyadoin' })
   * user.isNewRecord
   * // true
   *
   * await user.save()
   * user.isNewRecord
   * // false
   * ```
   *
   * @returns A boolean
   */
  public get isNewRecord() {
    return !this.isPersisted
  }

  /**
   * Runs validation checks against all validations
   * declared using the @Validate and @Validates decorators.
   * Returns true if none of the validations fail.
   *
   * NOTE: Any validations that fail will leave the errors
   * field populated on your model instance.
   *
   * ```ts
   * class User extends ApplicationModel {
   *   @Validates('presence')
   *   public email: DreamColumn<User, 'email'>
   * }
   *
   * const user = User.new()
   * user.isValid
   * // false
   *
   * user.email = 'how@yadoin'
   * user.isValid
   * // true
   * ```
   *
   * @returns A boolean
   */
  public get isValid(): boolean {
    this._errors = {}
    runValidations(this)
    return !Object.keys(this.errors).filter(key => !!this.errors[key].length).length
  }

  /**
   * The name of the primary key column on this model.
   * NOTE: Must specify `as const` when defining a custom
   * primary key.
   *
   * ```ts
   * class User extends ApplicationModel {
   *   public customIdField: DreamColumn<User, 'customIdField'>
   *
   *   public get primaryKey() {
   *     return 'customIdField' as const
   *   }
   * }
   * ```
   *
   * @returns The primary key column name
   */
  public get primaryKey() {
    return 'id' as const
  }

  /**
   * Returns the value of the primary key
   *
   * @returns The value of the primary key field for this Dream instance
   */
  public get primaryKeyValue(): IdType {
    return (this as any)[this.primaryKey] || null
  }

  /**
   * @internal
   *
   * This is meant to be defined by ApplicationModel. Whenever
   * migrations are run for your Dream application, files are synced
   * to your db folder. This is one of those types.
   *
   * The passthroughColumns getter provides a few of the
   * types used by Dream internals related to the passthrough api.
   */
  public get passthroughColumns(): any {
    throw 'must have get passthroughColumns defined on child'
  }

  /**
   * This must be defined on every model, and it must point
   * to a table in your database. In addition, you must
   * return the value using the `as const` suffix, like so:
   *
   * ```ts
   * class User extends ApplicationModel {
   *   public get table() {
   *     return 'users' as const
   *   }
   * }
   * ```
   *
   * @returns The table name for this model
   */
  public get table(): AssociationTableNames<any, any> {
    throw new MissingTable(this.constructor as typeof Dream)
  }

  /**
   * @internal
   *
   * _errors is used to inform validation errors,
   * and is built whenever validations are run on
   * a dream instance.
   */
  private _errors: { [key: string]: ValidationType[] } = {}

  /**
   * @internal
   *
   * Used for the changes api
   */
  private frozenAttributes: { [key: string]: any } = {}

  /**
   * @internal
   *
   * Used for the changes api
   */
  private originalAttributes: { [key: string]: any } = {}

  /**
   * @internal
   *
   * Used for the changes api
   */
  private currentAttributes: { [key: string]: any } = {}

  /**
   * @internal
   *
   * Used for the changes api
   */
  private attributesFromBeforeLastSave: { [key: string]: any } = {}

  /**
   * @internal
   *
   * Stores whether the record has been persisted or not
   */
  private _isPersisted: boolean

  /**
   * Returns true if the model has been persisted
   * to the database.
   *
   * ```ts
   * const user = User.new({ email: 'howyadoin' })
   * user.isPersisted
   * // false
   *
   * await user.save()
   * user.isPersisted
   * // true
   * ```
   *
   * @returns A boolean
   */
  public get isPersisted() {
    return this._isPersisted || false
  }

  protected set isPersisted(val: boolean) {
    this._isPersisted = val
  }

  /**
   * Since typescript prevents constructor functions
   * from absorbing type generics, we provide the `new`
   * method to instantiate with type protection
   *
   * ```ts
   * const user = User.new({ email: 'how@yadoin' })
   * ```
   *
   * @returns A new (unpersisted) instance of the provided dream class
   */
  public static new<T extends typeof Dream>(
    this: T,
    opts?: UpdateablePropertiesForClass<T>,
    additionalOpts: { bypassUserDefinedSetters?: boolean } = {}
  ) {
    return new this(opts as any, additionalOpts) as InstanceType<T>
  }

  /**
   * @internal
   *
   * NOTE: avoid using the constructor function directly.
   * Use the static `.new` method instead, which will provide
   * type guarding for your attributes.
   *
   * Since typescript prevents constructor functions
   * from absorbing type generics, we provide the `new`
   * method to instantiate with type protection.
   *
   * ```ts
   * const user = User.new({ email: 'how@yadoin' })
   * ```
   *
   * @returns A new (unpersisted) instance of the provided dream class
   */
  constructor(
    opts?: any,
    additionalOpts: { bypassUserDefinedSetters?: boolean; isPersisted?: boolean } = {}
    // opts?: Updateable<
    //   InstanceType<DreamModel & typeof Dream>['DB'][InstanceType<DreamModel>['table'] &
    //     keyof InstanceType<DreamModel>['DB']]
    // >
  ) {
    this.isPersisted = additionalOpts?.isPersisted || false

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

  /**
   * @internal
   *
   * Used for determining which attributes to update
   */
  protected static extractAttributesFromUpdateableProperties<T extends typeof Dream>(
    this: T,
    attributes: UpdateablePropertiesForClass<T>,
    dreamInstance?: InstanceType<T>,
    { bypassUserDefinedSetters = false }: { bypassUserDefinedSetters?: boolean } = {}
  ): WhereStatement<InstanceType<T>['DB'], InstanceType<T>['schema'], InstanceType<T>['table']> {
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
      const associationMetaData = this.associationMetadataMap()[attr]

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

  /**
   * @internal
   *
   * defines attribute setters and getters for every column
   * set within your db/schema.ts file
   */
  protected defineAttributeAccessors() {
    const dreamClass = this.constructor as typeof Dream
    const columns = dreamClass.columns()

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

    ensureSTITypeFieldIsSet(this)
  }

  /**
   * Returns true if the columnName passed is marked by a
   * Virtual attribute decorator
   *
   * @param columnName - A property on this model to check
   * @returns A boolean
   */
  public isVirtualColumn<T extends Dream>(this: T, columnName: string): boolean {
    return (this.constructor as typeof Dream).virtualAttributes
      .map(attr => attr.property)
      .includes(columnName)
  }

  /**
   * Returns an object with column names for keys, and an
   * array of strings representing validation errors for values.
   *
   * @returns An error object
   */
  public get errors(): { [key: string]: ValidationType[] } {
    return { ...this._errors }
  }

  /**
   * Adds an error to the model. Any errors added to the model
   * will cause the model to be invalid, and will prevent the
   * model from saving.
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
   *
   * @returns void
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
   * Changes the attribute value for a single attribute,
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
   * Changes the attribute value for a single attribute internally,
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

  /**
   * Returns the value for a columnName provided,
   * bypassing the getters.
   *
   * ```ts
   *  const user = User.new({ email: 'how@yadoin' })
   *  user.getAttribute('email') // 'how@yadoin'
   * ```
   */
  public getAttribute<I extends Dream, Key extends AttributeKeys<I>>(
    this: I,
    columnName: Key & string
  ): DreamAttributes<I>[Key] {
    const columns = (this.constructor as typeof Dream).columns()
    const self = this as any

    if (columns.has(columnName)) {
      return self.currentAttributes[columnName]
    } else {
      return self[columnName]
    }
  }

  /**
   * Returns an object containing all the columns
   * on this dream class, as well as their values,
   * bypassing getters.
   *
   * ```ts
   *  const user = User.new({ email: 'how@yadoin' })
   *  user.attributes()
   *  // {
   *  //   email: 'how@yadoin',
   *  //   ...
   *  // }
   * ```
   */
  public getAttributes<I extends Dream, DB extends I['DB']>(this: I): Updateable<DB[I['table']]> {
    return { ...this.currentAttributes } as Updateable<DB[I['table']]>
  }

  /**
   * @internal
   *
   * Returns the db type stored within the database
   */
  protected static cachedTypeFor<
    T extends typeof Dream,
    DB extends InstanceType<T>['DB'],
    TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName],
  >(this: T, attribute: keyof Table): string {
    return cachedTypeForAttribute(this, attribute)
  }

  /**
   * Returns the attributes that have changed since
   * being persisted to the database, with the values
   * that were last persisted to the database.
   *
   * ```ts
   *  const user = User.new({ email: 'original@email', password: 'howyadoin' })
   *  await user.save()
   *
   *  user.email = 'new@email'
   *  user.changedAttributes()
   *  // { email: 'original@email' }
   *
   *  user.email = 'original@email'
   *  user.changedAttributes()
   *  // {}
   * ```
   *
   * @returns An object containing changed attributes and their original values
   */
  public changedAttributes<
    I extends Dream,
    DB extends I['DB'],
    Schema extends I['schema'],
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

  /**
   * Returns an object containing the attributes that have
   * changed since last persisting, along with their current
   * and previously persisted values.
   *
   * ```ts
   * const pet = Pet.new({ species: 'dog' })
   * pet.changes()
   * // {
   * //   species: {
   * //     was: undefined,
   * //     now: 'dog',
   * //   }
   * // }
   *
   * await pet.save()
   * pet.changes()
   * // {
   * //   species: {
   * //     was: undefined,
   * //     now: 'dog',
   * //   }
   * // }
   *
   * pet.species = 'cat'
   * pet.species = 'frog'
   * pet.changes()
   * // {
   * //   species: {
   * //     was: 'dog',
   * //     now: 'frog',
   * //   }
   * // }
   *
   * await pet.save()
   * pet.changes()
   * // {
   * //   species: {
   * //     was: 'dog',
   * //     now: 'frog',
   * //   }
   * // }
   * ```
   *
   * @returns An object containing changed attributes
   */
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

  /**
   * Returns the value most recently persisted
   * to the database.
   *
   * ```ts
   * const pet = Pet.new({ species: 'cat' })
   * pet.previousValueForAttribute('species')
   * // undefined
   *
   * await pet.save()
   * pet.previousValueForAttribute('species')
   * // undefined
   *
   * pet.species = 'dog'
   * pet.previousValueForAttribute('species')
   * // 'cat'
   *
   * await pet.save()
   * pet.previousValueForAttribute('species')
   * // 'cat'
   *
   * await pet.update({ species: 'cat' })
   * pet.previousValueForAttribute('species')
   * // 'dog'
   * ```
   *
   * @param columName - The column name you want the previous value for
   * @returns Returns the previous value for an attribute
   */
  public previousValueForAttribute<
    I extends Dream,
    DB extends I['DB'],
    TableName extends I['table'],
    Table extends DB[TableName],
    ColumnName extends DreamColumnNames<I>,
  >(this: I, columnName: ColumnName): Updateable<Table>[ColumnName] {
    if (this.frozenAttributes[columnName] !== (this as any)[columnName])
      return this.frozenAttributes[columnName]
    return (this.attributesFromBeforeLastSave as any)[columnName]
  }

  /**
   * Returns true if the columnName provided has
   * changes that were persisted during the most
   * recent save.
   *
   * @param columnName - the column name to check
   * @returns A boolean
   */
  public savedChangeToAttribute<I extends Dream>(this: I, columnName: DreamColumnNames<I>): boolean {
    const changes = this.changes()
    const now = (changes as any)?.[columnName]?.now
    const was = (changes as any)?.[columnName]?.was
    return this.isPersisted && now !== was
  }

  /**
   * Returns true if the columnName provided has
   * changes that have not yet been persisted.
   *
   * @param columnName - the column name to check
   * @returns A boolean
   */
  public willSaveChangeToAttribute<I extends Dream>(this: I, attribute: DreamColumnNames<I>): boolean {
    return this.attributeIsDirty(attribute as any)
  }

  /**
   * Returns the column names for the given model
   *
   * @returns The column names for the given model
   */
  public columns<
    I extends Dream,
    DB extends I['DB'],
    TableName extends keyof DB = I['table'] & keyof DB,
    Table extends DB[keyof DB] = DB[TableName],
  >(this: I): Set<keyof Table> {
    return (this.constructor as DreamConstructorType<I>).columns()
  }

  /**
   * Returns an object containing the column names
   * of columns that have changed since last persist,
   * and their current values.
   *
   * ```ts
   *  const user = User.new({ email: 'hello@world' })
   *  user.dirtyAttributes()
   *  // { email: 'hello@world' }
   *
   *  await user.save()
   *
   *  user.email = 'hello@world'
   *  user.dirtyAttributes()
   *  // {}
   *
   *  user.email = 'goodbye@world'
   *  user.dirtyAttributes()
   *  // { email: 'goodbye@world' }
   *
   *  user.email = 'hello@world'
   *  user.dirtyAttributes()
   *  // {}
   * ```
   *
   * @returns An object containing the changed attributes
   */
  public dirtyAttributes<
    I extends Dream,
    DB extends I['DB'],
    Schema extends I['schema'],
    TableName extends AssociationTableNames<DB, Schema> & keyof DB = I['table'] &
      AssociationTableNames<DB, Schema>,
    Table extends DB[keyof DB] = DB[TableName],
  >(this: I): Updateable<Table> {
    const obj: Updateable<Table> = {}

    this.columns().forEach(column => {
      // TODO: clean up types
      if (this.attributeIsDirty(column as any)) (obj as any)[column] = (this.getAttributes() as any)[column]
    })

    return obj
  }

  /**
   * Returns true if an attribute has changes since last persist
   *
   * @returns A boolean
   */
  private attributeIsDirty<I extends Dream>(this: I, attribute: DreamColumnNames<I>): boolean {
    const frozenValue = (this.frozenAttributes as any)[attribute]
    const currentValue = (this.getAttributes() as any)[attribute]

    if (this.isNewRecord) return true

    if (frozenValue instanceof DateTime) {
      return frozenValue.toMillis() !== this.unknownValueToMillis(currentValue)
    } else if (frozenValue instanceof CalendarDate) {
      return frozenValue.toISO() !== this.unknownValueToDateString(currentValue)
    } else {
      return frozenValue !== currentValue
    }
  }

  /**
   * @internal
   */
  private unknownValueToMillis(currentValue: any): number | undefined {
    if (!currentValue) return
    if (isString(currentValue)) currentValue = DateTime.fromISO(currentValue)
    if (currentValue instanceof CalendarDate) currentValue = currentValue.toDateTime()
    if (currentValue instanceof DateTime && currentValue.isValid) return currentValue.toMillis()
  }

  /**
   * @internal
   */
  private unknownValueToDateString(currentValue: any): string | undefined {
    if (!currentValue) return
    if (isString(currentValue)) currentValue = CalendarDate.fromISO(currentValue)
    if (currentValue instanceof DateTime) currentValue = CalendarDate.fromDateTime(currentValue)
    if (currentValue instanceof CalendarDate && currentValue.isValid) return currentValue.toISO()!
  }

  /**
   * Deletes the record represented by this instance
   * from the database, calling any destroy
   * hooks on this model.
   *
   * ```ts
   * const user = await User.last()
   * await user.destroy()
   * ```
   *
   * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @param opts.cascade - if false, will skip applying cascade deletes on "dependent: 'destroy'" associations. Defaults to true
   * @returns the instance that was destroyed
   */
  public async destroy<I extends Dream>(this: I, options: DestroyOptions<I> = {}): Promise<I> {
    return await destroyDream(this, null, destroyOptions<I>(options))
  }

  /**
   * Deletes the record represented by this instance
   * from the database, calling any destroy
   * hooks on this model.
   *
   * If the record being destroyed is using
   * a @SoftDelete decorator, the soft delete
   * will be bypassed, causing the record
   * to be permanently removed from the database.
   *
   * ```ts
   * const user = await User.last()
   * await user.destroy()
   * ```
   *
   * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @param opts.cascade - if false, will skip applying cascade deletes on "dependent: 'destroy'" associations. Defaults to true
   * @returns the instance that was destroyed
   */
  public async reallyDestroy<I extends Dream>(this: I, options: DestroyOptions<I> = {}): Promise<I> {
    return await destroyDream(this, null, reallyDestroyOptions<I>(options))
  }

  /**
   * Undestroys a SoftDelete model, unsetting
   * the `deletedAt` field in the database.
   *
   * If the model is not a SoftDelete model,
   * this will raise an exception.
   *
   * ```ts
   * const user = await User.removeAllDefaultScopes().last()
   * await user.undestroy()
   * // 12
   * ```
   *
   * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @param opts.cascade - if false, will skip applying cascade undeletes on "dependent: 'destroy'" associations. Defaults to true
   * @returns The undestroyed record
   */
  public async undestroy<I extends Dream>(this: I, options: DestroyOptions<I> = {}): Promise<I> {
    const dreamClass = this.constructor as typeof Dream
    if (!dreamClass['softDelete']) throw new CannotCallUndestroyOnANonSoftDeleteModel(dreamClass)

    await undestroyDream(this, null, undestroyOptions<I>(options))

    return this
  }

  /**
   * Returns true if the argument is the same Dream class
   * with the same primary key value.
   *
   * NOTE: This does not compare attribute values other than
   * the primary key.
   *
   * @returns A boolean
   */
  public equals(other: any): boolean {
    return other?.constructor === this.constructor && other.primaryKeyValue === this.primaryKeyValue
  }

  /**
   * @internal
   *
   * Used for changes API
   */
  protected freezeAttributes() {
    this.frozenAttributes = { ...this.getAttributes() }
  }

  /**
   * Plucks the specified fields from the join Query,
   * scoping the query to the model instance's primary
   * key.
   *
   * ```ts
   * const user = await User.first()
   * await user.pluckThrough(
   *   'posts',
   *   { createdAt: range(CalendarDate.yesterday()) },
   *   'comments',
   *   'replies',
   *   'replies.body'
   * )
   * // ['loved it!', 'hated it :(']
   * ```
   *
   * If more than one column is requested, a multi-dimensional
   * array is returned:
   *
   * ```ts
   * await user.pluckThrough(
   *   'posts',
   *   { createdAt: range(CalendarDate.yesterday()) },
   *   'comments',
   *   'replies',
   *   ['replies.body', 'replies.numLikes']
   * )
   * // [['loved it!', 1], ['hated it :(', 3]]
   * ```
   *
   * @param args - A chain of association names and where clauses ending with the column or array of columns to pluck
   * @returns An array of pluck results
   */
  public async pluckThrough<
    I extends Dream,
    DB extends I['DB'],
    Schema extends I['schema'],
    TableName extends I['table'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicPluckThroughArgs<DB, Schema, TableName, Arr>]): Promise<any[]> {
    return await this.query().pluckThrough(...(args as any))
  }

  /**
   * Plucks the specified fields from the join Query in batches,
   * passing each plucked value/set of plucked values
   * into the provided callback function. It will continue
   * doing this until it exhausts all results in the
   * Query. This is useful when plucking would result in
   * more results than would be desirable to instantiate
   * in memory/more results than would be desirable to handle
   * between awaits.
   *
   * ```ts
   * const user = await User.first()
   * await user.pluckEachThrough(
   *   'posts',
   *   { createdAt: range(CalendarDate.yesterday()) },
   *   'comments',
   *   'replies',
   *   ['replies.body', 'replies.numLikes'],
   *   ([body, numLikes]) => {
   *     console.log({ body, numLikes })
   *   }
   * )
   *
   * // { body: 'loved it!', numLikes: 2 }
   * // { body: 'hated it :(', numLikes: 0 }
   * ```
   *
   * @param args - A chain of association names and where clauses ending with the column or array of columns to pluck and the callback function
   * @returns void
   */
  public async pluckEachThrough<
    I extends Dream,
    DB extends I['DB'],
    Schema extends I['schema'],
    TableName extends I['table'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicPluckEachThroughArgs<DB, Schema, TableName, Arr>]): Promise<void> {
    return await this.query().pluckEachThrough(...(args as any))
  }

  /**
   * Join through associations, with optional where clauses,
   * and return the minimum value for the specified column
   *
   * ```ts
   * await user.minThrough('posts', { createdAt: range(start) }, 'posts.rating')
   * // 2.5
   * ```
   *
   * @param args - A chain of association names and where clauses ending with the column to min
   * @returns the min value of the specified column for the nested association's records
   */
  public async minThrough<
    I extends Dream,
    DB extends I['DB'],
    Schema extends I['schema'],
    TableName extends I['table'],
    const Arr extends readonly unknown[],
    FinalColumnWithAlias extends VariadicMinMaxThroughArgs<DB, Schema, TableName, Arr>,
    FinalColumn extends FinalColumnWithAlias extends Readonly<`${string}.${infer R extends Readonly<string>}`>
      ? R
      : never,
    FinalTableName extends FinalVariadicTableName<DB, Schema, TableName, Arr>,
    FinalColumnType extends TableColumnType<Schema, FinalTableName, FinalColumn>,
  >(this: I, ...args: [...Arr, FinalColumnWithAlias]): Promise<FinalColumnType> {
    return (await this.query().minThrough(...(args as any))) as FinalColumnType
  }

  /**
   * Join through associations, with optional where clauses,
   * and return the maximum value for the specified column
   *
   * ```ts
   * await user.maxThrough('posts', { createdAt: range(start) }, 'posts.rating')
   * // 4.8
   * ```
   * @param args - A chain of association names and where clauses ending with the column to max
   * @returns the max value of the specified column for the nested association's records
   */
  public async maxThrough<
    I extends Dream,
    DB extends I['DB'],
    Schema extends I['schema'],
    TableName extends I['table'],
    const Arr extends readonly unknown[],
    FinalColumnWithAlias extends VariadicMinMaxThroughArgs<DB, Schema, TableName, Arr>,
    FinalColumn extends FinalColumnWithAlias extends Readonly<`${string}.${infer R extends Readonly<string>}`>
      ? R
      : never,
    FinalTableName extends FinalVariadicTableName<DB, Schema, TableName, Arr>,
    FinalColumnType extends TableColumnType<Schema, FinalTableName, FinalColumn>,
  >(this: I, ...args: [...Arr, FinalColumnWithAlias]): Promise<FinalColumnType> {
    return (await this.query().maxThrough(...(args as any))) as FinalColumnType
  }

  /**
   * Retrieves the number of records matching
   * the default scopes for the final association.
   * If the Dream class for the final association
   * does not have any default scopes, this will be
   * the equivilent of simply requesting a count on
   * the table.
   *
   * ```ts
   * await user.countThrough('posts', 'comments', { body: null })
   * // 42
   * ```
   *
   * @param args - A chain of association names and where clauses
   * @returns the number of records found matching the given parameters
   */
  public async countThrough<
    I extends Dream,
    DB extends I['DB'],
    Schema extends I['schema'],
    TableName extends I['table'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicCountThroughArgs<DB, Schema, TableName, Arr>]): Promise<number> {
    return await this.query().countThrough(...(args as any))
  }

  /**
   * Deep clones the model and its non-association attributes.
   * Unsets primaryKey, created and updated fields.
   *
   * @returns Non-persisted, cloned Dream instance
   */
  public dup<I extends Dream>(this: I): I {
    const clone = this.clone({ includeAssociations: false })

    clone.isPersisted = false
    ;(clone as any)[clone.primaryKey] = undefined
    ;(clone as any)[clone.createdAtField] = undefined
    ;(clone as any)[clone.updatedAtField] = undefined

    return clone
  }

  /**
   * Deep clones the model and it's attributes, but maintains references to
   * loaded associations
   */
  private clone<I extends Dream>(
    this: I,
    { includeAssociations = true }: { includeAssociations?: boolean } = {}
  ): I {
    const self: any = this
    const clone: any = new self.constructor()

    const associationDataKeys = Object.values(
      (this.constructor as typeof Dream).associationMetadataMap()
    ).map(association => associationToGetterSetterProp(association))

    Object.keys(this).forEach(property => {
      if (!associationDataKeys.includes(property)) clone[property] = cloneDeepSafe(self[property])
    })

    if (includeAssociations) {
      associationDataKeys.forEach(
        associationDataKey => (clone[associationDataKey] = self[associationDataKey])
      )
    }

    return clone as I
  }

  /**
   * Creates an association for an instance. Automatically
   * handles setting foreign key and, in the case of polymorphism,
   * foreign key type.
   *
   * ```ts
   * await user.createAssociation('posts', { body: 'hello world' })
   * ```
   *
   * @param associationName - the name of the association to create
   * @param attributes - the attributes with which to create the associated model
   * @returns The created association
   */
  public async createAssociation<
    I extends Dream,
    Schema extends I['schema'],
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
    attributes: UpdateableAssociationProperties<I, RestrictedAssociationType> = {} as any
  ): Promise<NonNullable<AssociationType>> {
    return createAssociation(this, null, associationName, attributes)
  }

  ///////////////////
  // destroyAssociation
  ///////////////////
  public async destroyAssociation<
    I extends Dream,
    DB extends I['DB'],
    TableName extends I['table'],
    Schema extends I['schema'],
    AssociationName extends keyof I & DreamAssociationNamesWithRequiredWhereClauses<I>,
  >(
    this: I,
    associationName: AssociationName,
    options: DestroyOptions<I> & {
      where: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
    }
  ): Promise<number>

  public async destroyAssociation<
    I extends Dream,
    DB extends I['DB'],
    TableName extends I['table'],
    Schema extends I['schema'],
    AssociationName extends keyof I & DreamAssociationNamesWithoutRequiredWhereClauses<I>,
  >(
    this: I,
    associationName: AssociationName,
    options?: DestroyOptions<I> & {
      where?: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
    }
  ): Promise<number>

  /**
   * Destroys models associated with the current instance,
   * deleting their corresponding records within the database.
   *
   * ```ts
   * await user.destroyAssociation('posts', { body: 'hello world' })
   * ```
   *
   * @param associationName - The name of the association to destroy
   * @param opts.whereStatement - Optional where statement to apply to query before destroying
   * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @param opts.cascade - if false, will skip applying cascade undeletes on "dependent: 'destroy'" associations. Defaults to true
   * @returns The number of records deleted
   */
  public async destroyAssociation<I extends Dream, AssociationName extends keyof I>(
    this: I,
    associationName: AssociationName,
    options?: unknown
  ): Promise<number> {
    return await destroyAssociation(this, null, associationName, {
      ...destroyOptions<I>(options as any),
      associationWhereStatement: (options as any)?.where,
    })
  }

  ///////////////////
  // end: destroyAssociation
  ///////////////////

  ///////////////////
  // reallyDestroyAssociation
  ///////////////////
  public async reallyDestroyAssociation<
    I extends Dream,
    DB extends I['DB'],
    TableName extends I['table'],
    Schema extends I['schema'],
    AssociationName extends keyof I & DreamAssociationNamesWithRequiredWhereClauses<I>,
  >(
    this: I,
    associationName: AssociationName,
    options: DestroyOptions<I> & {
      where: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
    }
  ): Promise<number>

  public async reallyDestroyAssociation<
    I extends Dream,
    DB extends I['DB'],
    TableName extends I['table'],
    Schema extends I['schema'],
    AssociationName extends keyof I & DreamAssociationNamesWithoutRequiredWhereClauses<I>,
  >(
    this: I,
    associationName: AssociationName,
    options?: DestroyOptions<I> & {
      where?: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
    }
  ): Promise<number>

  /**
   * Destroys models associated with the current instance,
   * deleting their corresponding records within the database.
   *
   * If the record, or else any of it's associations
   * which are marked cascade: "destroy", are using
   * the SoftDelete decorator, it will be bypassed,
   * causing those records to be deleted from the database.
   *
   * ```ts
   * await user.reallyDestroyAssociation('posts', { body: 'hello world' })
   * ```
   *
   * @param associationName - The name of the association to destroy
   * @param opts.whereStatement - Optional where statement to apply to query before destroying
   * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @param opts.cascade - if false, will skip applying cascade undeletes on "dependent: 'destroy'" associations. Defaults to true
   * @returns The number of records deleted
   */
  public async reallyDestroyAssociation<I extends Dream, AssociationName extends keyof I>(
    this: I,
    associationName: AssociationName,
    options?: unknown
  ): Promise<number> {
    return await destroyAssociation(this, null, associationName, {
      ...reallyDestroyOptions<I>(options as any),
      associationWhereStatement: (options as any)?.where,
    })
  }
  ////////////////////////////////
  // end: reallyDestroyAssociation
  ////////////////////////////////

  ///////////////////
  // undestroyAssociation
  ///////////////////
  public async undestroyAssociation<
    I extends Dream,
    DB extends I['DB'],
    TableName extends I['table'],
    Schema extends I['schema'],
    AssociationName extends keyof I & DreamAssociationNamesWithRequiredWhereClauses<I>,
  >(
    this: I,
    associationName: AssociationName,
    options: DestroyOptions<I> & {
      where: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
    }
  ): Promise<number>

  public async undestroyAssociation<
    I extends Dream,
    DB extends I['DB'],
    TableName extends I['table'],
    Schema extends I['schema'],
    AssociationName extends keyof I & DreamAssociationNamesWithoutRequiredWhereClauses<I>,
  >(
    this: I,
    associationName: AssociationName,
    options?: DestroyOptions<I> & {
      where?: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
    }
  ): Promise<number>

  /**
   * Undestroys a SoftDelete association.
   * If cascade: true is passed, any child
   * associations that have been soft deleted
   * will also be undeleted.
   *
   * ```ts
   * await user.undestroyAssociation('posts', { body: 'hello world' })
   * ```
   *
   * @param associationName - The name of the association to destroy
   * @param opts.whereStatement - Optional where statement to apply to query before undestroying
   * @param opts.skipHooks - Whether or not to skip model hooks when undestroying
   * @param opts.cascade - Whether or not to cascade undestroy child associations
   * @returns The number of records undestroyed
   */
  public async undestroyAssociation<I extends Dream, AssociationName extends keyof I>(
    this: I,
    associationName: AssociationName,
    options?: unknown
  ): Promise<number> {
    return await undestroyAssociation(this, null, associationName, {
      ...undestroyOptions<I>(options as any),
      associationWhereStatement: (options as any)?.where,
    })
  }
  ///////////////////
  // end: undestroyAssociation
  ///////////////////

  ///////////////////
  // associationQuery
  ///////////////////
  public associationQuery<
    I extends Dream,
    DB extends I['DB'],
    TableName extends I['table'],
    Schema extends I['schema'],
    AssociationName extends keyof I & DreamAssociationNamesWithRequiredWhereClauses<I>,
  >(
    this: I,
    associationName: AssociationName,
    whereStatement: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
  ): Query<DreamAssociationType<I, AssociationName>>

  public associationQuery<
    I extends Dream,
    DB extends I['DB'],
    TableName extends I['table'],
    Schema extends I['schema'],
    AssociationName extends keyof I & DreamAssociationNamesWithoutRequiredWhereClauses<I>,
  >(
    this: I,
    associationName: AssociationName,
    whereStatement?: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
  ): Query<DreamAssociationType<I, AssociationName>>

  /**
   * Returns a Query instance for the specified
   * association on the current instance.
   *
   * ```ts
   * await user.associationQuery('posts').all()
   * // only user posts returned
   * ```
   *
   * @returns A Query scoped to the specified association on the current instance
   *
   */
  public associationQuery<I extends Dream, AssociationName extends keyof I>(
    this: I,
    associationName: AssociationName,
    whereStatement?: unknown
  ): unknown {
    return associationQuery(this, null, associationName, {
      associationWhereStatement: whereStatement as any,
      bypassAllDefaultScopes: DEFAULT_BYPASS_ALL_DEFAULT_SCOPES,
      defaultScopesToBypass: DEFAULT_DEFAULT_SCOPES_TO_BYPASS,
    })
  }
  ///////////////////
  // end: associationQuery
  ///////////////////

  ///////////////////
  // updateAssociation
  ///////////////////
  public async updateAssociation<
    I extends Dream,
    DB extends I['DB'],
    TableName extends I['table'],
    Schema extends I['schema'],
    AssociationName extends keyof I & DreamAssociationNamesWithRequiredWhereClauses<I>,
  >(
    this: I,
    associationName: AssociationName,
    attributes: Partial<DreamAttributes<DreamAssociationType<I, AssociationName>>>,
    updateAssociationOptions: {
      bypassAllDefaultScopes?: boolean
      defaultScopesToBypass?: AllDefaultScopeNames<I>[]
      skipHooks?: boolean
      where: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
    }
  ): Promise<number>

  public async updateAssociation<
    I extends Dream,
    DB extends I['DB'],
    TableName extends I['table'],
    Schema extends I['schema'],
    AssociationName extends keyof I & DreamAssociationNamesWithoutRequiredWhereClauses<I>,
  >(
    this: I,
    associationName: AssociationName,
    attributes: Partial<DreamAttributes<DreamAssociationType<I, AssociationName>>>,
    updateAssociationOptions?: {
      bypassAllDefaultScopes?: boolean
      defaultScopesToBypass?: AllDefaultScopeNames<I>[]
      skipHooks?: boolean
      where?: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>
    }
  ): Promise<number>

  /**
   * Updates all records matching the association with
   * the provided attributes. If a where statement is passed,
   * The where statement will be applied to the query
   * before updating.
   *
   * ```ts
   * await user.createAssociation('posts', { body: 'hello world' })
   * await user.createAssociation('posts', { body: 'howyadoin' })
   * await user.updateAssociation('posts', { body: 'goodbye world' }, { where: { body: 'hello world' }})
   * // 1
   * ```
   *
   * @returns The number of updated records
   */
  public async updateAssociation<I extends Dream, AssociationName extends keyof I>(
    this: I,
    associationName: AssociationName,
    attributes: Partial<DreamAttributes<DreamAssociationType<I, AssociationName>>>,
    updateAssociationOptions: unknown
  ): Promise<number> {
    return associationUpdateQuery(this, null, associationName, {
      associationWhereStatement: (updateAssociationOptions as any)?.where,
      bypassAllDefaultScopes:
        (updateAssociationOptions as any)?.bypassAllDefaultScopes ?? DEFAULT_BYPASS_ALL_DEFAULT_SCOPES,
      defaultScopesToBypass:
        (updateAssociationOptions as any)?.defaultScopesToBypass ?? DEFAULT_DEFAULT_SCOPES_TO_BYPASS,
    }).update(attributes, { skipHooks: (updateAssociationOptions as any)?.skipHooks })
  }
  ///////////////////
  // end: updateAssociation
  ///////////////////

  /**
   * Sends data through for use as passthrough data
   * for the associations that require it.
   *
   * ```ts
   * class Post {
   *   @HasMany(() => LocalizedText)
   *   public localizedTexts: LocalizedText[]
   *
   *   @HasOne(() => LocalizedText, {
   *     where: { locale: DreamConst.passthrough },
   *   })
   *   public currentLocalizedText: LocalizedText
   * }
   *
   * await User.passthrough({ locale: 'es-ES' })
   *   .preload('posts', 'currentLocalizedText')
   *   .first()
   * ```
   *
   * @param passthroughWhereStatement - where statement used for associations that require passthrough data
   * @returns A cloned Query with the passthrough data
   */
  public passthrough<I extends Dream, PassthroughColumns extends PassthroughColumnNames<I>>(
    this: I,
    passthroughWhereStatement: PassthroughWhere<PassthroughColumns>
  ): LoadBuilder<I> {
    return new LoadBuilder<I>(this).passthrough(passthroughWhereStatement)
  }

  /**
   * Loads the requested associations upon execution
   *
   * NOTE: Preload is often a preferrable way of achieving the
   * same goal.
   *
   * ```ts
   * await user
   *  .load('posts', { body: ops.ilike('%hello world%') }, 'comments', 'replies')
   *  .load('images')
   *  .execute()
   *
   * user.posts[0].comments[0].replies[0]
   * // Reply{}
   *
   * user.images[0]
   * // Image{}
   * ```
   *
   * @param args - A list of associations (and optional where clauses) to load
   * @returns A chainable LoadBuilder instance
   */
  public load<
    I extends Dream,
    DB extends I['DB'],
    TableName extends I['table'],
    Schema extends I['schema'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicLoadArgs<DB, Schema, TableName, Arr>]): LoadBuilder<I> {
    return new LoadBuilder<I>(this).load(...(args as any))
  }

  /**
   * Returns true if the association specified has
   * been loaded on this instance
   *
   * Since accessing associations that haven't been
   * loaded/preloaded will raise an exception, `loaded`
   * is useful for conditionally loading from the database
   * in contexts where an association may not yet be loaded.
   *
   * ```ts
   * user.loaded('posts')
   * // false
   *
   * user = await user.load('posts').execute()
   * user.loaded('posts')
   * // true
   * ```
   *
   * @param associationName - the association name you wish to check the loading of
   * @returns A boolean
   */
  public loaded<
    I extends Dream,
    TableName extends I['table'],
    Schema extends I['schema'],
    //
    AssociationName extends NextPreloadArgumentType<Schema, TableName>,
  >(this: I, associationName: AssociationName) {
    try {
      ;(this as any)[associationName]
      return true
    } catch (error) {
      if ((error as any).constructor !== NonLoadedAssociation) throw error
      return false
    }
  }

  /**
   * Reloads an instance, refreshing all it's attribute values
   * to those in the database.
   *
   * NOTE: this does not refresh associations
   *
   * ```ts
   * await user.reload()
   * ```
   *
   * @returns void
   */
  public async reload<I extends Dream>(this: I) {
    await reload(this)
  }

  /**
   * Serializes an instance. You can specify a serializer key,
   * or else the default will be used
   *
   * ```ts
   * // uses the default serializer provided in the model's `serializers` getter
   * await user.serialize()
   *
   * // uses the summary serializer provided in the model's `serializers` getter
   * await user.serialize({ serializerKey: 'summary' })
   * ```
   *
   * @param args.casing - Which casing to use when serializing (camel or snake, default camel)
   * @params args.serializerKey - The key to use when referencing the object returned by the `serializers` getter on the given model instance (defaults to "default")
   * @returns A serialized representation of the model
   */
  public serialize<I extends Dream>(
    this: I,
    { casing = null, serializerKey }: DreamSerializeOptions<I> = {}
  ) {
    const serializerClass = inferSerializerFromDreamOrViewModel(this, serializerKey?.toString())
    if (!serializerClass) throw new MissingSerializer(this.constructor as typeof Dream)

    const serializer = new serializerClass(this)
    if (casing) serializer.casing(casing)
    return serializer.render()
  }

  /**
   * Takes the attributes passed in and sets their values,
   * leveraging any custom setters defined for these attributes.
   *
   * NOTE:
   * To bypass custom-defined setters, use `#setAttributes` instead.
   *
   * ```ts
   *  const user = new User()
   *  user.assignAttributes({ email: 'my@email', password: 'my password' })
   * ```
   */
  public assignAttributes<I extends Dream>(this: I, attributes: UpdateableProperties<I>) {
    return this._setAttributes(attributes, { bypassUserDefinedSetters: false })
  }

  /**
   * Takes the attributes passed in and sets their values internally,
   * bypassing any custom setters defined for these attributes.
   *
   * NOTE:
   * To leverage custom-defined setters, use `#assignAttributes` instead.
   *
   * ```ts
   *  const user = new User()
   *  user.setAttributes({ email: 'my@email', password: 'my password' })
   * ```
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

  /**
   * Saves the state of the current instance to the
   * database. For new instances (that have not been
   * persisted), `save` and `create` model hooks will be called.
   * For instances that have already been persisted,
   * the `save` and `update` model hooks will be called.
   *
   * Upon saving a new instance, the primary key, timestamp
   * fields (if defined), and `type` (if STI) will be set on
   * the model.
   *
   * Upon updating an instance, the update timestamp (if defined)
   * will be updated on the model.
   *
   * ```ts
   * const user = User.new({ email: 'how@yadoin' })
   * user.name = 'fred'
   * await user.save()
   *
   * user.email // 'how@yadoin'
   * user.name // 'fred'
   * user.id // 1
   * user.createdAt // A DateTime object
   * user.updatedAt // A DateTime object
   *
   * // If User were STI:
   * user.type // 'User'
   * ```
   *
   * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @returns void
   */
  public async save<I extends Dream>(this: I, { skipHooks }: { skipHooks?: boolean } = {}): Promise<void> {
    await saveDream(this, null, { skipHooks })
  }

  /**
   * Applies transaction to a new Query instance
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   const user = await User.txn(txn).create({ email: 'how@yadoin' })
   *   await Pet.txn(txn).create({ user })
   * })
   * ```
   *
   * @param txn - A DreamTransaction instance (collected by calling `ApplicationModel.transaction`)
   * @returns A Query scoped to this model with the transaction applied
   */
  public txn<I extends Dream>(this: I, txn: DreamTransaction<Dream>): DreamInstanceTransactionBuilder<I> {
    return new DreamInstanceTransactionBuilder<I>(this, txn)
  }

  /**
   * Applies all attribute changes passed to the Dream
   * instance, leveraging any custom-defined setters,
   * and then saves the Dream instance. Can be called
   * on an unpersisted Dream instance.
   *
   * See {@link Dream.save | save} for details on
   * the side effects of saving.
   *
   * NOTE:
   * To bypass custom-defined setters, use {@link Dream.updateAttributes | updateAttributes} instead.
   *
   * ```ts
   *  const user = await User.create({ email: 'saly@gmail.com' })
   *  await user.update({ email: 'sally@gmail.com' })
   * ```
   *
   * @param attributes - the attributes to set on the model
   * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @returns void
   */
  public async update<I extends Dream>(
    this: I,
    attributes: UpdateableProperties<I>,
    { skipHooks }: { skipHooks?: boolean } = {}
  ): Promise<void> {
    // use #assignAttributes to leverage any custom-defined setters
    this.assignAttributes(attributes)
    await this.save({ skipHooks })
  }

  /**
   * Applies all attribute changes passed to the dream,
   * bypassing any custom-defined setters,
   * and then saves the dream instance. Does not bypass
   * model hooks.
   *
   * See {@link Dream.save | save} for details on
   * the side effects of saving.
   *
   * NOTE:
   * To update the values without bypassing any custom-defined
   * setters, use {@link Dream.update | update} instead.
   *
   * ```ts
   * const user = await User.create({ email: 'saly@gmail.com' })
   * await user.updateAttributes({ email: 'sally@gmail.com' })
   * ```
   *
   * @param attributes - The attributes to update on this instance
   * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @returns - void
   */
  public async updateAttributes<I extends Dream>(
    this: I,
    attributes: UpdateableProperties<I>,
    { skipHooks }: { skipHooks?: boolean } = {}
  ): Promise<void> {
    // use #setAttributes to bypass any custom-defined setters
    this.setAttributes(attributes)
    await this.save({ skipHooks })
  }

  /**
   * Flags a dream model so that it does not
   * actually destroy when in a destroy phase.
   * This is usually used for a soft-delete
   * pattern
   *
   * ```ts
   * class User extends ApplicationModel {
   *   @BeforeDestroy()
   *   public softDelete() {
   *     await this.update({ deletedAt: DateTime.now() })
   *     this.preventDeletion()
   *   }
   * }
   * ```
   *
   * @returns void
   */
  public preventDeletion() {
    this._preventDeletion = true
  }

  /**
   * Flags a dream model so that it allows
   * deletion once again.
   *
   * Undoes {@link Dream.(preventDeletion:instance) | preventDeletion}
   *
   * ```ts
   * class User extends ApplicationModel {
   *   @BeforeDestroy()
   *   public async softDelete() {
   *     await this.update({ deletedAt: DateTime.now() })
   *     this.preventDeletion()
   *   }
   *
   *   @BeforeDestroy()
   *   public async undoSoftDelete() {
   *     await this.update({ deletedAt: null })
   *     this.unpreventDeletion()
   *   }
   * }
   * ```
   *
   * @returns void
   */
  public unpreventDeletion() {
    this._preventDeletion = false
    return this
  }
  private _preventDeletion: boolean = false
}

export interface CreateOrFindByExtraOps<T extends typeof Dream> {
  createWith?:
    | WhereStatement<InstanceType<T>['DB'], InstanceType<T>['schema'], InstanceType<T>['table']>
    | UpdateablePropertiesForClass<T>
}
