import { CompiledQuery, DeleteQueryBuilder, InsertQueryBuilder, SelectQueryBuilder, Updateable, UpdateQueryBuilder } from 'kysely';
import { DateTime } from 'luxon';
import { AssociationTableNames } from './db/reflections';
import { DbConnectionType } from './db/types';
import { BelongsToOptions, BelongsToStatement } from './decorators/associations/belongs-to';
import { HasManyOptions, HasManyStatement, HasManyThroughOptions } from './decorators/associations/has-many';
import { HasOneOptions, HasOneStatement, HasOneThroughOptions } from './decorators/associations/has-one';
import { PassthroughWhere, WhereStatement, WhereStatementForAssociation } from './decorators/associations/shared';
import { AfterHookOpts, BeforeHookOpts, HookStatement } from './decorators/hooks/shared';
import { ScopeStatement } from './decorators/scope';
import { SortableFieldConfig } from './decorators/sortable';
import ValidationStatement, { ValidationType } from './decorators/validations/shared';
import { VirtualAttributeStatement } from './decorators/virtual';
import DreamClassTransactionBuilder from './dream/class-transaction-builder';
import DreamInstanceTransactionBuilder from './dream/instance-transaction-builder';
import { DestroyOptions } from './dream/internal/destroyOptions';
import LoadBuilder from './dream/load-builder';
import Query, { FindEachOpts } from './dream/query';
import DreamTransaction from './dream/transaction';
import { AllDefaultScopeNames, AttributeKeys, DefaultOrNamedScopeName, DreamAssociationNamesWithoutRequiredWhereClauses, DreamAssociationNamesWithRequiredWhereClauses, DreamAssociationType, DreamAttributes, DreamBelongsToAssociationMetadata, DreamColumnNames, DreamParamSafeColumnNames, DreamSerializeOptions, FinalVariadicTableName, GlobalModelNames, IdType, NextPreloadArgumentType, OrderDir, PassthroughColumnNames, TableColumnNames, TableColumnType, UpdateableAssociationProperties, UpdateableProperties, UpdateablePropertiesForClass, VariadicCountThroughArgs, VariadicJoinsArgs, VariadicLoadArgs, VariadicMinMaxThroughArgs, VariadicPluckEachThroughArgs, VariadicPluckThroughArgs } from './dream/types';
import CalendarDate from './helpers/CalendarDate';
export default class Dream {
    DB: any;
    get schema(): any;
    get globalSchema(): any;
    /**
     * Shadows #primaryKey, a getter which can be overwritten to customize the id field
     * for a given model.
     *
     * @returns string
     */
    static get primaryKey(): "id";
    /**
     * Shadows #table, a getter which can be overwritten to customize the table field
     * for a given model.
     *
     * @returns string
     */
    static get table(): string;
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
    get createdAtField(): Readonly<string>;
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
    get updatedAtField(): Readonly<string>;
    get deletedAtField(): Readonly<string>;
    /**
     * @internal
     *
     * Model storage for association metadata, set when using the association decorators like:
     *   @ModelName.HasOne
     *   @ModelName.HasMany
     *   @ModelName.BelongsTo
     */
    protected static associationMetadataByType: {
        belongsTo: BelongsToStatement<any, any, any, any>[];
        hasMany: HasManyStatement<any, any, any, any>[];
        hasOne: HasOneStatement<any, any, any, any>[];
    };
    /**
     * @internal
     *
     * Model storage for scope metadata, set when using the @Scope decorator
     */
    protected static scopes: {
        default: ScopeStatement[];
        named: ScopeStatement[];
    };
    /**
     * @internal
     *
     * Model storage for virtual attribute metadata, set when using the @Virtual decorator
     */
    protected static virtualAttributes: VirtualAttributeStatement[];
    /**
     * @internal
     *
     * Model storage for sortable metadata, set when using the @Sortable decorator
     */
    protected static sortableFields: SortableFieldConfig[];
    /**
     * @internal
     *
     * Model storage for STI metadata, set when using the @STI decorator
     */
    protected static extendedBy: (typeof Dream)[] | null;
    /**
     * @internal
     *
     * Model storage for STI metadata, set when using the @STI decorator
     */
    protected static sti: {
        active: boolean;
        baseClass: typeof Dream | null;
        value: string | null;
    };
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
        beforeCreate: HookStatement[];
        beforeUpdate: HookStatement[];
        beforeSave: HookStatement[];
        beforeDestroy: HookStatement[];
        afterCreate: HookStatement[];
        afterCreateCommit: HookStatement[];
        afterUpdate: HookStatement[];
        afterUpdateCommit: HookStatement[];
        afterSave: HookStatement[];
        afterSaveCommit: HookStatement[];
        afterDestroy: HookStatement[];
        afterDestroyCommit: HookStatement[];
    };
    /**
     * @internal
     *
     * Model storage for validation metadata, set when using the @Validates decorator
     */
    protected static validations: ValidationStatement[];
    /**
     * @internal
     *
     * model storage for custom validation metadata, set when using the @Validate decorator
     */
    protected static customValidations: string[];
    /**
     * @internal
     *
     * Model storage for replica-safe metadata, set when using the @ReplicaSafe decorator
     */
    protected static replicaSafe: boolean;
    /**
     * @internal
     *
     * Model storage for soft-delete metadata, set when using the @SoftDelete decorator
     */
    protected static softDelete: boolean;
    /**
     * @internal
     *
     * Provided to distinguish between Dream and other classes
     *
     * @returns true
     */
    static get isDream(): boolean;
    /**
     * @internal
     *
     * Returns true if this model class is the base class of other STI models
     *
     * @returns boolean
     */
    protected static get isSTIBase(): boolean;
    /**
     * @internal
     *
     * Returns true if this model class a child class of a base STI model
     *
     * @returns boolean
     */
    protected static get isSTIChild(): boolean;
    /**
     * @internal
     *
     * Returns either the base STI class, or else this class
     *
     * @returns A dream class
     */
    protected static get stiBaseClassOrOwnClass(): typeof Dream;
    /**
     * @internal
     *
     * Shadows .stiBaseClassOrOwnClass. Returns either the base STI class, or else this class
     *
     * @returns A dream class
     */
    protected get stiBaseClassOrOwnClass(): typeof Dream;
    /**
     * @internal
     *
     * Used by model hook decorators to apply a hook to a specific model.
     *
     * @param hookType - the type of hook you want to attach the provided statement to
     * @param statement - the statement to couple to the provided hookType
     * @returns void
     */
    protected static addHook(hookType: keyof typeof this.hooks, statement: HookStatement): void;
    /**
     * Establishes a "BelongsTo" association between the base dream
     * and the child dream, where the base dream has a foreign key
     * which points back to the child dream.
     *
     * ```ts
     * class UserSettings extends ApplicationModel {
     *   @UserSettings.BelongsTo('User')
     *   public user: User
     *   public userId: DreamColumn<UserSettings, 'userId'>
     * }
     *
     * class User extends ApplicationModel {
     *   @User.HasOne('UserSettings')
     *   public userSettings: UserSettings
     * }
     * ```
     *
     *
     *
     * @param modelCB - a function that immediately returns the dream class you are associating with this dream class
     * @param options - the options you want to use to apply to this association
     * @returns A BelongsTo decorator
     */
    static BelongsTo<T extends typeof Dream, const AssociationGlobalNameOrNames extends GlobalModelNames<InstanceType<T>> | readonly GlobalModelNames<InstanceType<T>>[]>(this: T, globalAssociationNameOrNames: AssociationGlobalNameOrNames, options?: BelongsToOptions<InstanceType<T>, AssociationGlobalNameOrNames>): any;
    static HasMany<T extends typeof Dream, const AssociationGlobalNameOrNames extends GlobalModelNames<InstanceType<T>> | readonly GlobalModelNames<InstanceType<T>>[]>(this: T, globalAssociationNameOrNames: AssociationGlobalNameOrNames, options?: HasManyOptions<InstanceType<T>, AssociationGlobalNameOrNames>): any;
    static HasMany<T extends typeof Dream, const AssociationGlobalNameOrNames extends GlobalModelNames<InstanceType<T>> | readonly GlobalModelNames<InstanceType<T>>[]>(this: T, globalAssociationNameOrNames: AssociationGlobalNameOrNames, options?: HasManyThroughOptions<InstanceType<T>, AssociationGlobalNameOrNames>): any;
    static HasOne<T extends typeof Dream, const AssociationGlobalNameOrNames extends GlobalModelNames<InstanceType<T>> | readonly GlobalModelNames<InstanceType<T>>[]>(this: T, globalAssociationNameOrNames: AssociationGlobalNameOrNames, options?: HasOneOptions<InstanceType<T>, AssociationGlobalNameOrNames>): any;
    static HasOne<T extends typeof Dream, const AssociationGlobalNameOrNames extends GlobalModelNames<InstanceType<T>> | readonly GlobalModelNames<InstanceType<T>>[]>(this: T, globalAssociationNameOrNames: AssociationGlobalNameOrNames, options?: HasOneThroughOptions<InstanceType<T>, AssociationGlobalNameOrNames>): any;
    /**
     * Shortcut to the @Sortable decorator, which also provides extra type protection which cannot be provided
     * with the @Sortable decorator.
     *
     * @param scope - The column, association, or combination there-of which you would like to restrict the incrementing logic to
     * @returns A Sortable decorator
     */
    static Sortable<T extends typeof Dream>(this: T, { scope, }: {
        scope: keyof DreamBelongsToAssociationMetadata<InstanceType<T>> | DreamColumnNames<InstanceType<T>> | (keyof DreamBelongsToAssociationMetadata<InstanceType<T>> | DreamColumnNames<InstanceType<T>>)[];
    }): any;
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
    static BeforeCreate<T extends typeof Dream>(this: T, opts: BeforeHookOpts<InstanceType<T>>): any;
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
    static BeforeSave<T extends typeof Dream>(this: T, opts: BeforeHookOpts<InstanceType<T>>): any;
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
    static BeforeUpdate<T extends typeof Dream>(this: T, opts: BeforeHookOpts<InstanceType<T>>): any;
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
    static BeforeDestroy<T extends typeof Dream>(this: T): any;
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
    static AfterCreate<T extends typeof Dream>(this: T, opts: AfterHookOpts<InstanceType<T>>): any;
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
    static AfterCreateCommit<T extends typeof Dream>(this: T, opts: AfterHookOpts<InstanceType<T>>): any;
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
    static AfterSave<T extends typeof Dream>(this: T, opts: AfterHookOpts<InstanceType<T>>): any;
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
    static AfterSaveCommit<T extends typeof Dream>(this: T, opts: AfterHookOpts<InstanceType<T>>): any;
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
    static AfterUpdate<T extends typeof Dream>(this: T, opts: AfterHookOpts<InstanceType<T>>): any;
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
    static AfterUpdateCommit<T extends typeof Dream>(this: T, opts: AfterHookOpts<InstanceType<T>>): any;
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
    static AfterDestroy<T extends typeof Dream>(this: T): any;
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
    static AfterDestroyCommit<T extends typeof Dream>(this: T): any;
    private static _globalName;
    /**
     * @internal
     *
     * Returns a unique global name for the given model.
     *
     * @returns A string representing a unique key for this model
     */
    static get globalName(): string;
    private static setGlobalName;
    /**
     * Returns the column names for the given model
     *
     * @returns The column names for the given model
     */
    static columns<T extends typeof Dream, I extends InstanceType<T>, DB extends I['DB'], TableName extends keyof DB = InstanceType<T>['table'] & keyof DB, Table extends DB[keyof DB] = DB[TableName]>(this: T): Set<keyof Table & string>;
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
    static paramSafeColumnsOrFallback<T extends typeof Dream, I extends InstanceType<T>, ParamSafeColumnsOverride extends InstanceType<T>['paramSafeColumns' & keyof InstanceType<T>] extends never ? undefined : InstanceType<T>['paramSafeColumns' & keyof InstanceType<T>] & string[], ReturnVal extends ParamSafeColumnsOverride extends string[] ? Extract<DreamParamSafeColumnNames<I>, ParamSafeColumnsOverride[number] & DreamParamSafeColumnNames<I>>[] : DreamParamSafeColumnNames<I>[]>(this: T): ReturnVal;
    protected static defaultParamSafeColumns<T extends typeof Dream, I extends InstanceType<T>>(this: T): DreamParamSafeColumnNames<I>[];
    /**
     * @internal
     *
     * Returns true if the column is virtual (set using the @Virtual decorator)
     *
     * @param columnName - the name of the property you are checking for
     * @returns boolean
     */
    static isVirtualColumn<T extends typeof Dream>(this: T, columnName: string): boolean;
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
    private static getAssociationMetadata;
    /**
     * @internal
     *
     * Returns an array containing all of the associations for this dream class
     *
     * @returns An array containing all of the associations for this dream class
     */
    private static associationMetadataMap;
    /**
     * @internal
     *
     * Returns all of the association names for this dream class
     *
     * @returns All of the association names for this dream class
     */
    static get associationNames(): string[];
    /**
     * Returns a query for this model which disregards default scopes
     *
     * @returns A query for this model which disregards default scopes
     */
    static removeAllDefaultScopes<T extends typeof Dream>(this: T): Query<InstanceType<T>>;
    /**
     * Prevents a specific default scope from applying when
     * the Query is executed
     *
     * @returns A new Query which will prevent a specific default scope from applying
     */
    static removeDefaultScope<T extends typeof Dream>(this: T, scopeName: AllDefaultScopeNames<InstanceType<T>>): Query<InstanceType<T>>;
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
    static all<T extends typeof Dream>(this: T): Promise<InstanceType<T>[]>;
    /**
     * @internal
     *
     * Retrieves a query with the requested connection
     *
     * @param connection - The connection you wish to access
     * @returns A query with the requested connection
     */
    protected static connection<T extends typeof Dream>(this: T, connection: DbConnectionType): Query<InstanceType<T>>;
    /**
     * Retrieves the number of records corresponding
     * to this model.
     *
     * @returns The number of records corresponding to this model
     */
    static count<T extends typeof Dream>(this: T): Promise<number>;
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
    static max<T extends typeof Dream, ColumnName extends DreamColumnNames<InstanceType<T>>>(this: T, columnName: ColumnName): Promise<import("./dream/types").DreamColumn<InstanceType<T>, ColumnName & keyof InstanceType<T>["schema"][InstanceType<T>["table"] & keyof InstanceType<T>["schema"]]["columns" & keyof InstanceType<T>["schema"][InstanceType<T>["table"] & keyof InstanceType<T>["schema"]]]> | null>;
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
    static min<T extends typeof Dream, ColumnName extends DreamColumnNames<InstanceType<T>>>(this: T, columnName: ColumnName): Promise<import("./dream/types").DreamColumn<InstanceType<T>, ColumnName & keyof InstanceType<T>["schema"][InstanceType<T>["table"] & keyof InstanceType<T>["schema"]]["columns" & keyof InstanceType<T>["schema"][InstanceType<T>["table"] & keyof InstanceType<T>["schema"]]]> | null>;
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
    static create<T extends typeof Dream>(this: T, attributes?: UpdateablePropertiesForClass<T>): Promise<InstanceType<T>>;
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
    static createOrFindBy<T extends typeof Dream>(this: T, attributes: UpdateablePropertiesForClass<T>, extraOpts?: CreateOrFindByExtraOps<T>): Promise<InstanceType<T>>;
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
    static distinct<T extends typeof Dream, I extends InstanceType<T>, DB extends I['DB'], TableName extends InstanceType<T>['table']>(this: T, columnName?: TableColumnNames<DB, TableName> | null | boolean): Query<InstanceType<T>>;
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
    static find<T extends typeof Dream, I extends InstanceType<T>, Schema extends I['schema'], SchemaIdType = Schema[InstanceType<T>['table']]['columns'][I['primaryKey']]['coercedType']>(this: T, primaryKey: SchemaIdType): Promise<InstanceType<T> | null>;
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
    static findOrFail<T extends typeof Dream, I extends InstanceType<T>, Schema extends I['schema'], SchemaIdType = Schema[InstanceType<T>['table']]['columns'][I['primaryKey']]['coercedType']>(this: T, primaryKey: SchemaIdType): Promise<InstanceType<T>>;
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
    static findEach<T extends typeof Dream>(this: T, cb: (instance: InstanceType<T>) => void | Promise<void>, opts?: FindEachOpts): Promise<void>;
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
     *   @Image.HasMany('LocalizedText')
     *   public localizedTexts: LocalizedText[]
     * }
     *
     * class Post extends ApplicationModel {
     *   @Post.HasMany('LocalizedText')
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
    static loadInto<T extends typeof Dream, I extends InstanceType<T>, DB extends I['DB'], TableName extends I['table'], Schema extends I['schema'], const Arr extends readonly unknown[]>(this: T, dreams: Dream[], ...args: [...Arr, VariadicLoadArgs<DB, Schema, TableName, Arr>]): Promise<void>;
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
    static query<T extends typeof Dream, I extends InstanceType<T>>(this: T): Query<I>;
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
    private query;
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
    static findBy<T extends typeof Dream, I extends InstanceType<T>>(this: T, whereStatement: WhereStatement<I['DB'], I['schema'], I['table']>): Promise<InstanceType<T> | null>;
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
    static findOrFailBy<T extends typeof Dream, I extends InstanceType<T>>(this: T, whereStatement: WhereStatement<I['DB'], I['schema'], I['table']>): Promise<InstanceType<T>>;
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
    static findOrCreateBy<T extends typeof Dream>(this: T, attributes: UpdateablePropertiesForClass<T>, extraOpts?: CreateOrFindByExtraOps<T>): Promise<InstanceType<T>>;
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
    static exists<T extends typeof Dream>(this: T): Promise<boolean>;
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
    static preload<T extends typeof Dream, I extends InstanceType<T>, DB extends I['DB'], TableName extends InstanceType<T>['table'], Schema extends I['schema'], const Arr extends readonly unknown[]>(this: T, ...args: [...Arr, VariadicLoadArgs<DB, Schema, TableName, Arr>]): Query<InstanceType<T>>;
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
    static joins<T extends typeof Dream, I extends InstanceType<T>, DB extends I['DB'], Schema extends I['schema'], TableName extends I['table'] & keyof Schema, const Arr extends readonly unknown[]>(this: T, ...args: [...Arr, VariadicJoinsArgs<DB, Schema, TableName, Arr>]): Query<InstanceType<T>>;
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
    static first<T extends typeof Dream>(this: T): Promise<InstanceType<T> | null>;
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
    static firstOrFail<T extends typeof Dream>(this: T): Promise<InstanceType<T>>;
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
    static last<T extends typeof Dream>(this: T): Promise<InstanceType<T> | null>;
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
    static lastOrFail<T extends typeof Dream>(this: T): Promise<InstanceType<T>>;
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
    static limit<T extends typeof Dream>(this: T, count: number | null): Query<InstanceType<T>>;
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
    static offset<T extends typeof Dream>(this: T, offset: number | null): Query<InstanceType<T>>;
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
    static order<T extends typeof Dream, I extends InstanceType<T>>(this: T, orderStatement: DreamColumnNames<I> | Partial<Record<DreamColumnNames<I>, OrderDir>> | null): Query<InstanceType<T>>;
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
    static pluck<T extends typeof Dream>(this: T, ...fields: DreamColumnNames<InstanceType<T>>[]): Promise<any[]>;
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
    static pluckEach<T extends typeof Dream, CB extends (plucked: any) => void | Promise<void>>(this: T, ...fields: (DreamColumnNames<InstanceType<T>> | CB | FindEachOpts)[]): Promise<void>;
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
    static resort<T extends typeof Dream>(this: T, ...fields: DreamColumnNames<InstanceType<T>>[]): Promise<void>;
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
    static scope<T extends typeof Dream>(this: T, scopeName: DefaultOrNamedScopeName<InstanceType<T>>): Query<InstanceType<T>>;
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
    static sql<T extends typeof Dream>(this: T): CompiledQuery<object>;
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
    static toKysely<T extends typeof Dream, QueryType extends 'select' | 'delete' | 'update' | 'insert', ToKyselyReturnType = QueryType extends 'select' ? SelectQueryBuilder<InstanceType<T>['DB'], InstanceType<T>['table'], any> : QueryType extends 'delete' ? DeleteQueryBuilder<InstanceType<T>['DB'], InstanceType<T>['table'], any> : QueryType extends 'update' ? UpdateQueryBuilder<InstanceType<T>['DB'], InstanceType<T>['table'], InstanceType<T>['table'], any> : QueryType extends 'insert' ? InsertQueryBuilder<InstanceType<T>['DB'], InstanceType<T>['table'], any> : never>(this: T, type: QueryType): ToKyselyReturnType;
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
    static txn<T extends typeof Dream, I extends InstanceType<T>>(this: T, txn: DreamTransaction<I>): DreamClassTransactionBuilder<I>;
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
    static transaction<T extends typeof Dream, CB extends (txn: DreamTransaction<InstanceType<T>>) => unknown, RetType extends ReturnType<CB>>(this: T, callback: CB): Promise<RetType>;
    /**
     * Sends data through for use as passthrough data
     * for the associations that require it.
     *
     * ```ts
     * class Post {
     *   @Post.HasMany('LocalizedText')
     *   public localizedTexts: LocalizedText[]
     *
     *   @Post.HasOne('LocalizedText', {
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
    static passthrough<T extends typeof Dream, I extends InstanceType<T>, PassthroughColumns extends PassthroughColumnNames<I>>(this: T, passthroughWhereStatement: PassthroughWhere<PassthroughColumns>): Query<InstanceType<T>>;
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
    static where<T extends typeof Dream, I extends InstanceType<T>, DB extends I['DB'], Schema extends I['schema'], TableName extends AssociationTableNames<DB, Schema> & keyof DB = InstanceType<T>['table']>(this: T, whereStatement: WhereStatement<DB, Schema, TableName>): Query<InstanceType<T>>;
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
    static whereAny<T extends typeof Dream, I extends InstanceType<T>, DB extends I['DB'], Schema extends I['schema'], TableName extends AssociationTableNames<DB, Schema> & keyof DB = InstanceType<T>['table']>(this: T, statements: WhereStatement<DB, Schema, TableName>[]): Query<InstanceType<T>>;
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
    static whereNot<T extends typeof Dream, I extends InstanceType<T>, DB extends I['DB'], Schema extends I['schema'], TableName extends AssociationTableNames<DB, Schema> & keyof DB = InstanceType<T>['table']>(this: T, attributes: WhereStatement<DB, Schema, TableName>): Query<InstanceType<T>>;
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
    private static isBelongsToAssociationForeignKey;
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
    private static isBelongsToAssociationPolymorphicTypeField;
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
    private static belongsToAssociationForeignKeys;
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
    private static polymorphicTypeColumns;
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
    private static belongsToAssociationNames;
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
    private static dependentDestroyAssociationNames;
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
    private getAssociationMetadata;
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
    private associationMetadataMap;
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
    private get associationMetadataByType();
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
    get associationNames(): string[];
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
    get isDirty(): boolean;
    /**
     * Returns true. This is useful for identifying
     * dream instances from other objects
     *
     * @returns true
     */
    get isDreamInstance(): boolean;
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
    get isInvalid(): boolean;
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
    get isNewRecord(): boolean;
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
    get isValid(): boolean;
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
    get primaryKey(): "id";
    /**
     * Returns the value of the primary key
     *
     * @returns The value of the primary key field for this Dream instance
     */
    get primaryKeyValue(): IdType;
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
    get passthroughColumns(): any;
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
    get table(): AssociationTableNames<any, any>;
    /**
     * @internal
     *
     * _errors is used to inform validation errors,
     * and is built whenever validations are run on
     * a dream instance.
     */
    private _errors;
    /**
     * @internal
     *
     * Used for the changes api
     */
    private frozenAttributes;
    /**
     * @internal
     *
     * Used for the changes api
     */
    private originalAttributes;
    /**
     * @internal
     *
     * Used for the changes api
     */
    private currentAttributes;
    /**
     * @internal
     *
     * Used for the changes api
     */
    private attributesFromBeforeLastSave;
    /**
     * @internal
     *
     * Stores whether the record has been persisted or not
     */
    private _isPersisted;
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
    get isPersisted(): boolean;
    protected set isPersisted(val: boolean);
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
    static new<T extends typeof Dream>(this: T, opts?: UpdateablePropertiesForClass<T>, additionalOpts?: {
        bypassUserDefinedSetters?: boolean;
    }): InstanceType<T>;
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
    constructor(opts?: any, additionalOpts?: {
        bypassUserDefinedSetters?: boolean;
        isPersisted?: boolean;
    });
    /**
     * @internal
     *
     * Used for determining which attributes to update
     */
    protected static extractAttributesFromUpdateableProperties<T extends typeof Dream>(this: T, attributes: UpdateablePropertiesForClass<T>, dreamInstance?: InstanceType<T>, { bypassUserDefinedSetters }?: {
        bypassUserDefinedSetters?: boolean;
    }): WhereStatement<InstanceType<T>['DB'], InstanceType<T>['schema'], InstanceType<T>['table']>;
    /**
     * @internal
     *
     * defines attribute setters and getters for every column
     * set within your db/schema.ts file
     */
    protected defineAttributeAccessors(): void;
    /**
     * Returns true if the columnName passed is marked by a
     * Virtual attribute decorator
     *
     * @param columnName - A property on this model to check
     * @returns A boolean
     */
    isVirtualColumn<T extends Dream>(this: T, columnName: string): boolean;
    /**
     * Returns an object with column names for keys, and an
     * array of strings representing validation errors for values.
     *
     * @returns An error object
     */
    get errors(): {
        [key: string]: ValidationType[];
    };
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
    addError<I extends Dream, Key extends AttributeKeys<I>>(this: I, column: Key & string, error: string): void;
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
    assignAttribute<I extends Dream, Key extends AttributeKeys<I>>(this: I, attr: Key & string, val: any): void;
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
    setAttribute<I extends Dream, Key extends AttributeKeys<I>>(this: I, attr: Key & string, val: any): void;
    /**
     * Returns the value for a columnName provided,
     * bypassing the getters.
     *
     * ```ts
     *  const user = User.new({ email: 'how@yadoin' })
     *  user.getAttribute('email') // 'how@yadoin'
     * ```
     */
    getAttribute<I extends Dream, Key extends AttributeKeys<I>>(this: I, columnName: Key & string): DreamAttributes<I>[Key];
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
    getAttributes<I extends Dream, DB extends I['DB']>(this: I): Updateable<DB[I['table']]>;
    /**
     * @internal
     *
     * Returns the db type stored within the database
     */
    protected static cachedTypeFor<T extends typeof Dream, DB extends InstanceType<T>['DB'], TableName extends keyof DB = InstanceType<T>['table'] & keyof DB, Table extends DB[keyof DB] = DB[TableName]>(this: T, attribute: keyof Table): string;
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
    changedAttributes<I extends Dream, DB extends I['DB'], Schema extends I['schema'], TableName extends AssociationTableNames<DB, Schema> & keyof DB = I['table'] & AssociationTableNames<DB, Schema>, Table extends DB[keyof DB] = DB[TableName]>(this: I): Updateable<Table>;
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
    changes<I extends Dream, DB extends I['DB'], TableName extends I['table'], Table extends DB[TableName], RetType = Partial<Record<DreamColumnNames<I>, {
        was: Updateable<Table>[DreamColumnNames<I>];
        now: Updateable<Table>[DreamColumnNames<I>];
    }>>>(this: I): RetType;
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
    previousValueForAttribute<I extends Dream, DB extends I['DB'], TableName extends I['table'], Table extends DB[TableName], ColumnName extends DreamColumnNames<I>>(this: I, columnName: ColumnName): Updateable<Table>[ColumnName];
    /**
     * Returns true if the columnName provided has
     * changes that were persisted during the most
     * recent save.
     *
     * @param columnName - the column name to check
     * @returns A boolean
     */
    savedChangeToAttribute<I extends Dream>(this: I, columnName: DreamColumnNames<I>): boolean;
    /**
     * Returns true if the columnName provided has
     * changes that have not yet been persisted.
     *
     * @param columnName - the column name to check
     * @returns A boolean
     */
    willSaveChangeToAttribute<I extends Dream>(this: I, attribute: DreamColumnNames<I>): boolean;
    /**
     * Returns the column names for the given model
     *
     * @returns The column names for the given model
     */
    columns<I extends Dream, DB extends I['DB'], TableName extends keyof DB = I['table'] & keyof DB, Table extends DB[keyof DB] = DB[TableName]>(this: I): Set<keyof Table>;
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
    dirtyAttributes<I extends Dream, DB extends I['DB'], Schema extends I['schema'], TableName extends AssociationTableNames<DB, Schema> & keyof DB = I['table'] & AssociationTableNames<DB, Schema>, Table extends DB[keyof DB] = DB[TableName]>(this: I): Updateable<Table>;
    /**
     * Returns true if an attribute has changes since last persist
     *
     * @returns A boolean
     */
    private attributeIsDirty;
    /**
     * @internal
     */
    private unknownValueToMillis;
    /**
     * @internal
     */
    private unknownValueToDateString;
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
    destroy<I extends Dream>(this: I, options?: DestroyOptions<I>): Promise<I>;
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
    reallyDestroy<I extends Dream>(this: I, options?: DestroyOptions<I>): Promise<I>;
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
    undestroy<I extends Dream>(this: I, options?: DestroyOptions<I>): Promise<I>;
    /**
     * Returns true if the argument is the same Dream class
     * with the same primary key value.
     *
     * NOTE: This does not compare attribute values other than
     * the primary key.
     *
     * @returns A boolean
     */
    equals(other: any): boolean;
    /**
     * @internal
     *
     * Used for changes API
     */
    protected freezeAttributes(): void;
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
    pluckThrough<I extends Dream, DB extends I['DB'], Schema extends I['schema'], TableName extends I['table'], const Arr extends readonly unknown[]>(this: I, ...args: [...Arr, VariadicPluckThroughArgs<DB, Schema, TableName, Arr>]): Promise<any[]>;
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
    pluckEachThrough<I extends Dream, DB extends I['DB'], Schema extends I['schema'], TableName extends I['table'], const Arr extends readonly unknown[]>(this: I, ...args: [...Arr, VariadicPluckEachThroughArgs<DB, Schema, TableName, Arr>]): Promise<void>;
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
    minThrough<I extends Dream, DB extends I['DB'], Schema extends I['schema'], TableName extends I['table'], const Arr extends readonly unknown[], FinalColumnWithAlias extends VariadicMinMaxThroughArgs<DB, Schema, TableName, Arr>, FinalColumn extends FinalColumnWithAlias extends Readonly<`${string}.${infer R extends Readonly<string>}`> ? R : never, FinalTableName extends FinalVariadicTableName<DB, Schema, TableName, Arr>, FinalColumnType extends TableColumnType<Schema, FinalTableName, FinalColumn>>(this: I, ...args: [...Arr, FinalColumnWithAlias]): Promise<FinalColumnType>;
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
    maxThrough<I extends Dream, DB extends I['DB'], Schema extends I['schema'], TableName extends I['table'], const Arr extends readonly unknown[], FinalColumnWithAlias extends VariadicMinMaxThroughArgs<DB, Schema, TableName, Arr>, FinalColumn extends FinalColumnWithAlias extends Readonly<`${string}.${infer R extends Readonly<string>}`> ? R : never, FinalTableName extends FinalVariadicTableName<DB, Schema, TableName, Arr>, FinalColumnType extends TableColumnType<Schema, FinalTableName, FinalColumn>>(this: I, ...args: [...Arr, FinalColumnWithAlias]): Promise<FinalColumnType>;
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
    countThrough<I extends Dream, DB extends I['DB'], Schema extends I['schema'], TableName extends I['table'], const Arr extends readonly unknown[]>(this: I, ...args: [...Arr, VariadicCountThroughArgs<DB, Schema, TableName, Arr>]): Promise<number>;
    /**
     * Deep clones the model and its non-association attributes.
     * Unsets primaryKey, created and updated fields.
     *
     * @returns Non-persisted, cloned Dream instance
     */
    dup<I extends Dream>(this: I): I;
    /**
     * Deep clones the model and it's attributes, but maintains references to
     * loaded associations
     */
    private clone;
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
    createAssociation<I extends Dream, Schema extends I['schema'], AssociationName extends keyof Schema[I['table']]['associations'], PossibleArrayAssociationType = I[AssociationName & keyof I], AssociationType = PossibleArrayAssociationType extends (infer ElementType)[] ? ElementType : PossibleArrayAssociationType, RestrictedAssociationType extends AssociationType extends Dream ? AssociationType : never = AssociationType extends Dream ? AssociationType : never>(this: I, associationName: AssociationName, attributes?: UpdateableAssociationProperties<I, RestrictedAssociationType>): Promise<NonNullable<AssociationType>>;
    destroyAssociation<I extends Dream, DB extends I['DB'], TableName extends I['table'], Schema extends I['schema'], AssociationName extends keyof I & DreamAssociationNamesWithRequiredWhereClauses<I>>(this: I, associationName: AssociationName, options: DestroyOptions<I> & {
        where: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>;
    }): Promise<number>;
    destroyAssociation<I extends Dream, DB extends I['DB'], TableName extends I['table'], Schema extends I['schema'], AssociationName extends keyof I & DreamAssociationNamesWithoutRequiredWhereClauses<I>>(this: I, associationName: AssociationName, options?: DestroyOptions<I> & {
        where?: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>;
    }): Promise<number>;
    reallyDestroyAssociation<I extends Dream, DB extends I['DB'], TableName extends I['table'], Schema extends I['schema'], AssociationName extends keyof I & DreamAssociationNamesWithRequiredWhereClauses<I>>(this: I, associationName: AssociationName, options: DestroyOptions<I> & {
        where: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>;
    }): Promise<number>;
    reallyDestroyAssociation<I extends Dream, DB extends I['DB'], TableName extends I['table'], Schema extends I['schema'], AssociationName extends keyof I & DreamAssociationNamesWithoutRequiredWhereClauses<I>>(this: I, associationName: AssociationName, options?: DestroyOptions<I> & {
        where?: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>;
    }): Promise<number>;
    undestroyAssociation<I extends Dream, DB extends I['DB'], TableName extends I['table'], Schema extends I['schema'], AssociationName extends keyof I & DreamAssociationNamesWithRequiredWhereClauses<I>>(this: I, associationName: AssociationName, options: DestroyOptions<I> & {
        where: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>;
    }): Promise<number>;
    undestroyAssociation<I extends Dream, DB extends I['DB'], TableName extends I['table'], Schema extends I['schema'], AssociationName extends keyof I & DreamAssociationNamesWithoutRequiredWhereClauses<I>>(this: I, associationName: AssociationName, options?: DestroyOptions<I> & {
        where?: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>;
    }): Promise<number>;
    associationQuery<I extends Dream, DB extends I['DB'], TableName extends I['table'], Schema extends I['schema'], AssociationName extends keyof I & DreamAssociationNamesWithRequiredWhereClauses<I>>(this: I, associationName: AssociationName, whereStatement: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>): Query<DreamAssociationType<I, AssociationName>>;
    associationQuery<I extends Dream, DB extends I['DB'], TableName extends I['table'], Schema extends I['schema'], AssociationName extends keyof I & DreamAssociationNamesWithoutRequiredWhereClauses<I>>(this: I, associationName: AssociationName, whereStatement?: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>): Query<DreamAssociationType<I, AssociationName>>;
    updateAssociation<I extends Dream, DB extends I['DB'], TableName extends I['table'], Schema extends I['schema'], AssociationName extends keyof I & DreamAssociationNamesWithRequiredWhereClauses<I>>(this: I, associationName: AssociationName, attributes: Partial<DreamAttributes<DreamAssociationType<I, AssociationName>>>, updateAssociationOptions: {
        bypassAllDefaultScopes?: boolean;
        defaultScopesToBypass?: AllDefaultScopeNames<I>[];
        skipHooks?: boolean;
        where: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>;
    }): Promise<number>;
    updateAssociation<I extends Dream, DB extends I['DB'], TableName extends I['table'], Schema extends I['schema'], AssociationName extends keyof I & DreamAssociationNamesWithoutRequiredWhereClauses<I>>(this: I, associationName: AssociationName, attributes: Partial<DreamAttributes<DreamAssociationType<I, AssociationName>>>, updateAssociationOptions?: {
        bypassAllDefaultScopes?: boolean;
        defaultScopesToBypass?: AllDefaultScopeNames<I>[];
        skipHooks?: boolean;
        where?: WhereStatementForAssociation<DB, Schema, TableName, AssociationName>;
    }): Promise<number>;
    /**
     * Sends data through for use as passthrough data
     * for the associations that require it.
     *
     * ```ts
     * class Post {
     *   @Post.HasMany('LocalizedText')
     *   public localizedTexts: LocalizedText[]
     *
     *   @Post.HasOne('LocalizedText', {
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
    passthrough<I extends Dream, PassthroughColumns extends PassthroughColumnNames<I>>(this: I, passthroughWhereStatement: PassthroughWhere<PassthroughColumns>): LoadBuilder<I>;
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
    load<I extends Dream, DB extends I['DB'], TableName extends I['table'], Schema extends I['schema'], const Arr extends readonly unknown[]>(this: I, ...args: [...Arr, VariadicLoadArgs<DB, Schema, TableName, Arr>]): LoadBuilder<I>;
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
    loaded<I extends Dream, TableName extends I['table'], Schema extends I['schema'], AssociationName extends NextPreloadArgumentType<Schema, TableName>>(this: I, associationName: AssociationName): boolean;
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
    reload<I extends Dream>(this: I): Promise<void>;
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
    serialize<I extends Dream>(this: I, { casing, serializerKey }?: DreamSerializeOptions<I>): {
        [key: string]: any;
    };
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
    assignAttributes<I extends Dream>(this: I, attributes: UpdateableProperties<I>): Partial<import("./helpers/typeutils").MergeUnionOfRecordTypes<{
        [x: string]: any;
    } | Partial<Record<string | number | symbol, import("./ops/ops-statement").default<any, any> | import(".").Range<DateTime<boolean>> | (() => import(".").Range<DateTime<boolean>>) | import(".").Range<CalendarDate> | (() => import(".").Range<CalendarDate>) | import(".").Range<number> | import("./ops/curried-ops-statement").default<any, any, any> | IdType[] | SelectQueryBuilder<any, string | number | symbol, any>>>>>;
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
    setAttributes<I extends Dream>(this: I, attributes: UpdateableProperties<I>): Partial<import("./helpers/typeutils").MergeUnionOfRecordTypes<{
        [x: string]: any;
    } | Partial<Record<string | number | symbol, import("./ops/ops-statement").default<any, any> | import(".").Range<DateTime<boolean>> | (() => import(".").Range<DateTime<boolean>>) | import(".").Range<CalendarDate> | (() => import(".").Range<CalendarDate>) | import(".").Range<number> | import("./ops/curried-ops-statement").default<any, any, any> | IdType[] | SelectQueryBuilder<any, string | number | symbol, any>>>>>;
    private _setAttributes;
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
    save<I extends Dream>(this: I, { skipHooks }?: {
        skipHooks?: boolean;
    }): Promise<void>;
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
    txn<I extends Dream>(this: I, txn: DreamTransaction<Dream>): DreamInstanceTransactionBuilder<I>;
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
    update<I extends Dream>(this: I, attributes: UpdateableProperties<I>, { skipHooks }?: {
        skipHooks?: boolean;
    }): Promise<void>;
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
    updateAttributes<I extends Dream>(this: I, attributes: UpdateableProperties<I>, { skipHooks }?: {
        skipHooks?: boolean;
    }): Promise<void>;
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
    preventDeletion(): void;
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
    unpreventDeletion(): this;
    private _preventDeletion;
}
export interface CreateOrFindByExtraOps<T extends typeof Dream> {
    createWith?: WhereStatement<InstanceType<T>['DB'], InstanceType<T>['schema'], InstanceType<T>['table']> | UpdateablePropertiesForClass<T>;
}
