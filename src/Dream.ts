import { CompiledQuery, Selectable } from 'kysely'

import yoctocolors from 'yoctocolors'
import { pgErrorType, UNIQUE_VIOLATION } from './db/errors.js'
import { VirtualAttributeStatement } from './decorators/field-or-getter/Virtual.js'
import associationToGetterSetterProp from './decorators/field/association/associationToGetterSetterProp.js'
import { blankAssociationsFactory } from './decorators/field/association/shared.js'
import { blankHooksFactory } from './decorators/field/lifecycle/shared.js'
import resortAllRecords from './decorators/field/sortable/helpers/resortAllRecords.js'
import { SortableFieldConfig } from './decorators/field/sortable/Sortable.js'
import { ScopeStatement } from './decorators/static-method/Scope.js'
import DreamApp from './dream-app/index.js'
import DreamClassTransactionBuilder from './dream/DreamClassTransactionBuilder.js'
import DreamInstanceTransactionBuilder from './dream/DreamInstanceTransactionBuilder.js'
import DreamTransaction from './dream/DreamTransaction.js'
import associationQuery from './dream/internal/associations/associationQuery.js'
import associationUpdateQuery from './dream/internal/associations/associationUpdateQuery.js'
import createAssociation from './dream/internal/associations/createAssociation.js'
import destroyAssociation from './dream/internal/associations/destroyAssociation.js'
import loadedOrLoadAssociation from './dream/internal/associations/loadedOrLoadAssociation.js'
import undestroyAssociation from './dream/internal/associations/undestroyAssociation.js'
import associationStringToNameAndAlias from './dream/internal/associationStringToNameAndAlias.js'
import destroyDream from './dream/internal/destroyDream.js'
import {
  DestroyOptions,
  destroyOptions,
  reallyDestroyOptions,
  undestroyOptions,
} from './dream/internal/destroyOptions.js'
import ensureSTITypeFieldIsSet from './dream/internal/ensureSTITypeFieldIsSet.js'
import { RecursiveSerializerInfo } from './dream/internal/extractNestedPaths.js'
import findOrCreateBy from './dream/internal/findOrCreateBy.js'
import printSerializerHierarchyLevel from './dream/internal/printSerializerHierarchyLevel.js'
import reload from './dream/internal/reload.js'
import runValidations from './dream/internal/runValidations.js'
import saveDream from './dream/internal/saveDream.js'
import {
  DEFAULT_BYPASS_ALL_DEFAULT_SCOPES,
  DEFAULT_DEFAULT_SCOPES_TO_BYPASS,
  DEFAULT_SKIP_HOOKS,
} from './dream/internal/scopeHelpers.js'
import undestroyDream from './dream/internal/undestroyDream.js'
import updateOrCreateBy from './dream/internal/updateOrCreateBy.js'
import LeftJoinLoadBuilder from './dream/LeftJoinLoadBuilder.js'
import LoadBuilder from './dream/LoadBuilder.js'
import Query from './dream/Query.js'
import CannotAssociationQueryOnUnpersistedDream from './errors/associations/CannotAssociationQueryOnUnpersistedDream.js'
import CannotCreateAssociationOnUnpersistedDream from './errors/associations/CannotCreateAssociationOnUnpersistedDream.js'
import CannotDestroyAssociationOnUnpersistedDream from './errors/associations/CannotDestroyAssociationOnUnpersistedDream.js'
import CannotPassNullOrUndefinedToRequiredBelongsTo from './errors/associations/CannotPassNullOrUndefinedToRequiredBelongsTo.js'
import CannotUpdateAssociationOnUnpersistedDream from './errors/associations/CannotUpdateAssociationOnUnpersistedDream.js'
import CanOnlyPassBelongsToModelParam from './errors/associations/CanOnlyPassBelongsToModelParam.js'
import NonLoadedAssociation from './errors/associations/NonLoadedAssociation.js'
import CannotCallUndestroyOnANonSoftDeleteModel from './errors/CannotCallUndestroyOnANonSoftDeleteModel.js'
import ConstructorOnlyForInternalUse from './errors/ConstructorOnlyForInternalUse.js'
import CreateOrFindByFailedToCreateAndFind from './errors/CreateOrFindByFailedToCreateAndFind.js'
import CreateOrUpdateByFailedToCreateAndUpdate from './errors/CreateOrUpdateByFailedToCreateAndUpdate.js'
import GlobalNameNotSet from './errors/dream-app/GlobalNameNotSet.js'
import DreamMissingRequiredOverride from './errors/DreamMissingRequiredOverride.js'
import NonExistentScopeProvidedToResort from './errors/NonExistentScopeProvidedToResort.js'
import RecordNotFound from './errors/RecordNotFound.js'
import MissingSerializersDefinition from './errors/serializers/MissingSerializersDefinition.js'
import CalendarDate from './helpers/CalendarDate.js'
import cloneDeepSafe from './helpers/cloneDeepSafe.js'
import compact from './helpers/compact.js'
import { DateTime } from './helpers/DateTime.js'
import cachedTypeForAttribute from './helpers/db/cachedTypeForAttribute.js'
import isJsonColumn from './helpers/db/types/isJsonColumn.js'
import notEqual from './helpers/notEqual.js'
import DreamSerializerBuilder from './serializer/builders/DreamSerializerBuilder.js'
import { inferSerializersFromDreamClassOrViewModelClass } from './serializer/helpers/inferSerializerFromDreamOrViewModel.js'
import { HasManyStatement } from './types/associations/hasMany.js'
import { HasOneStatement } from './types/associations/hasOne.js'
import {
  AssociationMetadataMap,
  AssociationStatementsMap,
  OnStatementForSpecificColumns,
  PassthroughOnClause,
  WhereStatement,
} from './types/associations/shared.js'
import { AssociationTableNames, DbConnectionType } from './types/db.js'
import {
  AllDefaultScopeNames,
  AssociationNameToDream,
  AttributeKeys,
  CreateOrFindByExtraOpts,
  DefaultOrNamedScopeName,
  DreamAssociationNames,
  DreamAssociationNamesWithoutRequiredOnClauses,
  DreamAssociationNamesWithPassthroughOnClauses,
  DreamAssociationNamesWithRequiredOnClauses,
  DreamAttributes,
  DreamBelongsToAssociationNames,
  DreamColumnNames,
  DreamConstructorType,
  DreamHasManyAssociationNames,
  DreamHasOneAssociationNames,
  DreamModelAssociationNames,
  DreamParamSafeColumnNames,
  DreamPrimaryKeyType,
  DreamSerializerKey,
  GlobalModelNames,
  GlobalSerializerName,
  JoinAndStatements,
  OrderDir,
  PassthroughColumnNames,
  PassthroughOnClauseKeys,
  PluckEachArgs,
  PrimaryKeyForFind,
  RequiredOnClauseKeys,
  TableColumnNames,
  UpdateableAssociationProperties,
  UpdateableProperties,
  UpdateablePropertiesForClass,
  UpdateOrCreateByExtraOpts,
} from './types/dream.js'
import { HookStatement, HookStatementMap } from './types/lifecycle.js'
import {
  BaseModelColumnTypes,
  DefaultQueryTypeOptions,
  FindEachOpts,
  LoadForModifierFn,
  PaginatedDreamQueryOptions,
  PaginatedDreamQueryResult,
  QueryWithJoinedAssociationsType,
  QueryWithJoinedAssociationsTypeAndNoPreload,
  ScrollPaginatedDreamQueryOptions,
  ScrollPaginatedDreamQueryResult,
} from './types/query.js'
import {
  DreamModelSerializerType,
  InternalAnyRendersOneOrManyOpts,
  InternalAnyTypedSerializerDelegatedAttribute,
  InternalAnyTypedSerializerRendersMany,
  InternalAnyTypedSerializerRendersOne,
  SimpleObjectSerializerType,
} from './types/serializer.js'
import { ValidationStatement, ValidationType } from './types/validation.js'
import {
  JoinedAssociation,
  JoinedAssociationsTypeFromAssociations,
  VariadicJoinsArgs,
  VariadicLeftJoinLoadArgs,
  VariadicLoadArgs,
} from './types/variadic.js'

const RECURSIVE_SERIALIZATION_MAX_REPEATS = 4

export default class Dream {
  public DB: any

  /**
   * @internal
   *
   * This getter will throw an error when developers use .toEqual instead of
   * useToMatchDreamModels or useToMatchDreamModel in a vite spec. This
   * must be the first getter in the class in order for this to work, so don't move it.
   *
   */
  private get _useToMatchDreamModels(): any {
    throw new Error(`
      Hi there! It looks like you're trying to compare a Dream model in
      a Vite expectation using \`toEqual\`. That won't work.
      Instead, use \`toMatchDreamModel\` or \`toMatchDreamModels\`.

      For example, instead of:

        expect(balloons).toEqual([balloon])

      write:

        expect(balloons).toMatchDreamModels([balloon])
    `)
  }

  /**
   * @internal
   *
   * Modern Javascript sets all properties that do not have an explicit
   * assignment within the constructor to undefined in an implicit constructor.
   * Since the Dream constructor sets the value of properties of instances of
   * classes that extend Dream (e.g. when passing attributes to #new or #create
   * or when loading a model via one of the #find methods or #all), we need to
   * prevent those properties from being set back to undefined. Since all
   * properties corresponding to a database column get a setter, we achieve this
   * protection by including a guard in the setters that returns if this
   * property is set.
   *
   */
  private columnSetterGuardActivated: boolean = false

  /**
   * @internal
   *
   * Certain features (e.g. passing a Dream instance to `create` so that it automatically destructures polymorphic type and primary key)
   * need static access to things set up by decorators (e.g. associations). Stage 3 Decorators change the context that is available
   * at decoration time such that the class of a property being decorated is only avilable during instance instantiation. In order
   * to only apply static values once, on boot, `globallyInitializingDecorators` is set to true on Dream, and all Dream models are instantiated.
   *
   */
  private static globallyInitializingDecorators: boolean = false

  public get schema(): any {
    throw new DreamMissingRequiredOverride(this.constructor as typeof Dream, 'schema')
  }

  public get connectionName(): any {
    return 'default' as const
  }

  public get connectionTypeConfig(): any {
    throw new DreamMissingRequiredOverride(this.constructor as typeof Dream, 'connectionTypeConfig')
  }

  public get globalTypeConfig(): any {
    throw new DreamMissingRequiredOverride(this.constructor as typeof Dream, 'globalTypeConfig')
  }

  /**
   * Determines if the provided Dream class is the same as or a subclass of this Dream class.
   * This method is particularly useful for runtime type checking and works with STI (Single Table Inheritance) classes.
   *
   * For regular Dream classes, this checks if the provided class is exactly the same class.
   * For STI classes, this checks inheritance relationships - a child STI class will return true
   * when compared against its parent class.
   *
   * ```ts
   * // Regular class comparison
   * User.typeof(User)    // true
   * User.typeof(Pet)     // false
   *
   * // STI inheritance checking
   * class Balloon extends ApplicationModel {
   *   // base STI class
   * }
   *
   * class Mylar extends Balloon {
   *   // STI child class
   * }
   *
   * Balloon.typeof(Balloon) // true
   * Balloon.typeof(Mylar)   // false
   * Mylar.typeof(Balloon)   // true (child recognizes parent)
   * Mylar.typeof(Mylar)     // true
   *
   * // Runtime type checking with variables
   * const dreamClass: typeof Dream = getRandomDreamClass()
   * if (dreamClass.typeof(Pet)) {
   *   // dreamClass is Pet or a subclass of Pet
   * }
   * ```
   *
   * @param dreamClass - The Dream class to compare against this class
   * @returns `true` if the provided class is the same as this class or if this class is a subclass of the provided class (STI inheritance), `false` otherwise
   */
  public static typeof(dreamClass: typeof Dream): boolean {
    return this.new() instanceof dreamClass
  }

