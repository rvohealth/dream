"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const pg_1 = require("pg");
const db_1 = __importDefault(require("./db"));
const associationToGetterSetterProp_1 = __importDefault(require("./decorators/associations/associationToGetterSetterProp"));
const belongs_to_1 = __importDefault(require("./decorators/associations/belongs-to"));
const has_many_1 = __importDefault(require("./decorators/associations/has-many"));
const has_one_1 = __importDefault(require("./decorators/associations/has-one"));
const shared_1 = require("./decorators/associations/shared");
const after_create_1 = __importDefault(require("./decorators/hooks/after-create"));
const after_create_commit_1 = __importDefault(require("./decorators/hooks/after-create-commit"));
const after_destroy_1 = __importDefault(require("./decorators/hooks/after-destroy"));
const after_destroy_commit_1 = __importDefault(require("./decorators/hooks/after-destroy-commit"));
const after_save_1 = __importDefault(require("./decorators/hooks/after-save"));
const after_save_commit_1 = __importDefault(require("./decorators/hooks/after-save-commit"));
const after_update_1 = __importDefault(require("./decorators/hooks/after-update"));
const after_update_commit_1 = __importDefault(require("./decorators/hooks/after-update-commit"));
const before_create_1 = __importDefault(require("./decorators/hooks/before-create"));
const before_destroy_1 = __importDefault(require("./decorators/hooks/before-destroy"));
const before_save_1 = __importDefault(require("./decorators/hooks/before-save"));
const before_update_1 = __importDefault(require("./decorators/hooks/before-update"));
const shared_2 = require("./decorators/hooks/shared");
const sortable_1 = __importDefault(require("./decorators/sortable"));
const resortAllRecords_1 = __importDefault(require("./decorators/sortable/helpers/resortAllRecords"));
const class_transaction_builder_1 = __importDefault(require("./dream/class-transaction-builder"));
const instance_transaction_builder_1 = __importDefault(require("./dream/instance-transaction-builder"));
const associationQuery_1 = __importDefault(require("./dream/internal/associations/associationQuery"));
const associationUpdateQuery_1 = __importDefault(require("./dream/internal/associations/associationUpdateQuery"));
const createAssociation_1 = __importDefault(require("./dream/internal/associations/createAssociation"));
const destroyAssociation_1 = __importDefault(require("./dream/internal/associations/destroyAssociation"));
const undestroyAssociation_1 = __importDefault(require("./dream/internal/associations/undestroyAssociation"));
const destroyDream_1 = __importDefault(require("./dream/internal/destroyDream"));
const destroyOptions_1 = require("./dream/internal/destroyOptions");
const ensureSTITypeFieldIsSet_1 = __importDefault(require("./dream/internal/ensureSTITypeFieldIsSet"));
const reload_1 = __importDefault(require("./dream/internal/reload"));
const runValidations_1 = __importDefault(require("./dream/internal/runValidations"));
const saveDream_1 = __importDefault(require("./dream/internal/saveDream"));
const scopeHelpers_1 = require("./dream/internal/scopeHelpers");
const undestroyDream_1 = __importDefault(require("./dream/internal/undestroyDream"));
const load_builder_1 = __importDefault(require("./dream/load-builder"));
const query_1 = __importDefault(require("./dream/query"));
const transaction_1 = __importDefault(require("./dream/transaction"));
const can_only_pass_belongs_to_model_param_1 = __importDefault(require("./exceptions/associations/can-only-pass-belongs-to-model-param"));
const cannot_pass_null_or_undefined_to_required_belongs_to_1 = __importDefault(require("./exceptions/associations/cannot-pass-null-or-undefined-to-required-belongs-to"));
const non_loaded_association_1 = __importDefault(require("./exceptions/associations/non-loaded-association"));
const cannot_call_undestroy_on_a_non_soft_delete_model_1 = __importDefault(require("./exceptions/cannot-call-undestroy-on-a-non-soft-delete-model"));
const create_or_find_by_failed_to_create_and_find_1 = __importDefault(require("./exceptions/create-or-find-by-failed-to-create-and-find"));
const global_name_not_set_1 = __importDefault(require("./exceptions/dream-application/global-name-not-set"));
const missing_serializers_definition_1 = __importDefault(require("./exceptions/missing-serializers-definition"));
const missing_table_1 = __importDefault(require("./exceptions/missing-table"));
const non_existent_scope_provided_to_resort_1 = __importDefault(require("./exceptions/non-existent-scope-provided-to-resort"));
const CalendarDate_1 = __importDefault(require("./helpers/CalendarDate"));
const cloneDeepSafe_1 = __importDefault(require("./helpers/cloneDeepSafe"));
const cachedTypeForAttribute_1 = __importDefault(require("./helpers/db/cachedTypeForAttribute"));
const isJsonColumn_1 = __importDefault(require("./helpers/db/types/isJsonColumn"));
const inferSerializerFromDreamOrViewModel_1 = __importDefault(require("./helpers/inferSerializerFromDreamOrViewModel"));
const marshalDBValue_1 = require("./helpers/marshalDBValue");
const typechecks_1 = require("./helpers/typechecks");
class Dream {
    get schema() {
        throw new Error('Must define schema getter in ApplicationModel');
    }
    get globalSchema() {
        throw new Error('Must define schema getter in ApplicationModel');
    }
    /**
     * Shadows #primaryKey, a getter which can be overwritten to customize the id field
     * for a given model.
     *
     * @returns string
     */
    static get primaryKey() {
        return this.prototype.primaryKey;
    }
    /**
     * Shadows #table, a getter which can be overwritten to customize the table field
     * for a given model.
     *
     * @returns string
     */
    static get table() {
        return this.prototype.table;
    }
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
    get createdAtField() {
        return 'createdAt';
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
    get updatedAtField() {
        return 'updatedAt';
    }
    get deletedAtField() {
        return 'deletedAt';
    }
    /**
     * @internal
     *
     * Provided to distinguish between Dream and other classes
     *
     * @returns true
     */
    static get isDream() {
        return true;
    }
    /**
     * @internal
     *
     * Returns true if this model class is the base class of other STI models
     *
     * @returns boolean
     */
    static get isSTIBase() {
        return !!this.extendedBy?.length && !this.isSTIChild;
    }
    /**
     * @internal
     *
     * Returns true if this model class a child class of a base STI model
     *
     * @returns boolean
     */
    static get isSTIChild() {
        return !!this.sti?.active;
    }
    /**
     * @internal
     *
     * Returns either the base STI class, or else this class
     *
     * @returns A dream class
     */
    static get stiBaseClassOrOwnClass() {
        return this.sti.baseClass || this;
    }
    /**
     * @internal
     *
     * Shadows .stiBaseClassOrOwnClass. Returns either the base STI class, or else this class
     *
     * @returns A dream class
     */
    get stiBaseClassOrOwnClass() {
        return this.constructor.stiBaseClassOrOwnClass;
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
    static addHook(hookType, statement) {
        const existingHook = this.hooks[hookType].find(hook => hook.method === statement.method);
        if (existingHook)
            return;
        this.hooks[hookType] = [...this.hooks[hookType], statement];
    }
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
    static BelongsTo(globalAssociationNameOrNames, options = {}) {
        return (0, belongs_to_1.default)(globalAssociationNameOrNames, options);
    }
    /**
     *
     * Establishes a "HasMany" association between the base dream
     * and the child dream, where the child dream has a foreign key
     * which points back to the base dream.
     *
     * ```ts
     * class User extends ApplicationModel {
     *   @User.HasMany('Post')
     *   public posts: Post[]
     * }
     *
     * class Post extends ApplicationModel {
     *   @Post.BelongsTo('User')
     *   public user: User
     *   public userId: DreamColumn<Post, 'userId'>
     * }
     * ```
     *
     * @param modelCB - a function that immediately returns the dream class you are associating with this dream class
     * @param options - the options you want to use to apply to this association
     * @returns A HasMany decorator
     */
    static HasMany(globalAssociationNameOrNames, options = {}) {
        return (0, has_many_1.default)(globalAssociationNameOrNames, options);
    }
    /**
     * Establishes a "HasOne" association between the base dream
     * and the child dream, where the child dream has a foreign key
     * which points back to the base dream.
     *
     * ```ts
     * class User extends ApplicationModel {
     *   @User.HasOne('UserSettings')
     *   public userSettings: UserSettings
     * }
     *
     * class UserSettings extends ApplicationModel {
     *   @UserSettings.BelongsTo('User')
     *   public user: User
     *   public userId: DreamColumn<UserSettings, 'userId'>
     * }
     * ```
     *
     * @param modelCB - A function that immediately returns the dream class you are associating with this dream class
     * @param options - The options you want to use to apply to this association
     * @returns A HasOne decorator
     */
    static HasOne(globalAssociationNameOrNames, options = {}) {
        return (0, has_one_1.default)(globalAssociationNameOrNames, options);
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
    static Sortable({ scope, }) {
        return (0, sortable_1.default)({ scope: scope });
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
    static BeforeCreate(opts) {
        return (0, before_create_1.default)(opts);
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
    static BeforeSave(opts) {
        return (0, before_save_1.default)(opts);
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
    static BeforeUpdate(opts) {
        return (0, before_update_1.default)(opts);
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
    static BeforeDestroy() {
        return (0, before_destroy_1.default)();
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
    static AfterCreate(opts) {
        return (0, after_create_1.default)(opts);
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
    static AfterCreateCommit(opts) {
        return (0, after_create_commit_1.default)(opts);
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
    static AfterSave(opts) {
        return (0, after_save_1.default)(opts);
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
    static AfterSaveCommit(opts) {
        return (0, after_save_commit_1.default)(opts);
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
    static AfterUpdate(opts) {
        return (0, after_update_1.default)(opts);
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
    static AfterUpdateCommit(opts) {
        return (0, after_update_commit_1.default)(opts);
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
    static AfterDestroy() {
        return (0, after_destroy_1.default)();
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
    static AfterDestroyCommit() {
        return (0, after_destroy_commit_1.default)();
    }
    /**
     * @internal
     *
     * Returns a unique global name for the given model.
     *
     * @returns A string representing a unique key for this model
     */
    static get globalName() {
        if (!this._globalName)
            throw new global_name_not_set_1.default(this);
        return this._globalName;
    }
    static setGlobalName(globalName) {
        this._globalName = globalName;
    }
    /**
     * Returns the column names for the given model
     *
     * @returns The column names for the given model
     */
    static columns() {
        const columns = this.prototype.schema[this.table]?.columns;
        return new Set(columns ? Object.keys(columns) : []);
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
    static paramSafeColumnsOrFallback() {
        const defaultParams = this.defaultParamSafeColumns();
        const userDefinedParams = this.prototype.paramSafeColumns;
        if (Array.isArray(userDefinedParams)) {
            return userDefinedParams.filter(param => defaultParams.includes(param));
        }
        return defaultParams;
    }
    static defaultParamSafeColumns() {
        const columns = [...this.columns()].filter(column => {
            if (this.prototype.primaryKey === column)
                return false;
            if ([
                this.prototype.createdAtField,
                this.prototype.updatedAtField,
                this.prototype.deletedAtField,
            ].includes(column))
                return false;
            if (this.isBelongsToAssociationForeignKey(column))
                return false;
            if (this.isBelongsToAssociationPolymorphicTypeField(column))
                return false;
            if (this.sti.active && column === 'type')
                return false;
            return true;
        });
        return [
            ...new Set([...columns, ...this.virtualAttributes.map(attr => attr.property)]),
        ];
    }
    /**
     * @internal
     *
     * Returns true if the column is virtual (set using the @Virtual decorator)
     *
     * @param columnName - the name of the property you are checking for
     * @returns boolean
     */
    static isVirtualColumn(columnName) {
        return this.prototype.isVirtualColumn(columnName);
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
    static getAssociationMetadata(associationName) {
        return this.associationMetadataMap()[associationName];
    }
    /**
     * @internal
     *
     * Returns an array containing all of the associations for this dream class
     *
     * @returns An array containing all of the associations for this dream class
     */
    static associationMetadataMap() {
        const allAssociations = [
            ...this.associationMetadataByType.belongsTo,
            ...this.associationMetadataByType.hasOne,
            ...this.associationMetadataByType.hasMany,
        ];
        const map = {};
        for (const association of allAssociations) {
            map[association.as] = association;
        }
        return map;
    }
    /**
     * @internal
     *
     * Returns all of the association names for this dream class
     *
     * @returns All of the association names for this dream class
     */
    static get associationNames() {
        const allAssociations = [
            ...this.associationMetadataByType.belongsTo,
            ...this.associationMetadataByType.hasOne,
            ...this.associationMetadataByType.hasMany,
        ];
        return allAssociations.map(association => {
            return association.as;
        });
    }
    /**
     * Returns a query for this model which disregards default scopes
     *
     * @returns A query for this model which disregards default scopes
     */
    static removeAllDefaultScopes() {
        return this.query().removeAllDefaultScopes();
    }
    /**
     * Prevents a specific default scope from applying when
     * the Query is executed
     *
     * @returns A new Query which will prevent a specific default scope from applying
     */
    static removeDefaultScope(scopeName) {
        return this.query().removeDefaultScope(scopeName);
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
    static async all() {
        return await this.query().all();
    }
    /**
     * @internal
     *
     * Retrieves a query with the requested connection
     *
     * @param connection - The connection you wish to access
     * @returns A query with the requested connection
     */
    static connection(connection) {
        return new query_1.default(this.prototype, {
            connection,
        });
    }
    /**
     * Retrieves the number of records corresponding
     * to this model.
     *
     * @returns The number of records corresponding to this model
     */
    static async count() {
        return await this.query().count();
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
    static async max(columnName) {
        return await this.query().max(columnName);
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
    static async min(columnName) {
        return await this.query().min(columnName);
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
    static async create(attributes) {
        const dreamModel = new this(attributes);
        await dreamModel.save();
        return dreamModel;
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
    static async createOrFindBy(attributes, extraOpts = {}) {
        try {
            const dreamModel = this.new({
                ...attributes,
                ...(extraOpts?.createWith || {}),
            });
            await dreamModel.save();
            return dreamModel;
        }
        catch (err) {
            if (err instanceof pg_1.DatabaseError &&
                err.message.includes('duplicate key value violates unique constraint')) {
                const dreamModel = await this.findBy(this.extractAttributesFromUpdateableProperties(attributes));
                if (!dreamModel)
                    throw new create_or_find_by_failed_to_create_and_find_1.default(this);
                return dreamModel;
            }
            throw err;
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
    static distinct(columnName) {
        return this.query().distinct(columnName);
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
    static async find(primaryKey) {
        return await this.query().find(primaryKey);
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
    static async findOrFail(primaryKey) {
        return await this.query().findOrFail(primaryKey);
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
    static async findEach(cb, opts) {
        await this.query().findEach(cb, opts);
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
    static async loadInto(dreams, ...args) {
        await this.query().loadInto(dreams, ...args);
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
    static query() {
        return new query_1.default(this.prototype);
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
    query() {
        const dreamClass = this.constructor;
        return dreamClass.where({ [this.primaryKey]: this.primaryKeyValue });
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
    static async findBy(whereStatement) {
        return await this.query().findBy(whereStatement);
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
    static async findOrFailBy(whereStatement) {
        return await this.query().findOrFailBy(whereStatement);
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
    static async findOrCreateBy(attributes, extraOpts = {}) {
        const existingRecord = await this.findBy(this.extractAttributesFromUpdateableProperties(attributes));
        if (existingRecord)
            return existingRecord;
        const dreamModel = new this({
            ...attributes,
            ...(extraOpts?.createWith || {}),
        });
        await dreamModel.save();
        return dreamModel;
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
    static async exists() {
        return await this.query().exists();
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
    static preload(...args) {
        return this.query().preload(...args);
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
    static joins(...args) {
        return this.query().joins(...args);
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
    static async first() {
        return await this.query().first();
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
    static async firstOrFail() {
        return await this.query().firstOrFail();
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
    static async last() {
        return await this.query().last();
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
    static async lastOrFail() {
        return await this.query().lastOrFail();
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
    static limit(count) {
        return this.query().limit(count);
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
    static offset(offset) {
        return this.query().offset(offset);
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
    static order(orderStatement) {
        return this.query().order(orderStatement);
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
    static async pluck(...fields) {
        return await this.query().pluck(...fields);
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
    static async pluckEach(...fields) {
        return await this.query().pluckEach(...fields);
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
    static async resort(...fields) {
        for (const field of fields) {
            const sortableMetadata = this.sortableFields.find(conf => conf.positionField === field);
            if (!sortableMetadata)
                throw new non_existent_scope_provided_to_resort_1.default(fields, this);
            await (0, resortAllRecords_1.default)(this, field, sortableMetadata.scope);
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
    static scope(scopeName) {
        return this[scopeName](this.query());
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
    static sql() {
        return this.query().sql();
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
    static toKysely(type) {
        switch (type) {
            case 'select':
                return this.query().dbFor('select').selectFrom(this.table);
            case 'delete':
                return this.query().dbFor('delete').deleteFrom(this.table);
            case 'update':
                return this.query().dbFor('update').updateTable(this.table);
            case 'insert':
                return this.query().dbFor('insert').insertInto(this.table);
            default:
                throw new Error('never');
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
    static txn(txn) {
        return new class_transaction_builder_1.default(this.prototype, txn);
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
    static async transaction(callback) {
        const dreamTransaction = new transaction_1.default();
        let callbackResponse = undefined;
        await (0, db_1.default)('primary')
            .transaction()
            .execute(async (kyselyTransaction) => {
            dreamTransaction.kyselyTransaction = kyselyTransaction;
            callbackResponse = (await callback(dreamTransaction));
        });
        await dreamTransaction.runAfterCommitHooks(dreamTransaction);
        return callbackResponse;
    }
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
    static passthrough(passthroughWhereStatement) {
        return this.query().passthrough(passthroughWhereStatement);
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
    static where(whereStatement) {
        return this.query().where(whereStatement);
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
    static whereAny(statements) {
        return this.query().whereAny(statements);
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
    static whereNot(attributes) {
        return this.query().whereNot(attributes);
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
    static isBelongsToAssociationForeignKey(column) {
        return this.belongsToAssociationForeignKeys().includes(column);
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
    static isBelongsToAssociationPolymorphicTypeField(column) {
        return this.polymorphicTypeColumns().includes(column);
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
    static belongsToAssociationForeignKeys() {
        const associationMap = this.associationMetadataMap();
        return this.belongsToAssociationNames().map(belongsToKey => associationMap[belongsToKey].foreignKey());
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
    static polymorphicTypeColumns() {
        const associationMap = this.associationMetadataMap();
        return this.belongsToAssociationNames()
            .filter(key => associationMap[key].polymorphic)
            .map(belongsToKey => associationMap[belongsToKey].foreignKeyTypeField());
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
    static belongsToAssociationNames() {
        const associationMap = this.associationMetadataMap();
        return Object.keys(associationMap).filter(key => associationMap[key].type === 'BelongsTo');
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
    static dependentDestroyAssociationNames() {
        const associationMap = this.associationMetadataMap();
        return Object.keys(associationMap).filter(key => associationMap[key]
            .dependent === 'destroy');
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
    getAssociationMetadata(associationName) {
        return this.constructor.getAssociationMetadata(associationName);
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
    associationMetadataMap() {
        return this.constructor.associationMetadataMap();
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
    get associationMetadataByType() {
        return this.constructor.associationMetadataByType;
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
    get associationNames() {
        return this.constructor.associationNames;
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
    get isDirty() {
        return !!Object.keys(this.dirtyAttributes()).length;
    }
    /**
     * Returns true. This is useful for identifying
     * dream instances from other objects
     *
     * @returns true
     */
    get isDreamInstance() {
        return true;
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
    get isInvalid() {
        return !this.isValid;
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
    get isNewRecord() {
        return !this.isPersisted;
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
    get isValid() {
        this._errors = {};
        (0, runValidations_1.default)(this);
        return !Object.keys(this.errors).filter(key => !!this.errors[key].length).length;
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
    get primaryKey() {
        return 'id';
    }
    /**
     * Returns the value of the primary key
     *
     * @returns The value of the primary key field for this Dream instance
     */
    get primaryKeyValue() {
        return this[this.primaryKey] || null;
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
    get passthroughColumns() {
        throw 'must have get passthroughColumns defined on child';
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
    get table() {
        throw new missing_table_1.default(this.constructor);
    }
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
    get isPersisted() {
        return this._isPersisted || false;
    }
    set isPersisted(val) {
        this._isPersisted = val;
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
    static new(opts, additionalOpts = {}) {
        return new this(opts, additionalOpts);
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
    constructor(opts, additionalOpts = {}
    // opts?: Updateable<
    //   InstanceType<DreamModel & typeof Dream>['DB'][InstanceType<DreamModel>['table'] &
    //     keyof InstanceType<DreamModel>['DB']]
    // >
    ) {
        /**
         * @internal
         *
         * _errors is used to inform validation errors,
         * and is built whenever validations are run on
         * a dream instance.
         */
        this._errors = {};
        /**
         * @internal
         *
         * Used for the changes api
         */
        this.frozenAttributes = {};
        /**
         * @internal
         *
         * Used for the changes api
         */
        this.originalAttributes = {};
        /**
         * @internal
         *
         * Used for the changes api
         */
        this.currentAttributes = {};
        /**
         * @internal
         *
         * Used for the changes api
         */
        this.attributesFromBeforeLastSave = {};
        this._preventDeletion = false;
        this.isPersisted = additionalOpts?.isPersisted || false;
        this.defineAttributeAccessors();
        if (opts) {
            const marshalledOpts = this._setAttributes(opts, additionalOpts);
            // if id is set, then we freeze attributes after setting them, so that
            // any modifications afterwards will indicate updates.
            if (this.isPersisted) {
                this.freezeAttributes();
                this.originalAttributes = { ...marshalledOpts };
                this.attributesFromBeforeLastSave = { ...marshalledOpts };
            }
            else {
                const columns = this.constructor.columns();
                columns.forEach(column => {
                    this.originalAttributes[column] = undefined;
                    this.attributesFromBeforeLastSave[column] = undefined;
                });
            }
        }
    }
    /**
     * @internal
     *
     * Used for determining which attributes to update
     */
    static extractAttributesFromUpdateableProperties(attributes, dreamInstance, { bypassUserDefinedSetters = false } = {}) {
        const marshalledOpts = {};
        const setAttributeOnDreamInstance = (attr, value) => {
            if (!dreamInstance)
                return;
            if (bypassUserDefinedSetters) {
                dreamInstance.setAttribute(attr, value);
            }
            else {
                dreamInstance.assignAttribute(attr, value);
            }
        };
        Object.keys(attributes).forEach(attr => {
            const associationMetaData = this.associationMetadataMap()[attr];
            if (associationMetaData && associationMetaData.type !== 'BelongsTo') {
                throw new can_only_pass_belongs_to_model_param_1.default(this, associationMetaData);
            }
            else if (associationMetaData) {
                const belongsToAssociationMetaData = associationMetaData;
                const associatedObject = attributes[attr];
                // if dream instance is passed, set the loaded association
                if (dreamInstance && associatedObject !== undefined)
                    dreamInstance[attr] = associatedObject;
                if (!associationMetaData.optional && !associatedObject)
                    throw new cannot_pass_null_or_undefined_to_required_belongs_to_1.default(this, associationMetaData);
                const foreignKey = belongsToAssociationMetaData.foreignKey();
                const foreignKeyValue = belongsToAssociationMetaData.primaryKeyValue(associatedObject);
                if (foreignKeyValue !== undefined) {
                    marshalledOpts[foreignKey] = foreignKeyValue;
                    setAttributeOnDreamInstance(foreignKey, marshalledOpts[foreignKey]);
                }
                if (belongsToAssociationMetaData.polymorphic) {
                    const foreignKeyTypeField = belongsToAssociationMetaData.foreignKeyTypeField();
                    marshalledOpts[foreignKeyTypeField] = associatedObject?.stiBaseClassOrOwnClass?.name;
                    setAttributeOnDreamInstance(foreignKeyTypeField, associatedObject?.stiBaseClassOrOwnClass?.name);
                }
            }
            else {
                marshalledOpts[attr] = (0, marshalDBValue_1.marshalDBValue)(this, attr, attributes[attr]);
                setAttributeOnDreamInstance(attr, marshalledOpts[attr]);
            }
        });
        return marshalledOpts;
    }
    /**
     * @internal
     *
     * defines attribute setters and getters for every column
     * set within your db/schema.ts file
     */
    defineAttributeAccessors() {
        const dreamClass = this.constructor;
        const columns = dreamClass.columns();
        columns.forEach(column => {
            // this ensures that the currentAttributes object will contain keys
            // for each of the properties
            if (this.currentAttributes[column] === undefined)
                this.currentAttributes[column] = undefined;
            if (!Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), column)?.get &&
                !Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), column)?.set) {
                if ((0, isJsonColumn_1.default)(this.constructor, column)) {
                    Object.defineProperty(Object.getPrototypeOf(this), column, {
                        get() {
                            if ([undefined, null].includes(this.currentAttributes[column]))
                                return this.currentAttributes[column];
                            return JSON.parse(this.currentAttributes[column]);
                        },
                        set(val) {
                            this.currentAttributes[column] = (0, typechecks_1.isString)(val) ? val : JSON.stringify(val);
                        },
                        configurable: true,
                    });
                }
                else {
                    Object.defineProperty(Object.getPrototypeOf(this), column, {
                        get() {
                            return this.currentAttributes[column];
                        },
                        set(val) {
                            return (this.currentAttributes[column] = val);
                        },
                        configurable: true,
                    });
                }
            }
        });
        (0, ensureSTITypeFieldIsSet_1.default)(this);
    }
    /**
     * Returns true if the columnName passed is marked by a
     * Virtual attribute decorator
     *
     * @param columnName - A property on this model to check
     * @returns A boolean
     */
    isVirtualColumn(columnName) {
        return this.constructor.virtualAttributes
            .map(attr => attr.property)
            .includes(columnName);
    }
    /**
     * Returns an object with column names for keys, and an
     * array of strings representing validation errors for values.
     *
     * @returns An error object
     */
    get errors() {
        return { ...this._errors };
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
    addError(column, error) {
        this._errors[column] ||= [];
        this._errors[column].push(error);
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
    assignAttribute(attr, val) {
        const self = this;
        self[attr] = val;
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
    setAttribute(attr, val) {
        const columns = this.constructor.columns();
        const self = this;
        if (columns.has(attr)) {
            self.currentAttributes[attr] = (0, isJsonColumn_1.default)(this.constructor, attr)
                ? (0, typechecks_1.isString)(val)
                    ? val
                    : JSON.stringify(val)
                : val;
        }
        else {
            self.currentAttributes[attr] = val;
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
    getAttribute(columnName) {
        const columns = this.constructor.columns();
        const self = this;
        if (columns.has(columnName)) {
            return self.currentAttributes[columnName];
        }
        else {
            return self[columnName];
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
    getAttributes() {
        return { ...this.currentAttributes };
    }
    /**
     * @internal
     *
     * Returns the db type stored within the database
     */
    static cachedTypeFor(attribute) {
        return (0, cachedTypeForAttribute_1.default)(this, attribute);
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
    changedAttributes() {
        const obj = {};
        Object.keys(this.dirtyAttributes()).forEach(column => {
            ;
            obj[column] = this.frozenAttributes[column];
        });
        return obj;
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
    changes() {
        const obj = {};
        this.constructor.columns().forEach(column => {
            const was = this.previousValueForAttribute(column);
            const now = this[column];
            if (was !== now) {
                ;
                obj[column] = {
                    was,
                    now,
                };
            }
        });
        return obj;
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
    previousValueForAttribute(columnName) {
        if (this.frozenAttributes[columnName] !== this[columnName])
            return this.frozenAttributes[columnName];
        return this.attributesFromBeforeLastSave[columnName];
    }
    /**
     * Returns true if the columnName provided has
     * changes that were persisted during the most
     * recent save.
     *
     * @param columnName - the column name to check
     * @returns A boolean
     */
    savedChangeToAttribute(columnName) {
        const changes = this.changes();
        const now = changes?.[columnName]?.now;
        const was = changes?.[columnName]?.was;
        return this.isPersisted && now !== was;
    }
    /**
     * Returns true if the columnName provided has
     * changes that have not yet been persisted.
     *
     * @param columnName - the column name to check
     * @returns A boolean
     */
    willSaveChangeToAttribute(attribute) {
        return this.attributeIsDirty(attribute);
    }
    /**
     * Returns the column names for the given model
     *
     * @returns The column names for the given model
     */
    columns() {
        return this.constructor.columns();
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
    dirtyAttributes() {
        const obj = {};
        this.columns().forEach(column => {
            // TODO: clean up types
            if (this.attributeIsDirty(column))
                obj[column] = this.getAttributes()[column];
        });
        return obj;
    }
    /**
     * Returns true if an attribute has changes since last persist
     *
     * @returns A boolean
     */
    attributeIsDirty(attribute) {
        const frozenValue = this.frozenAttributes[attribute];
        const currentValue = this.getAttributes()[attribute];
        if (this.isNewRecord)
            return true;
        if (frozenValue instanceof luxon_1.DateTime) {
            return frozenValue.toMillis() !== this.unknownValueToMillis(currentValue);
        }
        else if (frozenValue instanceof CalendarDate_1.default) {
            return frozenValue.toISO() !== this.unknownValueToDateString(currentValue);
        }
        else {
            return frozenValue !== currentValue;
        }
    }
    /**
     * @internal
     */
    unknownValueToMillis(currentValue) {
        if (!currentValue)
            return;
        if ((0, typechecks_1.isString)(currentValue))
            currentValue = luxon_1.DateTime.fromISO(currentValue);
        if (currentValue instanceof CalendarDate_1.default)
            currentValue = currentValue.toDateTime();
        if (currentValue instanceof luxon_1.DateTime && currentValue.isValid)
            return currentValue.toMillis();
    }
    /**
     * @internal
     */
    unknownValueToDateString(currentValue) {
        if (!currentValue)
            return;
        if ((0, typechecks_1.isString)(currentValue))
            currentValue = CalendarDate_1.default.fromISO(currentValue);
        if (currentValue instanceof luxon_1.DateTime)
            currentValue = CalendarDate_1.default.fromDateTime(currentValue);
        if (currentValue instanceof CalendarDate_1.default && currentValue.isValid)
            return currentValue.toISO();
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
    async destroy(options = {}) {
        return await (0, destroyDream_1.default)(this, null, (0, destroyOptions_1.destroyOptions)(options));
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
    async reallyDestroy(options = {}) {
        return await (0, destroyDream_1.default)(this, null, (0, destroyOptions_1.reallyDestroyOptions)(options));
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
    async undestroy(options = {}) {
        const dreamClass = this.constructor;
        if (!dreamClass['softDelete'])
            throw new cannot_call_undestroy_on_a_non_soft_delete_model_1.default(dreamClass);
        await (0, undestroyDream_1.default)(this, null, (0, destroyOptions_1.undestroyOptions)(options));
        return this;
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
    equals(other) {
        return other?.constructor === this.constructor && other.primaryKeyValue === this.primaryKeyValue;
    }
    /**
     * @internal
     *
     * Used for changes API
     */
    freezeAttributes() {
        this.frozenAttributes = { ...this.getAttributes() };
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
    async pluckThrough(...args) {
        return await this.query().pluckThrough(...args);
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
    async pluckEachThrough(...args) {
        return await this.query().pluckEachThrough(...args);
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
    async minThrough(...args) {
        return (await this.query().minThrough(...args));
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
    async maxThrough(...args) {
        return (await this.query().maxThrough(...args));
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
    async countThrough(...args) {
        return await this.query().countThrough(...args);
    }
    /**
     * Deep clones the model and its non-association attributes.
     * Unsets primaryKey, created and updated fields.
     *
     * @returns Non-persisted, cloned Dream instance
     */
    dup() {
        const clone = this.clone({ includeAssociations: false });
        clone.isPersisted = false;
        clone[clone.primaryKey] = undefined;
        clone[clone.createdAtField] = undefined;
        clone[clone.updatedAtField] = undefined;
        return clone;
    }
    /**
     * Deep clones the model and it's attributes, but maintains references to
     * loaded associations
     */
    clone({ includeAssociations = true } = {}) {
        const self = this;
        const clone = new self.constructor();
        const associationDataKeys = Object.values(this.constructor.associationMetadataMap()).map(association => (0, associationToGetterSetterProp_1.default)(association));
        Object.keys(this).forEach(property => {
            if (!associationDataKeys.includes(property))
                clone[property] = (0, cloneDeepSafe_1.default)(self[property]);
        });
        if (includeAssociations) {
            associationDataKeys.forEach(associationDataKey => (clone[associationDataKey] = self[associationDataKey]));
        }
        return clone;
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
    async createAssociation(associationName, attributes = {}) {
        return (0, createAssociation_1.default)(this, null, associationName, attributes);
    }
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
    async destroyAssociation(associationName, options) {
        return await (0, destroyAssociation_1.default)(this, null, associationName, {
            ...(0, destroyOptions_1.destroyOptions)(options),
            associationWhereStatement: options?.where,
        });
    }
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
    async reallyDestroyAssociation(associationName, options) {
        return await (0, destroyAssociation_1.default)(this, null, associationName, {
            ...(0, destroyOptions_1.reallyDestroyOptions)(options),
            associationWhereStatement: options?.where,
        });
    }
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
    async undestroyAssociation(associationName, options) {
        return await (0, undestroyAssociation_1.default)(this, null, associationName, {
            ...(0, destroyOptions_1.undestroyOptions)(options),
            associationWhereStatement: options?.where,
        });
    }
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
    associationQuery(associationName, whereStatement) {
        return (0, associationQuery_1.default)(this, null, associationName, {
            associationWhereStatement: whereStatement,
            bypassAllDefaultScopes: scopeHelpers_1.DEFAULT_BYPASS_ALL_DEFAULT_SCOPES,
            defaultScopesToBypass: scopeHelpers_1.DEFAULT_DEFAULT_SCOPES_TO_BYPASS,
        });
    }
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
    async updateAssociation(associationName, attributes, updateAssociationOptions) {
        return (0, associationUpdateQuery_1.default)(this, null, associationName, {
            associationWhereStatement: updateAssociationOptions?.where,
            bypassAllDefaultScopes: updateAssociationOptions?.bypassAllDefaultScopes ?? scopeHelpers_1.DEFAULT_BYPASS_ALL_DEFAULT_SCOPES,
            defaultScopesToBypass: updateAssociationOptions?.defaultScopesToBypass ?? scopeHelpers_1.DEFAULT_DEFAULT_SCOPES_TO_BYPASS,
        }).update(attributes, { skipHooks: updateAssociationOptions?.skipHooks });
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
    passthrough(passthroughWhereStatement) {
        return new load_builder_1.default(this).passthrough(passthroughWhereStatement);
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
    load(...args) {
        return new load_builder_1.default(this).load(...args);
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
    loaded(associationName) {
        try {
            ;
            this[associationName];
            return true;
        }
        catch (error) {
            if (error.constructor !== non_loaded_association_1.default)
                throw error;
            return false;
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
    async reload() {
        await (0, reload_1.default)(this);
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
    serialize({ casing = null, serializerKey } = {}) {
        const serializerClass = (0, inferSerializerFromDreamOrViewModel_1.default)(this, serializerKey?.toString());
        if (!serializerClass)
            throw new missing_serializers_definition_1.default(this.constructor);
        const serializer = new serializerClass(this);
        if (casing)
            serializer.casing(casing);
        return serializer.render();
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
    assignAttributes(attributes) {
        return this._setAttributes(attributes, { bypassUserDefinedSetters: false });
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
    setAttributes(attributes) {
        return this._setAttributes(attributes, { bypassUserDefinedSetters: true });
    }
    _setAttributes(attributes, additionalOpts = {}) {
        const dreamClass = this.constructor;
        const marshalledOpts = dreamClass.extractAttributesFromUpdateableProperties(attributes, this, additionalOpts);
        return marshalledOpts;
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
    async save({ skipHooks } = {}) {
        await (0, saveDream_1.default)(this, null, { skipHooks });
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
    txn(txn) {
        return new instance_transaction_builder_1.default(this, txn);
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
    async update(attributes, { skipHooks } = {}) {
        // use #assignAttributes to leverage any custom-defined setters
        this.assignAttributes(attributes);
        await this.save({ skipHooks });
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
    async updateAttributes(attributes, { skipHooks } = {}) {
        // use #setAttributes to bypass any custom-defined setters
        this.setAttributes(attributes);
        await this.save({ skipHooks });
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
    preventDeletion() {
        this._preventDeletion = true;
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
    unpreventDeletion() {
        this._preventDeletion = false;
        return this;
    }
}
_a = Dream;
/**
 * @internal
 *
 * Model storage for association metadata, set when using the association decorators like:
 *   @ModelName.HasOne
 *   @ModelName.HasMany
 *   @ModelName.BelongsTo
 */
Dream.associationMetadataByType = (0, shared_1.blankAssociationsFactory)(_a);
/**
 * @internal
 *
 * Model storage for scope metadata, set when using the @Scope decorator
 */
Dream.scopes = {
    default: [],
    named: [],
};
/**
 * @internal
 *
 * Model storage for virtual attribute metadata, set when using the @Virtual decorator
 */
Dream.virtualAttributes = [];
/**
 * @internal
 *
 * Model storage for sortable metadata, set when using the @Sortable decorator
 */
Dream.sortableFields = [];
/**
 * @internal
 *
 * Model storage for STI metadata, set when using the @STI decorator
 */
Dream.extendedBy = null;
/**
 * @internal
 *
 * Model storage for STI metadata, set when using the @STI decorator
 */
Dream.sti = {
    active: false,
    baseClass: null,
    value: null,
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
Dream.hooks = (0, shared_2.blankHooksFactory)(_a);
/**
 * @internal
 *
 * Model storage for validation metadata, set when using the @Validates decorator
 */
Dream.validations = [];
/**
 * @internal
 *
 * model storage for custom validation metadata, set when using the @Validate decorator
 */
Dream.customValidations = [];
/**
 * @internal
 *
 * Model storage for replica-safe metadata, set when using the @ReplicaSafe decorator
 */
Dream.replicaSafe = false;
/**
 * @internal
 *
 * Model storage for soft-delete metadata, set when using the @SoftDelete decorator
 */
Dream.softDelete = false;
exports.default = Dream;