  /**
   * Shadows #primaryKey, a getter which can be overwritten to customize the id field
   * for a given model.
   *
   * @returns string
   */
  public static get primaryKey() {
    return this.prototype._primaryKey
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
   * @internal
   *
   * The `createdAt` field may be customized on a Dream model:
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
  private get _createdAtField() {
    return (this as any).createdAtField || 'createdAt'
  }

  /**
   * @internal
   *
   * The `updatedAt` field may be customized on a Dream model:
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
  private get _updatedAtField() {
    return (this as any).updatedAtField || 'updatedAt'
  }

  /**
   * @internal
   *
   * The `deletedAt` field may be customized on a Dream model:
   *
   * ```ts
   *  class User extends ApplicationModel {
   *    public get deletedAtField() {
   *       return 'deletedAtTimestamp' as const
   *    }
   *  }
   *
   * const user = await User.first()
   * await user.destroy()
   * user.deletedAtTimestamp // returns the DateTime that this user was soft-deleted
   * ```
   *
   * @returns string
   */
  private get _deletedAtField() {
    return (this as any).deletedAtField || 'deletedAt'
  }

  /**
   * @internal
   *
   * Model storage for association metadata, set when using the association decorators like:
   *   @deco.HasOne
   *   @deco.HasMany
   *   @deco.BelongsTo
   */
  private static associationMetadataByType: AssociationStatementsMap = blankAssociationsFactory(this, {
    freeze: true,
  })

  /**
   * @internal
   *
   * Model storage for scope metadata, set when using the Scope decorator
   * (this default assignment simply ensures that it is
   * always an array rather than undefined,
   * freezing ensures that we never modify the static array on the inherited Dream class)
   */
  private static scopes: {
    default: readonly ScopeStatement[] | ScopeStatement[]
    named: readonly ScopeStatement[] | ScopeStatement[]
  } = Object.freeze({
    default: Object.freeze([]),
    named: Object.freeze([]),
  })

  /**
   * @internal
   *
   * Model storage for virtual attribute metadata, set on the inheriting class when
   * using the Virtual decorator (this default assignment simply ensures that it is
   * always an array rather than undefined,
   * freezing ensures that we never modify the static array on the inherited Dream class)
   */
  private static virtualAttributes: readonly VirtualAttributeStatement[] | VirtualAttributeStatement[] =
    Object.freeze([])

  /**
   * @internal
   *
   * Model storage for additional columns that may not be set via the new/create/update
   * methods. Set on the inheriting class when using the Virtual decorator (this default
   * assignment simply ensures that it is always an array rather than undefined)
   */
  private static explicitUnsafeParamColumns: readonly string[] | string[] = Object.freeze([])

  /**
   * @internal
   *
   * Model storage for sortable metadata, set when using the Sortable decorator
   *  (this default assignment simply ensures that it is always an array rather than undefined,
   * freezing ensures that we never modify the static array on the inherited Dream class)
   *
   */
  private static sortableFields: readonly SortableFieldConfig[] | SortableFieldConfig[] = Object.freeze([])

  /**
   * @internal
   *
   * Model storage for STI metadata, set when using the STI decorator
   */
  private static extendedBy: (typeof Dream)[] | null = null

  /**
   * @internal
   *
   * Model storage for STI metadata, set when using the STI decorator
   *  (this default assignment simply ensures that it is always a valid object rather than undefined,
   * freezing ensures that we never modify the static array on the inherited Dream class)
   */
  private static sti: {
    active: boolean
    baseClass: typeof Dream | null
    value: string | null
  } = Object.freeze({
    active: false,
    baseClass: null,
    value: null,
  })

  /**
   * @internal
   *
   * Model storage for model hook metadata, set when using the following decorators:
   *   BeforeCreate
   *   BeforeUpdate
   *   BeforeSave
   *   BeforeDestroy
   *   AfterCreate
   *   AfterCreateCommit
   *   AfterUpdate
   *   AfterUpdateCommit
   *   AfterSave
   *   AfterSaveCommit
   *   AfterDestroy
   *   AfterDestroyCommit
   */
  private static hooks: Readonly<HookStatementMap> = blankHooksFactory(this, { freeze: true })

  /**
   * @internal
   *
   * Model storage for validation metadata, set when using the Validates decorator
   * (this default assignment simply ensures that it is always an array rather than undefined,
   * freezing ensures that we never modify the static array on the inherited Dream class)
   */
  private static validations: readonly ValidationStatement[] | ValidationStatement[] = Object.freeze([])

  /**
   * @internal
   *
   * Model storage for custom validation metadata, set when using the Validate decorator
   * (this default assignment simply ensures that it is always an array rather than undefined,
   * freezing ensures that we never modify the static array on the inherited Dream class)
   *
   */
  private static customValidations: readonly string[] | string[] = Object.freeze([])

  /**
   * @internal
   *
   * Model storage for replica-safe metadata, set when using the ReplicaSafe decorator
   */
  private static replicaSafe = false

  /**
   * @internal
   *
   * Model storage for soft-delete metadata, set when using the SoftDelete decorator
   */
  private static softDelete = false

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
  private static get isSTIBase() {
    return !!this.extendedBy?.length && !this.isSTIChild
  }

  /**
   * @internal
   *
   * Returns true if this model class a child class of a base STI model
   *
   * @returns boolean
   */
  private static get isSTIChild() {
    return !!this.sti?.active
  }

  /**
   * @internal
   *
   * Returns either the base STI class, or else this class
   *
   * @returns A dream class
   */
  private static get stiBaseClassOrOwnClass(): typeof Dream {
    return this.sti.baseClass || this
  }

  /**
   * Returns the string value representing this model type that will be stored in the
   * database for STI children or polymorphic associations.
   *
   * This value is used to identify the specific model class when querying polymorphic
   * associations or STI records. For STI models, this returns the base class' sanitized name.
   * For regular models, it returns the model's sanitized class name.
   *
   * When building queries manually, use this method for the type or polymorphic type part of
   * the query. For example:
   *
   * ```ts
   * // Using in polymorphic queries
   * const localizedTexts = await LocalizedText.passthrough({ locale })
   *   .whereAny(
   *     modelsWithTextAssociation.map(
   *       model => ({
   *         localizableId: model.primaryKeyValue(),
   *         localizableType: model.referenceTypeString,
   *       })
   *     )
   *   )
   *   .all()
   *
   * // Example values for different model types
   * const user = User.new()
   * user.referenceTypeString // 'User'
   *
   * // For STI child classes, returns the base class name
   * const mylarBalloon = MylarBalloon.new() // extends Balloon (STI base)
   * mylarBalloon.referenceTypeString // 'Balloon'
   * ```
   *
   * @returns The string identifier for this model type used in database storage
   */

  public static get referenceTypeString(): string {
    return this.stiBaseClassOrOwnClass.sanitizedName
  }

  /**
   * @internal
   *
   * Returns the class name, replacing prefixed underscores, since esbuild
   * will translate some class names to have underscore prefixes, which can
   * cause unexpected behavior.
   *
   * see https://github.com/evanw/esbuild/issues/1260 for more information
   *
   * @returns string
   */
  public static get sanitizedName(): string {
    return this.name.replace(/^_/, '')
  }

  /**
   * @internal
   *
   * Shadows .stiBaseClassOrOwnClass. Returns either the base STI class, or else this class
   *
   * @returns A dream class
   */
  private get stiBaseClassOrOwnClass(): typeof Dream {
    return (this.constructor as typeof Dream).stiBaseClassOrOwnClass
  }

  /**
   * Returns the string value representing this model type that will be stored in the
   * database for STI children or polymorphic associations.
   *
   * This value is used to identify the specific model class when querying polymorphic
   * associations or STI records. For STI models, this returns the base class' sanitized name.
   * For regular models, it returns the model's sanitized class name.
   *
   * When building queries manually, use this method for the type or polymorphic type part of
   * the query. For example:
   *
   * ```ts
   * // Using in polymorphic queries
   * const localizedTexts = await LocalizedText.passthrough({ locale })
   *   .whereAny(
   *     modelsWithTextAssociation.map(
   *       model => ({
   *         localizableId: model.primaryKeyValue(),
   *         localizableType: model.referenceTypeString,
   *       })
   *     )
   *   )
   *   .all()
   *
   * // Example values for different model types
   * const user = User.new()
   * user.referenceTypeString // 'User'
   *
   * // For STI child classes, returns the base class name
   * const mylarBalloon = MylarBalloon.new() // extends Balloon (STI base)
   * mylarBalloon.referenceTypeString // 'Balloon'
   * ```
   *
   * @returns The string identifier for this model type used in database storage
   */

  public get referenceTypeString(): string {
    return (this.constructor as typeof Dream).referenceTypeString
  }

  /**
   * this.constructor.name may be prefixed with an underscore during conversion to Javascript.
   * This method returns the constructor name without a leading underscore.
   *
   * @returns A string
   */
  public get sanitizedConstructorName(): string {
    return (this.constructor as typeof Dream).sanitizedName
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
  private static addHook(hookType: keyof typeof this.hooks, statement: HookStatement) {
    const existingHook = this.hooks[hookType].find(hook => hook.method === statement.method)
    if (existingHook) return
    ;(this.hooks as HookStatementMap)[hookType] = [...this.hooks[hookType], statement]
  }

  /**
   * @internal
   *
   * Returns a unique global name for the given model.
   *
   * @returns A string representing a unique key for this model
   */
  public static get globalName(): string {
    if (!this._globalName) throw new GlobalNameNotSet(this)
    return this._globalName
  }
  private static _globalName: string

  /**
   * @internal
   *
   * Used by DreamApp during the load process
   * for models and serializers to assign
   * unique global names to each model based on the file
   * name of that model.
   */
  private static setGlobalName(globalName: string) {
    this._globalName = globalName
  }

  private static serializationMap<
    T extends typeof Dream,
    I extends InstanceType<T>,
    SerializerKey extends DreamSerializerKey<I>,
  >(this: T, serializerKey?: SerializerKey): RecursiveSerializerInfo {
    const key = serializerKey || 'default'
    const serializer = inferSerializersFromDreamClassOrViewModelClass(this, key)[0] ?? null
    if (!serializer) throw new Error(`unable to find serializer with key: ${key as string}`)
    return this.recursiveSerializationMap(serializer)
  }

  private static displaySerialization<
    T extends typeof Dream,
    I extends InstanceType<T>,
    SerializerKey extends DreamSerializerKey<I>,
  >(this: T, serializerKey?: SerializerKey): RecursiveSerializerInfo {
    const key = serializerKey || 'default'
    const serializer = inferSerializersFromDreamClassOrViewModelClass(this, key)[0] ?? null
    if (!serializer) throw new Error(`unable to find serializer with key: ${key as string}`)

    console.log(yoctocolors.cyan(this.sanitizedName))
    console.log(yoctocolors.gray((serializer as unknown as Record<'globalName', string>).globalName))

    return this.recursiveSerializationMap(serializer, {
      forDisplay: true,
    })
  }

  private static recursiveSerializationMap(
    serializer: DreamModelSerializerType | SimpleObjectSerializerType,
    {
      forDisplay = false,
      forDisplayDepth = 0,
      repeatedAssociationTracker = {},
    }: {
      forDisplay?: boolean
      forDisplayDepth?: number
      repeatedAssociationTracker?: Record<string, number>
    } = {}
  ) {
    const depthTrackerId = this.globalName
    repeatedAssociationTracker[depthTrackerId] ??= 0
    if (repeatedAssociationTracker[depthTrackerId] + 1 > RECURSIVE_SERIALIZATION_MAX_REPEATS) return {}
    repeatedAssociationTracker[depthTrackerId]++

    const serializerBuilder = serializer(undefined as any, undefined as any) as DreamSerializerBuilder<
      any,
      any
    >
    const serializerAssociations = serializerBuilder['attributes'].filter(attribute =>
      ['rendersOne', 'rendersMany', 'delegatedAttribute'].includes(attribute.type as string)
    ) as (
      | InternalAnyTypedSerializerRendersMany<any>
      | InternalAnyTypedSerializerRendersOne<any>
      | InternalAnyTypedSerializerDelegatedAttribute
    )[]

    const mappedAssociations = serializerAssociations.reduce((accumulator, serializerAssociation) => {
      const serializerAssociationName =
        (serializerAssociation as InternalAnyTypedSerializerDelegatedAttribute).targetName ??
        serializerAssociation.name

      const serializerAssociationType = serializerAssociation.type
      const association = this['getAssociationMetadata'](serializerAssociationName)
      if (!association) return accumulator

      const maybeAssociatedClasses = association.modelCB()
      if (!maybeAssociatedClasses)
        throw new Error(
          `No class defined on ${serializerAssociationName} association on ${this.sanitizedName}`
        )
      const associatedClasses = Array.isArray(maybeAssociatedClasses)
        ? maybeAssociatedClasses
        : [maybeAssociatedClasses]

      /////////////////////////////////////////////////
      // map associated classes to their serializers //
      /////////////////////////////////////////////////
      const associatedClassSerializerTuples: [
        typeof Dream,
        DreamModelSerializerType | SimpleObjectSerializerType,
      ][] = associatedClasses.flatMap(associatedClass => {
        /**
         * `serializers` is an array because `associatedClass` may be an STI
         * base, with each of its STI children having its own serializer
         */
        let serializers: (DreamModelSerializerType | SimpleObjectSerializerType)[] = []

        try {
          serializers = (serializerAssociation.options as InternalAnyRendersOneOrManyOpts).serializer
            ? compact([(serializerAssociation.options as InternalAnyRendersOneOrManyOpts).serializer])
            : compact(
                inferSerializersFromDreamClassOrViewModelClass(
                  associatedClass,
                  (serializerAssociation.options as InternalAnyRendersOneOrManyOpts).serializerKey
                )
              )
        } catch (error) {
          if (!(error instanceof MissingSerializersDefinition)) throw error
          serializers = []
        }

        return serializers.map(
          serializer =>
            [associatedClass, serializer] as [
              typeof Dream,
              DreamModelSerializerType | SimpleObjectSerializerType,
            ]
        )
      })
      /////////////////////////////////////////////////////
      // end:map associated classes to their serializers //
      /////////////////////////////////////////////////////

      ///////////////////////////////////////////////////////////////////////////////////////////////////
      // reduce over all associated serializers, recursively building out their associated serializers //
      ///////////////////////////////////////////////////////////////////////////////////////////////////
      const innerAssociationSerializerInfo = associatedClassSerializerTuples.reduce(
        (innerAccumulator, [associatedClass, associatedSerializer]) => {
          if (forDisplay && serializerAssociationType !== 'delegatedAttribute') {
            printSerializerHierarchyLevel({
              serializerAssociationType,
              serializerAssociationName,
              associationSerializer: associatedSerializer,
              forDisplayDepth,
            })
          }

          return {
            ...innerAccumulator,
            ...associatedClass['recursiveSerializationMap'](associatedSerializer, {
              forDisplay,
              forDisplayDepth: forDisplayDepth + 1,
              repeatedAssociationTracker,
            }),
          }
        },
        {} as RecursiveSerializerInfo
      )
      ///////////////////////////////////////////////////////////////////////////////////////////////////////
      // end:reduce over all associated serializers, recursively building out their associated serializers //
      ///////////////////////////////////////////////////////////////////////////////////////////////////////

      accumulator[association.as] = {
        parentDreamClass: this,
        nestedSerializerInfo:
          serializerAssociation.type === 'delegatedAttribute' ? {} : innerAssociationSerializerInfo,
      }

      return accumulator
    }, {} as RecursiveSerializerInfo)

    // reduce the depth as we're coming up so that other branches of the serialization tree don't stop
    // rendering this association on this class
    repeatedAssociationTracker[depthTrackerId]--

    return mappedAssociations
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
    RetType = Set<keyof Table & string>,
  >(this: T): RetType {
    if (this._columns) return this._columns as RetType

    const columns = this.prototype.schema[this.table]?.columns
    this._columns = new Set(columns ? Object.keys(columns) : [])

    return this._columns as RetType
  }
  private static _columns: Set<any>

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
    let defaultParams = this.defaultParamSafeColumns() as ReturnVal
    const userDefinedParams = (this.prototype as any).paramSafeColumns as ReturnVal
    const userDefinedUnsafeParams = (this.prototype as any).paramUnsafeColumns as ReturnVal

    if (Array.isArray(userDefinedUnsafeParams)) {
      defaultParams = defaultParams.filter(
        param => !userDefinedUnsafeParams.includes(param as any)
      ) as ReturnVal
    }

    if (Array.isArray(userDefinedParams)) {
      return userDefinedParams.filter(param => defaultParams.includes(param as any)) as ReturnVal
    }

    return defaultParams
  }

  private static defaultParamSafeColumns<T extends typeof Dream, I extends InstanceType<T>>(
    this: T
  ): DreamParamSafeColumnNames<I>[] {
    const columns: DreamParamSafeColumnNames<I>[] = [...this.columns()].filter(column => {
      if (this.prototype._primaryKey === column) return false
      if (this.prototype._createdAtField === column) return false
      if (this.prototype._updatedAtField === column) return false
      if (this.prototype._deletedAtField === column) return false
      if (this.explicitUnsafeParamColumns.includes(column)) return false
      if (this.isBelongsToAssociationForeignKey(column)) return false
      if (this.isBelongsToAssociationPolymorphicTypeField(column)) return false
      if ((this.isSTIChild || this.isSTIBase) && column === 'type') return false
      return true
    }) as DreamParamSafeColumnNames<I>[]

    return [
      ...new Set([...columns, ...this.virtualAttributes.map(attr => attr.property)]),
    ] as DreamParamSafeColumnNames<I>[]
  }

  /**
   * @internal
   *
   * Returns true if the column is a column in the database
   *
   * @param columnName - the name of the property you are checking for
   * @returns boolean
   */
  public static isColumn<T extends typeof Dream>(this: T, columnName: string): boolean {
    return this.prototype.isColumn(columnName)
  }

  /**
   * @internal
   *
   * Returns true if the column is virtual (set using the Virtual decorator)
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
    return this.associationMetadataMap()[associationStringToNameAndAlias(associationName).name]
  }

  /**
   * @internal
   *
   * Returns an array containing all of the associations for this dream class
   *
   * @returns An array containing all of the associations for this dream class
   */
  private static associationMetadataMap<T extends typeof Dream>(this: T): AssociationMetadataMap {
    const allAssociations = [
      ...this.associationMetadataByType.belongsTo,
      ...this.associationMetadataByType.hasOne,
      ...this.associationMetadataByType.hasMany,
    ]

    const map: AssociationMetadataMap = {}

    for (const association of allAssociations) {
      map[association.as] = association
    }

    return map
  }

  /**
   * Checks whether the specified association has been defined on this Dream model.
   *
   * ```ts
   * const user = User.new()
   *
   * user.hasAssociation('posts')
   * // true (if User has a posts association defined)
   *
   * user.hasAssociation('nonExistentAssociation')
   * // false
   *
   * // Useful for conditional association handling
   * if (user.hasAssociation('posts')) {
   *   user = await user.load('posts').execute()
   * }
   * ```
   *
   * @param associationName - The name of the association to check for
   * @returns `true` if the association exists on this model, `false` otherwise
   */
  public hasAssociation(associationName: string): boolean {
    return !!(
      this.associationMetadataByType.belongsTo.find(association => association.as === associationName) ||
      this.associationMetadataByType.hasOne.find(association => association.as === associationName) ||
      this.associationMetadataByType.hasMany.find(association => association.as === associationName)
    )
  }

  /**
   * Returns all of the association names for this Dream class.
   * This includes all BelongsTo, HasOne, and HasMany associations
   * defined on the model.
   *
   * This is useful for introspection, debugging, or dynamically working
   * with all associations on a model.
   *
   * ```ts
   * class User extends ApplicationModel {
   *   @deco.HasMany('Post')
   *   public posts: Post[]
   *
   *   @deco.HasOne('Profile')
   *   public profile: Profile
   *
   *   @deco.BelongsTo('Company')
   *   public company: Company
   * }
   *
   * User.associationNames
   * // ['posts', 'profile', 'company']
   * })
   * ```
   *
   * @returns An array containing all association names defined on this Dream class
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
   * imports an object from the IOC. This is usually done in rare cases,
   * in order to avoid circular dependencies, since you can always
   * use regular imports to import models or serializers otherwise.
   *
   * @returns the found model or serializer, depending on what you are looking for
   */
  public static lookup<
    T extends typeof Dream,
    LookupName extends GlobalSerializerName<InstanceType<T>> | GlobalModelNames<InstanceType<T>> =
      | GlobalSerializerName<InstanceType<T>>
      | GlobalModelNames<InstanceType<T>>,
  >(this: T, lookupName: LookupName) {
    const dreamApp = DreamApp.getOrFail()
    const models = dreamApp.models
    const serializers = dreamApp.serializers
    return models[lookupName as keyof typeof models] || serializers[lookupName as keyof typeof serializers]
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
   * // [User{id: 1}, User{id: 2}...]
   *
   * // only load specific columns (always includes primary key)
   * await User.all({ columns: ['name'] })
   * // Users will have both 'id' and 'name' properties
   * ```
   *
   * @param options - Query options
   * @param options.columns - Array of column names to select. The primary key is always included automatically. For STI models, the type field is also automatically included.
   * @returns an array of dreams
   */
  public static async all<T extends typeof Dream>(
    this: T,
    options: {
      columns?: DreamColumnNames<InstanceType<T>>[]
    } = {}
  ): Promise<InstanceType<T>[]> {
    return await this.query().all(options)
  }

  /**
   * Paginates the results of your query, accepting a pageSize and page argument,
   * which it uses to segment your query into pages, leveraging limit and offset
   * to deliver your query to you in pages.
   *
   * ```ts
   * const paginated = await User.paginate({ pageSize: 100, page: 2 })
   * paginated.results
   * // [ { User{id: 101}, User{id: 102}, ...}]
   *
   * paginated.recordCount
   * // 350
   *
   * paginated.pageCount
   * // 4
   *
   * paginated.currentPage
   * // 2
   * ```
   *
   * @param opts - Pagination options
   * @param opts.page - the page number that you want to fetch results for
   * @param opts.pageSize - the number of results per page (optional)
   * @returns A paginated result object containing:
   * - `recordCount` - A number representing the total number of records matching your query
   * - `pageCount` - The number of pages needed to encapsulate all the matching records
   * - `currentPage` - The current page (same as what is provided in the paginate args)
   * - `results` - An array of records matching the current record
   */
  public static async paginate<T extends typeof Dream>(
    this: T,
    opts: PaginatedDreamQueryOptions
  ): Promise<PaginatedDreamQueryResult<InstanceType<T>>> {
    return await this.query().paginate(opts)
  }

  /**
   * Fast paginates the results of your query using cursor-based pagination,
   * accepting a pageSize and cursor argument. This method
   * provides better performance for large datasets by using cursor-based
   * pagination instead of offset-based pagination.
   *
   * ```ts
   * // First page (using undefined to start from beginning)
   * const firstPage = await User.scrollPaginate({ pageSize: 100, cursor: undefined })
   * firstPage.results
   * // [ { User{id: 1}, User{id: 2}, ...}]
   *
   * firstPage.cursor
   * // "100" (or null if no more pages)
   *
   * // Next page using cursor from previous result
   * const nextPage = await User.scrollPaginate({
   *   pageSize: 100,
   *   cursor: firstPage.cursor
   * })
   * ```
   *
   * @param opts - Fast pagination options
   * @param opts.pageSize - the number of results per page
   * @param opts.cursor - identifier of where to start the next page; use undefined to start from the beginning
   * @returns A fast pagination result object containing:
   * - `cursor` - identifier for the next page, or null if no more pages
   * - `results` - An array of records for the current page
   */
  public static async scrollPaginate<T extends typeof Dream>(
    this: T,
    opts: ScrollPaginatedDreamQueryOptions
  ): Promise<ScrollPaginatedDreamQueryResult<InstanceType<T>>> {
    return await this.query().scrollPaginate(opts)
  }

  /**
   * Forces use of a database connection (e.g. 'primary') during the query.
   *
   * NOTE: all queries within a transaction always use the 'primary' replica, so
   * explicitly setting connection within a transaction has no effect.
   *
   * @param connection - The connection you wish to access ('primary' or 'replica')
   * @returns A Query with the requested connection
   */
  public static connection<T extends typeof Dream>(
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
   * ```ts
   * const userCount = await User.count()
   * // 42
   * ```
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
   * Persists a new record, setting the provided attributes.
   * Automatically sets createdAt and updatedAt timestamps.
   *
   * ```ts
   * const user = await User.create({ email: 'how@yadoin', password: 'secure123' })
   * // Creates and saves a User with the given attributes
   *
   * await Post.create({ body: 'howdy', user })
   * // Creates a Post with a BelongsTo association to the user
   * ```
   *
   * @param attributes - attributes or belongs to associations you wish to set on this model before persisting
   * @param __namedParameters - optional parameters
   * @param __namedParameters.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @returns A newly persisted dream instance
   */
  public static async create<T extends typeof Dream>(
    this: T,
    attributes?: UpdateablePropertiesForClass<T>,
    { skipHooks }: { skipHooks?: boolean } = {}
  ): Promise<InstanceType<T>> {
    const dreamModel = this.new(attributes)
    await dreamModel.save(skipHooks ? { skipHooks } : undefined)
    return dreamModel
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
   * @param extraOpts - Additional options
   * @param extraOpts.createWith - additional attributes to persist when creating, but not used for finding
   * @returns A dream instance
   */
  public static async createOrFindBy<T extends typeof Dream>(
    this: T,
    attributes: UpdateablePropertiesForClass<T>,
    extraOpts: CreateOrFindByExtraOpts<T> = {}
  ): Promise<InstanceType<T>> {
    try {
      const dreamModel = this.new({
        ...attributes,
        ...extraOpts?.createWith,
      })
      await dreamModel.save()
      return dreamModel
    } catch (err) {
      if (pgErrorType(err) === UNIQUE_VIOLATION) {
        const dreamModel = await this.findBy(this.extractAttributesFromUpdateableProperties(attributes))
        if (!dreamModel) throw new CreateOrFindByFailedToCreateAndFind(this)
        return dreamModel
      }
      throw err
    }
  }

  /**
   * Attempt to update the model with the given attributes.
   * If no record is found, then a new record is created.
   * All lifecycle hooks are run for whichever action is taken.
   *
   * ```ts
   * const user = await User.updateOrCreateBy({ email }, { with: { name: 'Alice' })
   * ```
   *
   * @param attributes - The base attributes for finding which record to update, also used when creating
   * @param extraOpts - Additional options
   * @param extraOpts.with - additional attributes to persist when updating and creating, but not used for finding
   * @param extraOpts.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @returns A dream instance
   */
  public static async updateOrCreateBy<T extends typeof Dream>(
    this: T,
    attributes: UpdateablePropertiesForClass<T>,
    extraOpts: UpdateOrCreateByExtraOpts<T> = {}
  ): Promise<InstanceType<T>> {
    return await updateOrCreateBy(this, null, attributes, extraOpts)
  }

  /**
   * Attempt to create the model with the given attributes.
   * If creation fails due to uniqueness constraint, then find and update
   * the existing model. All lifecycle hooks are run for whichever
   * action is taken.
   *
   * This is useful in situations where we want to avoid
   * a race condition creating duplicate records.
   *
   * IMPORTANT: A unique index/uniqueness constraint must exist on
   * at least one of the provided attributes
   *
   * @param attributes - The base attributes for finding which record to update, also used when creating
   * @param extraOpts - Additional options
   * @param extraOpts.with - additional attributes to persist when updating and creating, but not used for finding
   * @param extraOpts.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @returns A dream instance
   */
  public static async createOrUpdateBy<T extends typeof Dream>(
    this: T,
    attributes: UpdateablePropertiesForClass<T>,
    extraOpts: UpdateOrCreateByExtraOpts<T> = {}
  ): Promise<InstanceType<T>> {
    const { skipHooks } = extraOpts

    try {
      return await this.create(
        {
          ...attributes,
          ...extraOpts?.with,
        },
        skipHooks ? { skipHooks } : undefined
      )
    } catch (err) {
      if (pgErrorType(err) === UNIQUE_VIOLATION) {
        const existingRecord = await this.findBy(this.extractAttributesFromUpdateableProperties(attributes))
        if (!existingRecord) throw new CreateOrUpdateByFailedToCreateAndUpdate(this)
        const { with: attrs } = extraOpts

        if (existingRecord) {
          existingRecord.assignAttributes(attrs ?? {})
          return await saveDream(existingRecord, null, skipHooks ? { skipHooks } : undefined)
        }
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
   * specified primary key. Returns null if not found.
   *
   * ```ts
   * await User.find(123)
   * // User{id: 123}
   *
   * await User.find(null)
   * // null
   *
   * await User.find(undefined)
   * // null
   * ```
   *
   * @param primaryKey - The primaryKey of the record to look up.
   * @returns Either the found record, or else null
   */
  public static async find<T extends typeof Dream, I extends InstanceType<T>>(
    this: T,
    primaryKey: PrimaryKeyForFind<I>
  ): Promise<InstanceType<T> | null> {
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
  public static async findOrFail<T extends typeof Dream, I extends InstanceType<T>>(
    this: T,
    primaryKey: PrimaryKeyForFind<I>
  ): Promise<InstanceType<T>> {
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
   * @param opts - Optional parameters for batch processing
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
   * Returns a new instance of Query scoped to the given
   * model class. Especially useful with {@link Query#toKysely}.
   *
   * ```ts
   *  await Balloon.query().toKysely('update').
   *  .set({
   *    multicolor: sql`array_remove(multicolor, ${colorToRemoveFromAllBalloons})`,
   *  })
   *  .execute()
   * ```
   *
   * @returns A new Query instance scoped to this Dream class
   *
   */
  public static query<T extends typeof Dream, I extends InstanceType<T>>(this: T): Query<I> {
    return new Query(this.prototype as I)
  }

  /**
   * Returns a new instance of Query scoped to the given
   * model class. Especially useful with {@link Query#toKysely}.
   *
   * ```ts
   *  await balloon.query().toKysely('update')
   *  .set({
   *    multicolor: sql`array_append(multicolor, 'red')`,
   *  })
   *  .execute()
   * ```
   *
   * @returns A new Query instance scoped to this Dream class
   *
   */
  public query<I extends Dream>(this: I): Query<I> {
    const dreamClass = this.constructor as DreamConstructorType<I>
    return dreamClass.where({ [this._primaryKey]: this.primaryKeyValue() } as any)[
      /**
       * The Dream may have default scopes that would preclude finding the instance, so the Query
       * that finds the loaded model must be unscoped, but that unscoping should not carry through
       * to other associations (thus the use of `removeAllDefaultScopesExceptOnAssociations`
       * instead of `removeAllDefaultScopes`).
       */
      'removeAllDefaultScopesExceptOnAssociations'
    ]()
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
   * @param extraOpts - Additional options
   * @param extraOpts.createWith - additional attributes to persist when creating, but not used for finding
   * @returns A dream instance
   */
  public static async findOrCreateBy<T extends typeof Dream>(
    this: T,
    attributes: UpdateablePropertiesForClass<T>,
    extraOpts: CreateOrFindByExtraOpts<T> = {}
  ): Promise<InstanceType<T>> {
    return await findOrCreateBy(this, null, attributes, extraOpts)
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
   * Load each specified association using a single SQL query.
   * See {@link Dream.preload} for preloading in separate queries.
   *
   * Note: since leftJoinPreload loads via single query, it has
   * some downsides and that may be avoided using {@link Dream.preload}:
   * 1. `limit` and `offset` will be automatically removed
   * 2. `through` associations will bring additional namespaces into the query that can conflict with through associations from other associations, creating an invalid query
   * 3. each nested association will result in an additional record which duplicates data from the outer record. E.g., given `.leftJoinPreload('a', 'b', 'c')`, if each `a` has 10 `b` and each `b` has 10 `c`, then for one `a`, 100 records will be returned, each of which has all of the columns of `a`. `.preload('a', 'b', 'c')` would perform three separate SQL queries, but the data for a single `a` would only be returned once.
   * 4. the individual query becomes more complex the more associations are included
   * 5. associations loading associations loading associations could result in exponential amounts of data; in those cases, `.preload(...).findEach(...)` avoids instantiating massive amounts of data at once
   *
   * ```ts
   * const user = await User.leftJoinPreload('posts', 'comments', { visibilty: 'public' }, 'replies').first()
   * console.log(user.posts[0].comments[0].replies)
   * // [Reply{id: 1}, Reply{id: 2}]
   * ```
   *
   * @param args - A chain of association names and where clauses
   * @returns A query for this model with the include statement applied
   */
  public static leftJoinPreload<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    TableName extends InstanceType<T>['table'],
    Schema extends I['schema'],
    const Arr extends readonly unknown[],
    const LastArg extends VariadicLeftJoinLoadArgs<DB, Schema, TableName, Arr>,
    const JoinedAssociationsCandidate = JoinedAssociationsTypeFromAssociations<
      DB,
      Schema,
      TableName,
      [...Arr, LastArg]
    >,
    const JoinedAssociations extends
      readonly JoinedAssociation[] = JoinedAssociationsCandidate extends readonly JoinedAssociation[]
      ? JoinedAssociationsCandidate
      : never,
    RetQuery = QueryWithJoinedAssociationsTypeAndNoPreload<Query<I>, JoinedAssociations>,
  >(this: T, ...args: [...Arr, LastArg]): RetQuery {
    return this.query().leftJoinPreload(...(args as any))
  }

  /**
   * Applies preload statement to a Query scoped to this model.
   * Upon instantiating records of this model type,
   * specified associations will be preloaded.
   *
   * Preloading/loading/including is necessary prior to accessing associations
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
   * @param args - A chain of association names and where clauses
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
   * Recursively preloads all Dream associations referenced by `rendersOne` and `rendersMany`
   * in a DreamSerializer. This traverses the entire content tree of serializers to automatically
   * load all necessary associations, eliminating N+1 query problems and removing the need to
   * manually remember which associations to preload for serialization.
   *
   * This method decouples data loading code from data rendering code by having the serializer
   * (rendering code) inform the query (loading code) about which associations are needed.
   * As serializers evolve over time - adding new `rendersOne` and `rendersMany` calls or
   * modifying existing ones - the loading code automatically adapts without requiring
   * corresponding modifications to preload statements.
   *
   * This method analyzes the serializer (specified by `serializerKey` or 'default') and
   * automatically preloads all associations that will be needed during serialization.
   *
   * ```ts
   * // Instead of manually specifying all associations:
   * await User.preload('posts', 'comments', 'replies').all()
   *
   * // Automatically preload everything needed for serialization:
   * await User.preloadFor('summary').all()
   *
   * // Add where conditions to specific associations during preloading:
   * await User.preloadFor('default', (associationName, dreamClass) => {
   *   if (dreamClass.typeof(Post) && associationName === 'comments') {
   *     return { and: { published: true } }
   *   }
   * }).all()
   *
   * // Skip preloading specific associations to handle them manually:
   * await User.preloadFor('summary', (associationName, dreamClass) => {
   *   if (dreamClass.typeof(User) && associationName === 'posts') {
   *     return 'omit' // Handle posts preloading separately with custom logic
   *   }
   * })
   * .preload('posts', { and: { featured: true } }) // Custom preloading
   * .all()
   * ```
   *
   * @param serializerKey - The serializer key to use for determining which associations to preload.
   * @param modifierFn - Optional callback function to modify or omit specific associations during preloading. Called for each association with the Dream class and association name. Return an object with `and`, `andAny`, or `andNot` properties to add where conditions, return 'omit' to skip preloading that association (useful when you want to handle it manually), or return undefined to use default preloading
   * @returns A Query with all serialization associations preloaded
   */
  public static preloadFor<
    T extends typeof Dream,
    I extends InstanceType<T>,
    SerializerKey extends DreamSerializerKey<I>,
  >(this: T, serializerKey: SerializerKey, modifierFn?: LoadForModifierFn) {
    return this.query().preloadFor(serializerKey, modifierFn)
  }

  /**
   * Recursively preloads all Dream associations referenced by `rendersOne` and `rendersMany`
   * in a DreamSerializer using left join preloading. This traverses the entire content tree
   * of serializers to automatically load all necessary associations in a single query,
   * eliminating N+1 query problems and removing the need to manually remember which
   * associations to preload for serialization.
   *
   * This method decouples data loading code from data rendering code by having the serializer
   * (rendering code) inform the query (loading code) about which associations are needed.
   * As serializers evolve over time - adding new `rendersOne` and `rendersMany` calls or
   * modifying existing ones - the loading code automatically adapts without requiring
   * corresponding modifications to left join preload statements.
   *
   * This method analyzes the serializer (specified by `serializerKey` or 'default') and
   * automatically left join preloads all associations that will be needed during serialization.
   *
   * Note: Left join preloading loads all data in a single SQL query but has trade-offs compared
   * to regular preloading. See {@link Dream.leftJoinPreload} for details about limitations.
   *
   * ```ts
   * // Instead of manually specifying all associations:
   * await User.leftJoinPreload('posts', 'comments', 'replies').all()
   *
   * // Automatically left join preload everything needed for serialization:
   * await User.leftJoinPreloadFor('summary').all()
   *
   * // Add where conditions to specific associations during left join preloading:
   * await User.leftJoinPreloadFor('detailed', (associationName, dreamClass) => {
   *   if (dreamClass.typeof(Post) && associationName === 'comments') {
   *     return { and: { published: true } }
   *   }
   * }).all()
   *
   * // Skip left join preloading specific associations to handle them manually:
   * await User.leftJoinPreloadFor('summary', (associationName, dreamClass) => {
   *   if (dreamClass.typeof(User) && associationName === 'posts') {
   *     return 'omit' // Handle posts preloading separately with custom logic
   *   }
   * })
   * .preload('posts', { and: { featured: true } }) // Custom preloading instead
   * .all()
   * ```
   *
   * @param serializerKey - The serializer key to use for determining which associations to preload.
   * @param modifierFn - Optional callback function to modify or omit specific associations during preloading. Called for each association with the Dream class and association name. Return an object with `and`, `andAny`, or `andNot` properties to add where conditions, return 'omit' to skip preloading that association (useful when you want to handle it manually), or return undefined to use default preloading
   * @returns A Query with all serialization associations left join preloaded
   */
  public static leftJoinPreloadFor<
    T extends typeof Dream,
    I extends InstanceType<T>,
    SerializerKey extends DreamSerializerKey<I>,
  >(this: T, serializerKey: SerializerKey, modifierFn?: LoadForModifierFn) {
    return this.query().leftJoinPreloadFor(serializerKey, modifierFn)
  }

  /**
   * Returns a new Query instance with the provided
   * inner join statement attached
   *
   * ```ts
   * await User.innerJoin('posts').first()
   * ```
   *
   * @param args - A chain of association names and where clauses
   * @returns A Query for this model with the inner join clause applied
   */
  public static innerJoin<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    Schema extends I['schema'],
    TableName extends I['table'] & keyof Schema,
    const Arr extends readonly unknown[],
    const LastArg extends VariadicJoinsArgs<DB, Schema, TableName, Arr>,
    const JoinedAssociationsCandidate = JoinedAssociationsTypeFromAssociations<
      DB,
      Schema,
      TableName,
      [...Arr, LastArg]
    >,
    const JoinedAssociations extends
      readonly JoinedAssociation[] = JoinedAssociationsCandidate extends readonly JoinedAssociation[]
      ? JoinedAssociationsCandidate
      : never,
    RetQuery = QueryWithJoinedAssociationsType<Query<I>, JoinedAssociations>,
  >(this: T, ...args: [...Arr, LastArg]): RetQuery {
    return this.query().innerJoin(...(args as any))
  }

  /**
   * Returns a new Query instance with the provided
   * inner join statement attached
   *
   * ```ts
   * await user.innerJoin('posts').first()
   * ```
   *
   * @param args - A chain of association names and where clauses
   * @returns A Query for this model with the inner join clause applied
   */
  public innerJoin<
    I extends Dream,
    DB extends I['DB'],
    Schema extends I['schema'],
    TableName extends I['table'] & keyof Schema,
    const Arr extends readonly unknown[],
    const LastArg extends VariadicJoinsArgs<DB, Schema, TableName, Arr>,
    const JoinedAssociationsCandidate = JoinedAssociationsTypeFromAssociations<
      DB,
      Schema,
      TableName,
      [...Arr, LastArg]
    >,
    const JoinedAssociations extends
      readonly JoinedAssociation[] = JoinedAssociationsCandidate extends readonly JoinedAssociation[]
      ? JoinedAssociationsCandidate
      : never,
    RetQuery = QueryWithJoinedAssociationsType<Query<I>, JoinedAssociations>,
  >(this: I, ...args: [...Arr, LastArg]): RetQuery {
    return this.query().innerJoin(...(args as any))
  }

  /**
   * Returns a new Query instance with the provided
   * left join statement attached
   *
   * ```ts
   * await User.leftJoin('posts').first()
   * ```
   *
   * @param args - A chain of association names and where clauses
   * @returns A Query for this model with the left join clause applied
   */
  public static leftJoin<
    T extends typeof Dream,
    I extends InstanceType<T>,
    DB extends I['DB'],
    Schema extends I['schema'],
    TableName extends I['table'] & keyof Schema,
    const Arr extends readonly unknown[],
    const LastArg extends VariadicJoinsArgs<DB, Schema, TableName, Arr>,
    const JoinedAssociationsCandidate = JoinedAssociationsTypeFromAssociations<
      DB,
      Schema,
      TableName,
      [...Arr, LastArg]
    >,
    const JoinedAssociations extends
      readonly JoinedAssociation[] = JoinedAssociationsCandidate extends readonly JoinedAssociation[]
      ? JoinedAssociationsCandidate
      : never,
    RetQuery = QueryWithJoinedAssociationsType<Query<I>, JoinedAssociations>,
  >(this: T, ...args: [...Arr, LastArg]): RetQuery {
    return this.query().leftJoin(...(args as any))
  }

  /**
   * Returns a new Query instance with the provided
   * left join statement attached
   *
   * ```ts
   * await user.leftJoin('posts').first()
   * ```
   *
   * @param args - A chain of association names and where clauses
   * @returns A Query for this model with the left join clause applied
   */
  public leftJoin<
    I extends Dream,
    DB extends I['DB'],
    Schema extends I['schema'],
    TableName extends I['table'] & keyof Schema,
    const Arr extends readonly unknown[],
    const LastArg extends VariadicJoinsArgs<DB, Schema, TableName, Arr>,
    const JoinedAssociationsCandidate = JoinedAssociationsTypeFromAssociations<
      DB,
      Schema,
      TableName,
      [...Arr, LastArg]
    >,
    const JoinedAssociations extends
      readonly JoinedAssociation[] = JoinedAssociationsCandidate extends readonly JoinedAssociation[]
      ? JoinedAssociationsCandidate
      : never,
    RetQuery = QueryWithJoinedAssociationsType<Query<I>, JoinedAssociations>,
  >(this: I, ...args: [...Arr, LastArg]): RetQuery {
    return this.query().leftJoin(...(args as any))
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
   * @param columnNames - The column or array of columns to pluck
   * @returns An array of pluck results
   */
  public static async pluck<
    T extends typeof Dream,
    I extends InstanceType<T>,
    ColumnNames extends TableColumnNames<I['DB'], I['table']>[],
    ReturnValue extends ColumnNames['length'] extends 1
      ? BaseModelColumnTypes<ColumnNames, I>[0][]
      : BaseModelColumnTypes<ColumnNames, I>[],
  >(this: T, ...columnNames: ColumnNames): Promise<ReturnValue> {
    return (await this.query().pluck(...(columnNames as any[]))) as ReturnValue
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
   * @param args - a list of fields to pluck, followed by a callback function to call for each set of found fields
   * @returns void
   */
  public static async pluckEach<
    T extends typeof Dream,
    I extends InstanceType<T>,
    ColumnNames extends TableColumnNames<I['DB'], I['table']>[],
    CbArgTypes extends BaseModelColumnTypes<ColumnNames, I>,
  >(this: T, ...args: PluckEachArgs<ColumnNames, CbArgTypes>) {
    return await this.query().pluckEach(...(args as any))
  }

  /**
   * Used in conjunction with the Sortable decorator, `resort`
   * takes a list of sortable fields, and for each one, finds and
   * sorts each record in the DB matching the field based on the
   * scope provided for each Sortable decorator found.
   *
   * Calling this method shouldn't be necessary, but if
   * the contents of the database have shifted without firing the
   * correct callback mechanisms at the application layer, calling
   * `resort` will ensure that all sortable fields are set from 1..n
   * with no gaps, accounting for the scopes specified in the
   * corresponding Sortable decorator.
   *
   * ```ts
   * class Post extends ApplicationModel {
   *   @deco.Sortable({ scope: ['user']})
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
   *   @deco.Scope()
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
  public static toKysely<T extends typeof Dream, QueryType extends 'select' | 'delete' | 'update'>(
    this: T,
    type: QueryType
  ) {
    return this.query().toKysely(type)
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
    txn: DreamTransaction<I> | null
  ): DreamClassTransactionBuilder<T, I> {
    return new DreamClassTransactionBuilder<T, I>(this, txn)
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
   * @param callback - A callback function to call. The transaction provided to the callback can be passed to subsequent database calls within the transaction callback
   * @returns void
   */
  public static async transaction<
    T extends typeof Dream,
    CB extends (txn: DreamTransaction<InstanceType<T>>) => unknown,
    RetType extends ReturnType<CB>,
  >(this: T, callback: CB): Promise<RetType> {
    const dbDriverClass = Query.dbDriverClass<InstanceType<T>>(this.prototype.connectionName)
    return (await dbDriverClass.transaction(this.prototype, callback)) as RetType
  }

  /**
   * Sends data through for use as passthrough data
   * for the associations that require it.
   *
   * ```ts
   * class Post {
   *   @deco.HasMany('LocalizedText')
   *   public localizedTexts: LocalizedText[]
   *
   *   @deco.HasOne('LocalizedText', {
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
  >(this: T, passthroughWhereStatement: PassthroughOnClause<PassthroughColumns>): Query<InstanceType<T>> {
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
   * @param statements - a list of where statements to `OR` together
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
   * @param attributes - A where statement to negate and apply to the Query
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
    return this.belongsToAssociationNames().map(belongsToKey => associationMap[belongsToKey]?.foreignKey())
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
      .filter(key => associationMap[key]?.polymorphic)
      .map(belongsToKey => associationMap[belongsToKey]?.foreignKeyTypeField())
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
    return Object.keys(associationMap).filter(key => associationMap[key]?.type === 'BelongsTo')
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
   * Runs validation checks against all validations
   * declared using the Validate and Validates decorators,
   * and returns true if any of them fail.
   *
   * ```ts
   * class User extends ApplicationModel {
   *   @deco.Validates('presence')
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
   * declared using the Validate and Validates decorators.
   * Returns true if none of the validations fail.
   *
   * NOTE: Any validations that fail will leave the errors
   * field populated on your model instance.
   *
   * ```ts
   * class User extends ApplicationModel {
   *   @deco.Validates('presence')
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
    return !Object.keys(this.errors).filter(key => !!this.errors[key]?.length).length
  }

  /**
   * @internal
   *
   * The primary key may be customized on a Dream model:
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
  private get _primaryKey() {
    return (this as any).primaryKey || 'id'
  }

  /**
   * Returns the value of the primary key
   *
   * @returns The value of the primary key field for this Dream instance
   */
  public primaryKeyValue<I extends Dream>(this: I): DreamPrimaryKeyType<I> {
    return (this as any)[this._primaryKey] || null
  }

  /**
   * This must be defined on every model, and it must point
   * to a table in your database. In addition, you must
   * return the value using the `as const` suffix, like so:
   *
   * ```ts
   * class User extends ApplicationModel {
   *   public override get table() {
   *     return 'users' as const
   *   }
   * }
   * ```
   *
   * @returns The table name for this model
   */
  public get table(): AssociationTableNames<any, any> {
    throw new DreamMissingRequiredOverride(this.constructor as typeof Dream, 'table')
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

  private set isPersisted(val: boolean) {
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
    const dreamModel = new this(opts as any, {
      ...additionalOpts,
      _internalUseOnly: true,
    }) as InstanceType<T>

    dreamModel.finalizeConstruction()

    return dreamModel
  }

  /**
   * @internal
   *
   * NOTE: avoid using the constructor function directly.
   * Use the static `.new` or `.create` methods instead, which
   * will provide type guarding for your attributes.
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
    opts: any,
    additionalOpts: {
      bypassUserDefinedSetters?: boolean
      isPersisted?: boolean
      _internalUseOnly: true
    }
  ) {
    if (!additionalOpts._internalUseOnly) throw new ConstructorOnlyForInternalUse()
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

    /**
     *
     * Modern Javascript sets all properties that do not have an explicit
     * assignment within the constructor to undefined in an implicit constructor.
     * Since the Dream constructor sets the value of properties of instances of
     * classes that extend Dream (e.g. when passing attributes to #new or #create
     * or when loading a model via one of the #find methods or #all), we need to
     * prevent those properties from being set back to undefined. Since all
     * properties corresponding to a database column get a setter, we achieve this
     * protection by including a guard in the setters that returns if this
     * property is set.
     *
     */
    this.columnSetterGuardActivated = true
  }

  /**
   * @internal
   *
   * Used for determining which attributes to update
   */
  private static extractAttributesFromUpdateableProperties<T extends typeof Dream>(
    this: T,
    attributes: UpdateablePropertiesForClass<T>,
    dreamInstance?: InstanceType<T>,
    { bypassUserDefinedSetters = false }: { bypassUserDefinedSetters?: boolean } = {}
  ): WhereStatement<InstanceType<T>['DB'], InstanceType<T>['schema'], InstanceType<T>['table']> {
    const returnValues: any = {}

    const setAttributeOnDreamInstance = (attr: any, value: any) => {
      if (!dreamInstance) return value

      if (!dreamInstance.columns().has(attr)) {
        // not a column. set via the setter and return the getter value
        ;(dreamInstance as any)[attr] = value
        return (dreamInstance as any)[attr]
        //
      } else if (bypassUserDefinedSetters && !isJsonColumn(this, attr)) {
        // bypass user defined setters, and this field is not json, so set
        // the attribute directly and return the attribute
        dreamInstance.setAttribute(attr, value)
        return dreamInstance.getAttribute(attr)
      } else {
        // don't bypass user defined setters, or this field is json, so set
        // the attribute directly and return the attribute
        dreamInstance.assignAttribute(attr, value)
        return dreamInstance.getAttribute(attr)
      }
    }

    Object.keys(attributes as any).forEach(attr => {
      const associationMetaData = this.associationMetadataMap()[attr]

      if (associationMetaData && associationMetaData.type !== 'BelongsTo') {
        throw new CanOnlyPassBelongsToModelParam(this, associationMetaData)
      } else if (associationMetaData) {
        const belongsToAssociationMetaData = associationMetaData
        const associatedObject = (attributes as any)[attr] as Dream | null

        // if dream instance is passed, set the loaded association
        if (dreamInstance && associatedObject !== undefined) (dreamInstance as any)[attr] = associatedObject

        if (!associationMetaData.optional && !associatedObject)
          throw new CannotPassNullOrUndefinedToRequiredBelongsTo(this, associationMetaData)

        const foreignKey = belongsToAssociationMetaData.foreignKey()
        const foreignKeyValue = belongsToAssociationMetaData.primaryKeyValue(associatedObject)

        if (foreignKeyValue !== undefined) {
          returnValues[foreignKey] = foreignKeyValue
          setAttributeOnDreamInstance(foreignKey, returnValues[foreignKey])
          // Set the belongs-to association
          setAttributeOnDreamInstance(attr, (attributes as any)[attr])
        }

        if (belongsToAssociationMetaData.polymorphic) {
          const foreignKeyTypeField = belongsToAssociationMetaData.foreignKeyTypeField()
          returnValues[foreignKeyTypeField] = associatedObject?.referenceTypeString
          setAttributeOnDreamInstance(foreignKeyTypeField, returnValues[foreignKeyTypeField])
        }
      } else {
        returnValues[attr] = setAttributeOnDreamInstance(attr, (attributes as any)[attr])
      }
    })

    return returnValues
  }

  /**
   * @internal
   *
   * defines attribute setters and getters for every column
   * set within your types/dream.ts file
   */
  private defineAttributeAccessors() {
    const dreamClass = this.constructor as typeof Dream
    const columns = dreamClass.columns()
    const dreamPrototype = Object.getPrototypeOf(this)

    columns.forEach(column => {
      // this ensures that the currentAttributes object will contain keys
      // for each of the properties
      if (this.getAttribute(column as any) === undefined) this.setAttribute(column as any, undefined)

      if (!Object.getOwnPropertyDescriptor(dreamPrototype, column)?.set) {
        if (isJsonColumn(this.constructor as typeof Dream, column)) {
          // handle JSON columns
          Object.defineProperty(dreamPrototype, column, {
            get() {
              const val = this.getAttribute(column)
              if (val === null) return null
              if (val === undefined) return undefined
              return JSON.parse(val)
            },

            set(val: any) {
              /**
               *
               * Modern Javascript sets all properties that do not have an explicit
               * assignment within the constructor to undefined in an implicit constructor.
               * Since the Dream constructor sets the value of properties of instances of
               * classes that extend Dream (e.g. when passing attributes to #new or #create
               * or when loading a model via one of the #find methods or #all), we need to
               * prevent those properties from being set back to undefined. Since all
               * properties corresponding to a database column get a setter, we achieve this
               * protection by including a guard in the setters that returns if this
               * property is set.
               *
               */
              if (this.columnSetterGuardActivated) return

              this.setAttribute(
                column,
                val === null
                  ? null
                  : val === undefined
                    ? undefined
                    : typeof val === 'string'
                      ? val
                      : JSON.stringify(val)
              )
            },

            configurable: true,
          })
        } else {
          // handle all other columns
          Object.defineProperty(dreamPrototype, column, {
            get() {
              return this.getAttribute(column)
            },

            set(val: any) {
              /**
               *
               * Modern Javascript sets all properties that do not have an explicit
               * assignment within the constructor to undefined in an implicit constructor.
               * Since the Dream constructor sets the value of properties of instances of
               * classes that extend Dream (e.g. when passing attributes to #new or #create
               * or when loading a model via one of the #find methods or #all), we need to
               * prevent those properties from being set back to undefined. Since all
               * properties corresponding to a database column get a setter, we achieve this
               * protection by including a guard in the setters that returns if this
               * property is set.
               *
               */
              if (this.columnSetterGuardActivated) return
              this.setAttribute(column, val)
            },

            configurable: true,
          })
        }
      }
    })

    ensureSTITypeFieldIsSet(this)
  }

  /**
   * @internal
   *
   * Modern Javascript applies implicit accessors to instance properties that
   * shadow prototype accessors applied by Dream. This method is called after
   * every Dream model is initialized to delete the instance accessors so that
   * the prototype accessors can be reached.
   */
  private unshadowColumnPropertyPrototypeAccessors() {
    ;(this.constructor as typeof Dream).columns().forEach(column => delete (this as any)[column])
  }

  private finalizeConstruction() {
    /**
     *
     * Modern Javascript sets all properties that do not have an explicit
     * assignment within the constructor to undefined in an implicit constructor.
     * Since the Dream constructor sets the value of properties of instances of
     * classes that extend Dream (e.g. when passing attributes to #new or #create
     * or when loading a model via one of the #find methods or #all), we need to
     * prevent those properties from being set back to undefined. Since all
     * properties corresponding to a database column get a setter, we achieve this
     * protection by including a guard in the setters that returns if this
     * property is set.
     *
     */
    this.columnSetterGuardActivated = false

    /**
     * Modern Javascript applies implicit accessors to instance properties
     * that don't have an accessor explicitly defined in the class definition.
     * The instance accessors shadow prototype accessors applied by Dream.
     * This method is called after every Dream model is initialized to delete the
     * instance accessors so that the prototype accessors can be reached.
     */
    this.unshadowColumnPropertyPrototypeAccessors()
  }

  /**
   * @internal
   *
   * Returns true if the column is a column in the database
   *
   * @param columnName - the name of the property you are checking for
   * @returns boolean
   */
  public isColumn<T extends Dream>(this: T, columnName: string): boolean {
    return this.columns().has(columnName)
  }

  /**
   * Returns true if the columnName passed is marked by a
   * Virtual attribute decorator
   *
   * @param columnName - A property on this model to check
   * @returns A boolean
   */
  public isVirtualColumn<T extends Dream>(this: T, columnName: string): boolean {
    return !!(this.constructor as typeof Dream).virtualAttributes.find(attr => attr.property === columnName)
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
   *    @deco.Validate()
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
    ;(this as any)[attr] = val
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
    column: Key & string,
    val: any
  ): void {
    ;(this as any).currentAttributes[column] = val
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
    column: Key & string
  ): DreamAttributes<I>[Key] {
    return (this as any).currentAttributes[column]
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
  public getAttributes<I extends Dream, DB extends I['DB']>(this: I): Selectable<DB[I['table']]> {
    return { ...this.currentAttributes } as Selectable<DB[I['table']]>
  }

  /**
   * @internal
   *
   * Returns the db type stored within the database
   */
  private static cachedTypeFor<
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
  >(this: I): Partial<Selectable<Table>> {
    const obj: Partial<Selectable<Table>> = {}

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
        { was: Selectable<Table>[DreamColumnNames<I>]; now: Selectable<Table>[DreamColumnNames<I>] }
      >
    >,
  >(this: I): RetType {
    const obj: RetType = {} as RetType

    ;(this.constructor as typeof Dream).columns().forEach(column => {
      const was = this.previousValueForAttribute(column as any)
      const now = this.getAttribute(column as any)
      if (notEqual(was, now)) (obj as any)[column] = { was, now }
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
   * @param columnName - The column name you want the previous value for
   * @returns Returns the previous value for an attribute
   */
  public previousValueForAttribute<
    I extends Dream,
    DB extends I['DB'],
    TableName extends I['table'],
    Table extends DB[TableName],
    ColumnName extends DreamColumnNames<I>,
  >(this: I, columnName: ColumnName): Selectable<Table>[ColumnName] {
    if (notEqual(this.frozenAttributes[columnName], this.getAttribute(columnName as any)))
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
    const was = (changes as any)?.[columnName]?.was
    const now = (changes as any)?.[columnName]?.now
    return this.isPersisted && notEqual(now, was)
  }

  /**
   * Returns true if the columnName provided has
   * changes that have not yet been persisted.
   *
   * @param attribute - the column name to check
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
  >(this: I): Partial<Selectable<Table>> {
    const obj: Partial<Selectable<Table>> = {}

    this.columns().forEach(column => {
      // TODO: clean up types
      if (this.attributeIsDirty(column as any)) (obj as any)[column] = this.getAttribute(column as any)
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
    const currentValue = this.getAttribute(attribute)

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
    if (typeof currentValue === 'string') currentValue = DateTime.fromISO(currentValue)
    if (currentValue instanceof CalendarDate) currentValue = currentValue.toDateTime()
    if (currentValue instanceof DateTime) return currentValue.toMillis()
  }

  /**
   * @internal
   */
  private unknownValueToDateString(currentValue: any): string | undefined {
    if (!currentValue) return
    if (typeof currentValue === 'string') currentValue = CalendarDate.fromISO(currentValue)
    if (currentValue instanceof DateTime) currentValue = CalendarDate.fromDateTime(currentValue)
    if (currentValue instanceof CalendarDate) return currentValue.toISO()
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
   * @param options - Options for destroying the instance
   * @param options.skipHooks - If true, skips applying model hooks during the destroy operation. Defaults to false
   * @param options.cascade - If false, skips destroying associations marked `dependent: 'destroy'`. Defaults to true
   * @param options.bypassAllDefaultScopes - If true, bypasses all default scopes when cascade destroying. Defaults to false
   * @param options.defaultScopesToBypass - An array of default scope names to bypass when cascade destroying. Defaults to an empty array
   * @returns The instance that was destroyed
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
   * a SoftDelete decorator, the soft delete
   * will be bypassed, causing the record
   * to be permanently removed from the database.
   *
   * ```ts
   * const user = await User.last()
   * await user.reallyDestroy()
   * ```
   *
   * @param options - Options for destroying the instance
   * @param options.skipHooks - If true, skips applying model hooks during the destroy operation. Defaults to false
   * @param options.cascade - If false, skips destroying associations marked `dependent: 'destroy'`. Defaults to true
   * @param options.bypassAllDefaultScopes - If true, bypasses all default scopes when cascade destroying. Defaults to false
   * @param options.defaultScopesToBypass - An array of default scope names to bypass when cascade destroying. Defaults to an empty array
   * @returns The instance that was destroyed
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
   * ```
   *
   * @param options - Options for undestroying the instance
   * @param options.skipHooks - If true, skips applying model hooks during the undestroy operation. Defaults to false
   * @param options.cascade - If false, skips undestroying associations marked `dependent: 'destroy'`. Defaults to true
   * @param options.bypassAllDefaultScopes - If true, bypasses all default scopes when cascade undestroying. Defaults to false
   * @param options.defaultScopesToBypass - An array of default scope names to bypass when cascade undestroying (soft delete is always bypassed). Defaults to an empty array
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
    return (
      !!(other instanceof Dream) &&
      this.isPersisted &&
      other.isPersisted &&
      this.comparisonKey === other.comparisonKey
    )
  }

  public get comparisonKey(): string {
    return `${(this.constructor as typeof Dream).globalName}:${this.primaryKeyValue()}`
  }

  /**
   * @internal
   *
   * Used for changes API
   */
  private freezeAttributes() {
    this.frozenAttributes = { ...this.getAttributes() }
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
    ;(clone as any)[clone._primaryKey] = undefined
    ;(clone as any)[clone._createdAtField] = undefined
    ;(clone as any)[clone._updatedAtField] = undefined

    const dreamClass = this.constructor as typeof Dream
    dreamClass.sortableFields.forEach(data => {
      ;(clone as any)[data.positionField] = undefined
    })

    clone.freezeAttributes()
    clone.originalAttributes = { ...clone.getAttributes() }
    clone.attributesFromBeforeLastSave = { ...clone.getAttributes() }

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
    const clone: any = (self.constructor as typeof Dream).new({})

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
    AssociationName extends DreamAssociationNames<I>,
    PossibleArrayAssociationType extends I[AssociationName & keyof I],
    AssociationType extends PossibleArrayAssociationType extends (infer ElementType)[]
      ? ElementType
      : PossibleArrayAssociationType,
    RestrictedAssociationType extends AssociationType extends Dream ? AssociationType : never,
  >(
    this: I,
    associationName: AssociationName,
    attributes: UpdateableAssociationProperties<I, RestrictedAssociationType> = {} as any
  ): Promise<NonNullable<AssociationType>> {
    if (this.isNewRecord) throw new CannotCreateAssociationOnUnpersistedDream(this, associationName)

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
    AssociationName extends DreamAssociationNamesWithRequiredOnClauses<I>,
    RequiredOnClauseKeysForThisAssociation extends RequiredOnClauseKeys<Schema, TableName, AssociationName>,
    AssociationDream extends AssociationNameToDream<I, AssociationName>,
    AssociationTableName extends AssociationDream['table'],
  >(
    this: I,
    associationName: AssociationName,
    options: DestroyOptions<I> &
      JoinAndStatements<DB, Schema, AssociationTableName, RequiredOnClauseKeysForThisAssociation>
  ): Promise<number>

  public async destroyAssociation<
    I extends Dream,
    DB extends I['DB'],
    Schema extends I['schema'],
    AssociationName extends DreamAssociationNamesWithoutRequiredOnClauses<I>,
    AssociationDream extends AssociationNameToDream<I, AssociationName>,
    AssociationTableName extends AssociationDream['table'],
  >(
    this: I,
    associationName: AssociationName,
    options?: DestroyOptions<I> & JoinAndStatements<DB, Schema, AssociationTableName, null>
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
   * @param options - Options for destroying the association
   * @param options.and - Optional and statement to apply to query before destroying
   * @param options.andNot - Optional andNot statement to apply to query before destroying
   * @param options.andAny - Optional andAny statement to apply to query before destroying
   * @param options.skipHooks - If true, skips applying model hooks during the destroy operation. Defaults to false
   * @param options.cascade - If false, skips destroying associations marked `dependent: 'destroy'`. Defaults to true
   * @param options.bypassAllDefaultScopes - If true, bypasses all default scopes when destroying the association. Defaults to false
   * @param options.defaultScopesToBypass - An array of default scope names to bypass when destroying the association. Defaults to an empty array
   * @returns The number of records deleted
   */
  public async destroyAssociation<I extends Dream, AssociationName extends DreamAssociationNames<I>>(
    this: I,
    associationName: AssociationName,
    options?: unknown
  ): Promise<number> {
    if (this.isNewRecord) throw new CannotDestroyAssociationOnUnpersistedDream(this, associationName)

    return await destroyAssociation(this, null, associationName, {
      ...destroyOptions<I>(options as any),
      joinAndStatements: {
        and: (options as any)?.and,
        andNot: (options as any)?.andNot,
        andAny: (options as any)?.andAny,
      },
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
    AssociationName extends DreamAssociationNamesWithRequiredOnClauses<I>,
    RequiredOnClauseKeysForThisAssociation extends RequiredOnClauseKeys<Schema, TableName, AssociationName>,
    AssociationDream extends AssociationNameToDream<I, AssociationName>,
    AssociationTableName extends AssociationDream['table'],
  >(
    this: I,
    associationName: AssociationName,
    options: DestroyOptions<I> &
      JoinAndStatements<DB, Schema, AssociationTableName, RequiredOnClauseKeysForThisAssociation>
  ): Promise<number>

  public async reallyDestroyAssociation<
    I extends Dream,
    DB extends I['DB'],
    Schema extends I['schema'],
    AssociationName extends DreamAssociationNamesWithoutRequiredOnClauses<I>,
    AssociationDream extends AssociationNameToDream<I, AssociationName>,
    AssociationTableName extends AssociationDream['table'],
  >(
    this: I,
    associationName: AssociationName,
    options?: DestroyOptions<I> & JoinAndStatements<DB, Schema, AssociationTableName, null>
  ): Promise<number>

  /**
   * Destroys models associated with the current instance,
   * deleting their corresponding records within the database.
   *
   * If the record, or else any of its associations
   * which are marked cascade: "destroy", are using
   * the SoftDelete decorator, it will be bypassed,
   * causing those records to be deleted from the database.
   *
   * ```ts
   * await user.reallyDestroyAssociation('posts', { body: 'hello world' })
   * ```
   *
   * @param associationName - The name of the association to destroy
   * @param options - Options for destroying the association
   * @param options.and - Optional and statement to apply to query before destroying
   * @param options.andNot - Optional andNot statement to apply to query before destroying
   * @param options.andAny - Optional andAny statement to apply to query before destroying
   * @param options.skipHooks - If true, skips applying model hooks during the destroy operation. Defaults to false
   * @param options.cascade - If true, cascades the destroy operation to associations marked with `dependent: 'destroy'`. Defaults to true
   * @param options.bypassAllDefaultScopes - If true, bypasses all default scopes when destroying the association. Defaults to false
   * @param options.defaultScopesToBypass - An array of default scope names to bypass when destroying the association. Defaults to an empty array
   * @returns The number of records deleted
   */
  public async reallyDestroyAssociation<I extends Dream, AssociationName extends DreamAssociationNames<I>>(
    this: I,
    associationName: AssociationName,
    options?: unknown
  ): Promise<number> {
    if (this.isNewRecord) throw new CannotDestroyAssociationOnUnpersistedDream(this, associationName)

    return await destroyAssociation(this, null, associationName, {
      ...reallyDestroyOptions<I>(options as any),
      joinAndStatements: {
        and: (options as any)?.and,
        andNot: (options as any)?.andNot,
        andAny: (options as any)?.andAny,
      },
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
    AssociationName extends DreamAssociationNamesWithRequiredOnClauses<I>,
    RequiredOnClauseKeysForThisAssociation extends RequiredOnClauseKeys<Schema, TableName, AssociationName>,
    AssociationDream extends AssociationNameToDream<I, AssociationName>,
    AssociationTableName extends AssociationDream['table'],
  >(
    this: I,
    associationName: AssociationName,
    options: DestroyOptions<I> &
      JoinAndStatements<DB, Schema, AssociationTableName, RequiredOnClauseKeysForThisAssociation>
  ): Promise<number>

  public async undestroyAssociation<
    I extends Dream,
    DB extends I['DB'],
    Schema extends I['schema'],
    AssociationName extends DreamAssociationNamesWithoutRequiredOnClauses<I>,
    AssociationDream extends AssociationNameToDream<I, AssociationName>,
    AssociationTableName extends AssociationDream['table'],
  >(
    this: I,
    associationName: AssociationName,
    options?: DestroyOptions<I> & JoinAndStatements<DB, Schema, AssociationTableName, null>
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
   * @param associationName - The name of the association to undestroy
   * @param options - Options for undestroying the association
   * @param options.and - Optional and statement to apply to query before undestroying
   * @param options.andNot - Optional andNot statement to apply to query before undestroying
   * @param options.andAny - Optional andAny statement to apply to query before undestroying
   * @param options.skipHooks - If true, skips applying model hooks during the undestroy operation. Defaults to false
   * @param options.cascade - If false, skips undestroying associations marked `dependent: 'destroy'`. Defaults to true
   * @param options.bypassAllDefaultScopes - If true, bypasses all default scopes when undestroying the association. Defaults to false
   * @param options.defaultScopesToBypass - An array of default scope names to bypass when undestroying the association. Defaults to an empty array
   * @returns The number of records undestroyed
   */
  public async undestroyAssociation<I extends Dream, AssociationName extends DreamAssociationNames<I>>(
    this: I,
    associationName: AssociationName,
    options?: unknown
  ): Promise<number> {
    return await undestroyAssociation(this, null, associationName, {
      ...undestroyOptions<I>(options as any),
      joinAndStatements: {
        and: (options as any)?.and,
        andNot: (options as any)?.andNot,
        andAny: (options as any)?.andAny,
      },
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
    AssociationName extends DreamAssociationNamesWithRequiredOnClauses<I>,
    RequiredOnClauseKeysForThisAssociation extends RequiredOnClauseKeys<Schema, TableName, AssociationName>,
    AssociationDream extends AssociationNameToDream<I, AssociationName>,
    AssociationTableName extends AssociationDream['table'],
  >(
    this: I,
    associationName: AssociationName,
    joinAndStatements: JoinAndStatements<
      DB,
      Schema,
      AssociationTableName,
      RequiredOnClauseKeysForThisAssociation
    >
  ): Query<AssociationDream, DefaultQueryTypeOptions<AssociationDream, AssociationName & string>>

  public associationQuery<
    I extends Dream,
    DB extends I['DB'],
    Schema extends I['schema'],
    AssociationName extends DreamAssociationNamesWithoutRequiredOnClauses<I>,
    AssociationDream extends AssociationNameToDream<I, AssociationName>,
    AssociationTableName extends AssociationDream['table'],
  >(
    this: I,
    associationName: AssociationName,
    joinAndStatements?: JoinAndStatements<DB, Schema, AssociationTableName, null>
  ): Query<AssociationDream, DefaultQueryTypeOptions<AssociationDream, AssociationName & string>>

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
  public associationQuery<I extends Dream, AssociationName extends DreamAssociationNames<I>>(
    this: I,
    associationName: AssociationName,
    joinAndStatements?: unknown
  ): unknown {
    if (this.isNewRecord) throw new CannotAssociationQueryOnUnpersistedDream(this, associationName)

    return associationQuery(this, null, associationName, {
      joinAndStatements: joinAndStatements as any,
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
    AssociationName extends DreamAssociationNamesWithRequiredOnClauses<I>,
    RequiredOnClauseKeysForThisAssociation extends RequiredOnClauseKeys<Schema, TableName, AssociationName>,
    AssociationDream extends AssociationNameToDream<I, AssociationName>,
    AssociationTableName extends AssociationDream['table'],
    //
    PossibleArrayAssociationType extends I[AssociationName & keyof I],
    AssociationType extends PossibleArrayAssociationType extends (infer ElementType)[]
      ? ElementType
      : PossibleArrayAssociationType,
    RestrictedAssociationType extends AssociationType extends Dream ? AssociationType : never,
  >(
    this: I,
    associationName: AssociationName,

    attributes: UpdateableAssociationProperties<I, RestrictedAssociationType>,
    updateAssociationOptions: {
      bypassAllDefaultScopes?: boolean
      defaultScopesToBypass?: AllDefaultScopeNames<I>[]
      skipHooks?: boolean
    } & JoinAndStatements<DB, Schema, AssociationTableName, RequiredOnClauseKeysForThisAssociation>
  ): Promise<number>

  public async updateAssociation<
    I extends Dream,
    DB extends I['DB'],
    Schema extends I['schema'],
    AssociationName extends DreamAssociationNamesWithoutRequiredOnClauses<I>,
    AssociationDream extends AssociationNameToDream<I, AssociationName>,
    AssociationTableName extends AssociationDream['table'],
    //
    PossibleArrayAssociationType extends I[AssociationName & keyof I],
    AssociationType extends PossibleArrayAssociationType extends (infer ElementType)[]
      ? ElementType
      : PossibleArrayAssociationType,
    RestrictedAssociationType extends AssociationType extends Dream ? AssociationType : never,
  >(
    this: I,
    associationName: AssociationName,
    attributes: UpdateableAssociationProperties<I, RestrictedAssociationType>,
    updateAssociationOptions?: {
      bypassAllDefaultScopes?: boolean
      defaultScopesToBypass?: AllDefaultScopeNames<I>[]
      skipHooks?: boolean
    } & JoinAndStatements<DB, Schema, AssociationTableName, null>
  ): Promise<number>

  /**
   * Updates all records matching the association with
   * the provided attributes. If a where statement is passed,
   * The on statement will be applied to the query
   * before updating.
   *
   * ```ts
   * await user.createAssociation('posts', { body: 'hello world' })
   * await user.createAssociation('posts', { body: 'howyadoin' })
   * await user.updateAssociation('posts', { body: 'goodbye world' }, { and: { body: 'hello world' }})
   * // 1
   * ```
   *
   * @param associationName - The name of the association to update
   * @param attributes - The attributes to update on the association
   * @param options - Options for updating the association
   * @param options.and - Optional on statement to apply to query before updating
   * @param options.skipHooks - If true, skips applying model hooks during the update operation. Defaults to false
   * @param options.bypassAllDefaultScopes - If true, bypasses all default scopes when updating the association. Defaults to false
   * @param options.defaultScopesToBypass - An array of default scope names to bypass when updating the association. Defaults to an empty array
   * @returns The number of updated records
   */
  public async updateAssociation<I extends Dream, AssociationName extends DreamAssociationNames<I>>(
    this: I,
    associationName: AssociationName,
    attributes: unknown,
    updateAssociationOptions?: unknown
  ): Promise<number> {
    if (this.isNewRecord) throw new CannotUpdateAssociationOnUnpersistedDream(this, associationName)

    return associationUpdateQuery(this, null, associationName, {
      joinAndStatements: {
        and: (updateAssociationOptions as any)?.and,
        andNot: (updateAssociationOptions as any)?.andNot,
        andAny: (updateAssociationOptions as any)?.andAny,
      },

      bypassAllDefaultScopes:
        (updateAssociationOptions as any)?.bypassAllDefaultScopes ?? DEFAULT_BYPASS_ALL_DEFAULT_SCOPES,
      defaultScopesToBypass:
        (updateAssociationOptions as any)?.defaultScopesToBypass ?? DEFAULT_DEFAULT_SCOPES_TO_BYPASS,
    }).update(attributes as any, {
      skipHooks: (updateAssociationOptions as any)?.skipHooks ?? DEFAULT_SKIP_HOOKS,
    })
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
   *   @deco.HasMany('LocalizedText')
   *   public localizedTexts: LocalizedText[]
   *
   *   @deco.HasOne('LocalizedText', {
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
    passthroughWhereStatement: PassthroughOnClause<PassthroughColumns>
  ): LoadBuilder<I> {
    return new LoadBuilder<I>(this).passthrough(passthroughWhereStatement)
  }

  /**
   * Loads the requested associations upon execution
   *
   * NOTE: {@link Dream.preload} is often a preferrable way of achieving the
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

  ///////////////////
  // association
  ///////////////////
  /**
   * If the association is already loaded on the instance, it returns the loaded value
   * immediately without making a database query. If the association is not loaded,
   * it performs a database query to fetch the association.
   *
   * If a query is performed, the association is set on the model so that future calls to
   * access this association can access the already loaded value.
   *
   * For HasMany associations, returns an array (empty if no records). For BelongsTo/HasOne
   * associations, returns the associated model or null if not found.
   *
   * ```ts
   * // Basic association loading
   * const user = await post.association('user')
   * const comments = await post.association('comments')
   *
   * // With required clause (for associations with DreamConst.required `and` clauses)
   * const pets = await user.association('petsWithRequiredName', {
   *   required: { name: 'Woodstock' }
   * })
   *
   * // With passthrough clause (for associations with DreamConst.passthrough `and` clauses)
   * const pets = await user.association('petsWithPassthroughName', {
   *   passthrough: { name: 'Woodstock' }
   * })
   *
   * // With both required and passthrough clauses (for associations with DreamConst.required and DreamConst.passthrough `and` clauses)
   * const text = await composition.association('passthroughAndRequiredCurrentLocalizedText', {
   *   passthrough: { name: 'My Composition' },
   *   required: { locale: 'de-DE' }
   * })
   * ```
   *
   * @param associationName - The name of the BelongsTo, HasOne, or HasMany association
   * @param options - Optional configuration for required and passthrough clauses
   * @param options.required - for associations with DreamConst.required `and` clauses
   * @param options.passthrough - for associations with DreamConst.passthrough `and` clauses
   * @returns The associated model instance(s) or null/empty array if not found
   */
  public async association<
    I extends Dream,
    MaybeAssociationName extends
      | DreamBelongsToAssociationNames<I>
      | DreamHasOneAssociationNames<I>
      | DreamHasManyAssociationNames<I>,
    AssociationName extends MaybeAssociationName extends
      | DreamAssociationNamesWithPassthroughOnClauses<I>
      | DreamAssociationNamesWithRequiredOnClauses<I>
      ? MaybeAssociationName
      : never,
    //
    AssociationDream extends AssociationNameToDream<I, AssociationName>,
    AssociationTableName extends AssociationDream['table'],
    //

    DB extends I['DB'],
    TableName extends I['table'],
    Schema extends I['schema'],
    PassthroughOnStatement extends Required<
      OnStatementForSpecificColumns<
        DB,
        Schema,
        AssociationTableName,
        PassthroughOnClauseKeys<Schema, TableName, AssociationName> & string[]
      >
    >,
    RequiredOnStatement extends Required<
      OnStatementForSpecificColumns<
        DB,
        Schema,
        AssociationTableName,
        RequiredOnClauseKeys<Schema, TableName, AssociationName> & string[]
      >
    >,
    Opts extends AssociationName extends DreamAssociationNamesWithPassthroughOnClauses<I> &
      DreamAssociationNamesWithRequiredOnClauses<I>
      ? {
          passthrough: PassthroughOnStatement
          required: RequiredOnStatement
        }
      : AssociationName extends DreamAssociationNamesWithPassthroughOnClauses<I>
        ? {
            passthrough: PassthroughOnStatement
          }
        : AssociationName extends DreamAssociationNamesWithRequiredOnClauses<I>
          ? {
              required: RequiredOnStatement
            }
          : never,
    ReturnType extends AssociationName extends DreamHasManyAssociationNames<I>
      ? AssociationNameToDream<I, AssociationName>[]
      : AssociationNameToDream<I, AssociationName> | null,
  >(this: I, associationName: AssociationName, options: Opts): Promise<ReturnType>

  public async association<
    I extends Dream,
    MaybeAssociationName extends
      | DreamBelongsToAssociationNames<I>
      | DreamHasOneAssociationNames<I>
      | DreamHasManyAssociationNames<I>,
    AssociationName extends MaybeAssociationName extends
      | DreamAssociationNamesWithPassthroughOnClauses<I>
      | DreamAssociationNamesWithRequiredOnClauses<I>
      ? never
      : MaybeAssociationName,
    ReturnType extends AssociationName extends DreamHasManyAssociationNames<I>
      ? AssociationNameToDream<I, AssociationName>[]
      : AssociationNameToDream<I, AssociationName> | null,
  >(this: I, associationName: AssociationName): Promise<ReturnType>

  public async association<
    I extends Dream,
    AssociationName extends
      | DreamBelongsToAssociationNames<I>
      | DreamHasOneAssociationNames<I>
      | DreamHasManyAssociationNames<I>,
    ReturnType extends AssociationName extends DreamHasManyAssociationNames<I>
      ? AssociationNameToDream<I, AssociationName>[]
      : AssociationNameToDream<I, AssociationName> | null,
  >(
    this: I,
    associationName: AssociationName,
    options?: { passthrough?: Record<string, string>; required?: Record<string, string> }
  ): Promise<ReturnType> {
    return await loadedOrLoadAssociation(this, this, associationName, options)
  }
  ///////////////////
  // end:association
  ///////////////////

  ///////////////////
  // end:associationOrFail
  ///////////////////
  /**
   * If the association is already loaded on the instance, it returns the loaded value
   * immediately without making a database query. If the association is not loaded,
   * it performs a database query to fetch the association.
   *
   * Unlike `association`, this method throws an exception if no associated
   * record is found for BelongsTo/HasOne associations, guaranteeing a non-null result.
   * For HasMany associations, returns an empty array instead of throwing when no records exist.
   *
   * If a query is performed, the association is set on the model so that future calls to
   * access this association can access the already loaded value.
   *
   * For HasMany associations, returns an array (empty if no records). For BelongsTo/HasOne
   * associations, returns the associated model or throws RecordNotFound if not found.
   *
   * ```ts
   * // Basic association loading - throws RecordNotFound if user doesn't exist
   * const user = await post.associationOrFail('user')
   *
   * // HasMany - returns empty array if no comments, never throws
   * const comments = await post.associationOrFail('comments')
   *
   * // With required clause (for associations with DreamConst.required `and` clauses)
   * const pets = await user.associationOrFail('petsWithRequiredName', {
   *   required: { name: 'Woodstock' }
   * })
   *
   * // With passthrough clause (for associations with DreamConst.passthrough `and` clauses)
   * const pets = await user.associationOrFail('petsWithPassthroughName', {
   *   passthrough: { name: 'Woodstock' }
   * })
   *
   * // With both required and passthrough clauses (for associations with DreamConst.required and DreamConst.passthrough `and` clauses)
   * const text = await composition.associationOrFail('passthroughAndRequiredCurrentLocalizedText', {
   *   passthrough: { name: 'My Composition' },
   *   required: { locale: 'de-DE' }
   * })
   * ```
   *
   * @param associationName - The name of the BelongsTo, HasOne, or HasMany association
   * @param options - Optional configuration for required and passthrough clauses
   * @param options.required - for associations with DreamConst.required `and` clauses
   * @param options.passthrough - for associations with DreamConst.passthrough `and` clauses
   * @returns The associated model instance(s) (never null for BelongsTo/HasOne)
   * @throws RecordNotFound if no associated record exists (BelongsTo/HasOne only)
   */
  public async associationOrFail<
    I extends Dream,
    MaybeAssociationName extends
      | DreamBelongsToAssociationNames<I>
      | DreamHasOneAssociationNames<I>
      | DreamHasManyAssociationNames<I>,
    AssociationName extends MaybeAssociationName extends
      | DreamAssociationNamesWithPassthroughOnClauses<I>
      | DreamAssociationNamesWithRequiredOnClauses<I>
      ? MaybeAssociationName
      : never,
    //
    AssociationDream extends AssociationNameToDream<I, AssociationName>,
    AssociationTableName extends AssociationDream['table'],
    //

    DB extends I['DB'],
    TableName extends I['table'],
    Schema extends I['schema'],
    PassthroughOnStatement extends Required<
      OnStatementForSpecificColumns<
        DB,
        Schema,
        AssociationTableName,
        PassthroughOnClauseKeys<Schema, TableName, AssociationName> & string[]
      >
    >,
    RequiredOnStatement extends Required<
      OnStatementForSpecificColumns<
        DB,
        Schema,
        AssociationTableName,
        RequiredOnClauseKeys<Schema, TableName, AssociationName> & string[]
      >
    >,
    Opts extends AssociationName extends DreamAssociationNamesWithPassthroughOnClauses<I> &
      DreamAssociationNamesWithRequiredOnClauses<I>
      ? {
          passthrough: PassthroughOnStatement
          required: RequiredOnStatement
        }
      : AssociationName extends DreamAssociationNamesWithPassthroughOnClauses<I>
        ? {
            passthrough: PassthroughOnStatement
          }
        : AssociationName extends DreamAssociationNamesWithRequiredOnClauses<I>
          ? {
              required: RequiredOnStatement
            }
          : never,
    ReturnType extends AssociationName extends DreamHasManyAssociationNames<I>
      ? AssociationNameToDream<I, AssociationName>[]
      : AssociationNameToDream<I, AssociationName>,
  >(this: I, associationName: AssociationName, options: Opts): Promise<ReturnType>

  public async associationOrFail<
    I extends Dream,
    MaybeAssociationName extends
      | DreamBelongsToAssociationNames<I>
      | DreamHasOneAssociationNames<I>
      | DreamHasManyAssociationNames<I>,
    AssociationName extends MaybeAssociationName extends
      | DreamAssociationNamesWithPassthroughOnClauses<I>
      | DreamAssociationNamesWithRequiredOnClauses<I>
      ? never
      : MaybeAssociationName,
    ReturnType extends AssociationName extends DreamHasManyAssociationNames<I>
      ? AssociationNameToDream<I, AssociationName>[]
      : AssociationNameToDream<I, AssociationName>,
  >(this: I, associationName: AssociationName): Promise<ReturnType>

  public async associationOrFail<
    I extends Dream,
    AssociationName extends
      | DreamBelongsToAssociationNames<I>
      | DreamHasOneAssociationNames<I>
      | DreamHasManyAssociationNames<I>,
    ReturnType extends AssociationName extends DreamHasManyAssociationNames<I>
      ? AssociationNameToDream<I, AssociationName>[]
      : AssociationNameToDream<I, AssociationName>,
  >(
    this: I,
    associationName: AssociationName,
    options?: { passthrough?: Record<string, string>; required?: Record<string, string> }
  ): Promise<ReturnType> {
    const response = await this.association(associationName as any, options as any)

    if (this[associationName] === null) throw new RecordNotFound(this['sanitizedConstructorName'])

    return response as ReturnType
  }
  ///////////////////
  // end:associationOrFail
  ///////////////////

  /**
   * Recursively loads all Dream associations referenced by `rendersOne` and `rendersMany`
   * in a DreamSerializer. This traverses the entire content tree of serializers to automatically
   * load all necessary associations, eliminating N+1 query problems and removing the need to
   * manually remember which associations to preload for serialization.
   *
   * This method decouples data loading code from data rendering code by having the serializer
   * (rendering code) inform the query (loading code) about which associations are needed.
   * As serializers evolve over time - adding new `rendersOne` and `rendersMany` calls or
   * modifying existing ones - the loading code automatically adapts without requiring
   * corresponding modifications to preload statements.
   *
   * This method analyzes the serializer (specified by `serializerKey` or 'default') and
   * automatically preloads all associations that will be needed during serialization.
   *
   * ```ts
   * // Instead of manually specifying all associations:
   * await User.preload('posts', 'comments', 'replies').all()
   *
   * // Automatically preload everything needed for serialization:
   * await user.loadFor('summary').execute()
   *
   * // Add where conditions to specific associations during preloading:
   * await user.loadFor('detailed', (associationName, dreamClass) => {
   *   if (dreamClass.typeof(Post) && associationName === 'comments') {
   *     return { and: { published: true } }
   *   }
   * })
   *    .execute()
   *
   * // Skip preloading specific associations to handle them manually:
   * await user
   *   .loadFor('summary', (associationName, dreamClass) => {
   *     if (dreamClass.typeof(User) && associationName === 'posts') {
   *       return 'omit' // Handle posts preloading separately with custom logic
   *     }
   *   })
   *     .load('posts', { and: { featured: true } }) // Custom preloading
   *     .execute()
   * ```
   *
   * @param serializerKey - The serializer key to use for determining which associations to preload.
   * @param modifierFn - Optional callback function to modify or omit specific associations during preloading. Called for each association with the Dream class and association name. Return an object with `and`, `andAny`, or `andNot` properties to add where conditions, return 'omit' to skip preloading that association (useful when you want to handle it manually), or return undefined to use default preloading
   * @returns A Query with all serialization associations preloaded
   */
  public loadFor<I extends Dream, SerializerKey extends DreamSerializerKey<I>>(
    this: I,
    serializerKey: SerializerKey,
    modifierFn?: LoadForModifierFn
  ) {
    return new LoadBuilder<I>(this)['loadFor'](serializerKey, modifierFn)
  }

  /**
   * Load each specified association using a single SQL query.
   * See {@link Dream.load} for loading in separate queries.
   *
   * Note: since leftJoinLoad loads via single query, it has
   * some downsides and that may be avoided using {@link Dream.load}:
   * 1. `limit` and `offset` will be automatically removed
   * 2. `through` associations will bring additional namespaces into the query that can conflict with through associations from other associations, creating an invalid query
   * 3. each nested association will result in an additional record which duplicates data from the outer record. E.g., given `.leftJoinLoad('a', 'b', 'c')`, if each `a` has 10 `b` and each `b` has 10 `c`, then for one `a`, 100 records will be returned, each of which has all of the columns of `a`. `.load('a', 'b', 'c')` would perform three separate SQL queries, but the data for a single `a` would only be returned once.
   * 4. the individual query becomes more complex the more associations are included
   * 5. associations loading associations loading associations could result in exponential amounts of data; in those cases, `.load(...).findEach(...)` avoids instantiating massive amounts of data at once
   *
   * Note: Left join loading loads all data in a single SQL query but has trade-offs compared
   * to regular preloading. See {@link Dream.leftJoinPreload} for details about limitations.
   *
   * ```ts
   * await user
   *  .leftJoinLoad('posts', { body: ops.ilike('%hello world%') }, 'comments', 'replies')
   *  .leftJoinLoad('images')
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
   * @returns A chainable LeftJoinLoadBuilder instance
   */
  public leftJoinLoad<
    I extends Dream,
    DB extends I['DB'],
    TableName extends I['table'],
    Schema extends I['schema'],
    const Arr extends readonly unknown[],
  >(
    this: I,
    ...args: [...Arr, VariadicLeftJoinLoadArgs<DB, Schema, TableName, Arr>]
  ): LeftJoinLoadBuilder<I> {
    return new LeftJoinLoadBuilder<I>(this).leftJoinLoad(...(args as any))
  }

  /**
   * Recursively loads all Dream associations referenced by `rendersOne` and `rendersMany`
   * in a DreamSerializer. This traverses the entire content tree of serializers to automatically
   * load all necessary associations, eliminating N+1 query problems and removing the need to
   * manually remember which associations to preload for serialization.
   *
   * This method decouples data loading code from data rendering code by having the serializer
   * (rendering code) inform the query (loading code) about which associations are needed.
   * As serializers evolve over time - adding new `rendersOne` and `rendersMany` calls or
   * modifying existing ones - the loading code automatically adapts without requiring
   * corresponding modifications to preload statements.
   *
   * This method analyzes the serializer (specified by `serializerKey` or 'default') and
   * automatically preloads all associations that will be needed during serialization.
   *
   * Note: Left join loading loads all data in a single SQL query but has trade-offs compared
   * to regular preloading. See {@link Dream.leftJoinPreload} for details about limitations.
   *
   * ```ts
   * // Instead of manually specifying all associations:
   * await User.preload('posts', 'comments', 'replies').all()
   *
   * // Automatically preload everything needed for serialization:
   * await user.leftJoinLoadFor('summary').execute()
   *
   * // Add where conditions to specific associations during preloading:
   * await user.leftJoinLoadFor('detailed', (associationName, dreamClass) => {
   *   if (dreamClass.typeof(Post) && associationName === 'comments') {
   *     return { and: { published: true } }
   *   }
   * })
   *    .execute()
   *
   * // Skip preloading specific associations to handle them manually:
   * await user
   *   .loadFor('summary', (associationName, dreamClass) => {
   *     if (dreamClass.typeof(User) && associationName === 'posts') {
   *       return 'omit' // Handle posts preloading separately with custom logic
   *     }
   *   })
   *     .load('posts', { and: { featured: true } }) // Custom preloading
   *     .execute()
   * ```
   *
   * @param serializerKey - The serializer key to use for determining which associations to preload.
   * @param modifierFn - Optional callback function to modify or omit specific associations during preloading. Called for each association with the Dream class and association name. Return an object with `and`, `andAny`, or `andNot` properties to add where conditions, return 'omit' to skip preloading that association (useful when you want to handle it manually), or return undefined to use default preloading
   * @returns A Query with all serialization associations preloaded
   */
  public leftJoinLoadFor<I extends Dream, SerializerKey extends DreamSerializerKey<I>>(
    this: I,
    serializerKey: SerializerKey,
    modifierFn?: LoadForModifierFn
  ) {
    return new LeftJoinLoadBuilder<I>(this)['leftJoinLoadFor'](serializerKey, modifierFn)
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
    AssociationName extends DreamModelAssociationNames<Schema, TableName>,
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
   * @param __namedParameters - optional parameters
   * @param __namedParameters.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @returns void
   */
  public async save<I extends Dream>(this: I, { skipHooks }: { skipHooks?: boolean } = {}): Promise<void> {
    await saveDream(this, null, skipHooks ? { skipHooks } : undefined)
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
  public txn<I extends Dream>(
    this: I,
    txn: DreamTransaction<Dream> | null
  ): DreamInstanceTransactionBuilder<I> {
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
   * @param __namedParameters - optional parameters
   * @param __namedParameters.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @returns void
   */
  public async update<I extends Dream>(
    this: I,
    attributes: UpdateableProperties<I>,
    { skipHooks }: { skipHooks?: boolean } = {}
  ): Promise<void> {
    // use #assignAttributes to leverage any custom-defined setters
    this.assignAttributes(attributes)
    await this.save(skipHooks ? { skipHooks } : undefined)
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
   * @param __namedParameters - optional parameters
   * @param __namedParameters.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @returns - void
   */
  public async updateAttributes<I extends Dream>(
    this: I,
    attributes: UpdateableProperties<I>,
    { skipHooks }: { skipHooks?: boolean } = {}
  ): Promise<void> {
    // use #setAttributes to bypass any custom-defined setters
    this.setAttributes(attributes)
    await this.save(skipHooks ? { skipHooks } : undefined)
  }

  /**
   * Flags a dream model so that it does not
   * actually destroy when in a destroy phase.
   * This is usually used for a soft-delete
   * pattern
   *
   * ```ts
   * class User extends ApplicationModel {
   *   @deco.BeforeDestroy()
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
   * Undoes {@link Dream.preventDeletion}
   *
   * ```ts
   * class User extends ApplicationModel {
   *   @deco.BeforeDestroy()
   *   public async softDelete() {
   *     await this.update({ deletedAt: DateTime.now() })
   *     this.preventDeletion()
   *   }
   *
   *   @deco.BeforeDestroy()
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
