"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const saveDream_1 = __importDefault(require("./internal/saveDream"));
const query_1 = __importDefault(require("./query"));
class DreamClassTransactionBuilder {
    constructor(dreamInstance, dreamTransaction) {
        this.dreamInstance = dreamInstance;
        this.dreamTransaction = dreamTransaction;
    }
    /**
     * Retrieves an array containing all records corresponding to
     * this model. Be careful using this, since it will attempt to
     * pull every record into memory at once. For a large number
     * of records, consider using `.findEach`, which will pull
     * the records in batches.
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).all()
     * })
     * ```
     *
     * @returns an array of dreams
     */
    async all() {
        return this.queryInstance().all();
    }
    /**
     * Retrieves the number of records corresponding
     * to this model.
     *
     * @returns The number of records corresponding to this model
     */
    async count() {
        return this.queryInstance().count();
    }
    /**
     * Returns a new Query instance, specifying a limit
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).limit(2).all()
     *   // [User{}, User{}]
     * })
     * ```
     *
     * @returns A Query for this model with the limit clause applied
     */
    limit(limit) {
        return this.queryInstance().limit(limit);
    }
    /**
     * Returns a new Query instance, specifying an offset
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).order('id').limit(2).all()
     *   // [User{id: 3}, User{id: 4}]
     * })
     * ```
     *
     * @returns A Query for this model with the offset clause applied
     */
    offset(offset) {
        return this.queryInstance().offset(offset);
    }
    /**
     * Retrieves the max value of the specified column
     * for this model's records.
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).max('id')
     *   // 99
     * })
     * ```
     *
     * @param columnName - a column name on the model
     * @returns the max value of the specified column for this model's records
     */
    async max(columnName) {
        return this.queryInstance().max(columnName);
    }
    /**
     * Retrieves the min value of the specified column
     * for this model's records.
     *
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).min('id')
     *   // 1
     * })
     * ```
     *
     * @param columnName - a column name on the model
     * @returns the min value of the specified column for this model's records
     */
    async min(columnName) {
        return this.queryInstance().min(columnName);
    }
    /**
     * Persists a new record, setting the provided attributes
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   const user = await User.txn(txn).create({ email: 'how@yadoin' })
     *   await Post.txn(txn).create({ body: 'howdy', user })
     * })
     * ```
     *
     * @param attributes - attributes or belongs to associations you wish to set on this model before persisting
     * @returns A newly persisted dream instance
     */
    async create(opts) {
        const dream = this.dreamInstance.constructor.new(opts);
        return (0, saveDream_1.default)(dream, this.dreamTransaction);
    }
    /**
     * Finds a record for the corresponding model with the
     * specified primary key. If not found, null
     * is returned
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).find(123)
     *   // User{id: 123}
     * })
     * ```
     *
     * @param primaryKey - The primaryKey of the record to look up
     * @returns Either the found record, or else null
     */
    async find(id) {
        return await this.queryInstance()
            .where({ [this.dreamInstance.primaryKey]: id })
            .first();
    }
    /**
     * Finds a record for the corresponding model with the
     * specified primary key. If not found, an exception is raised.
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.query().txn(txn).findOrFail(123)
     * })
     * // User{id: 123}
     * ```
     *
     * @param primaryKey - The primaryKey of the record to look up
     * @returns The found record
     */
    async findOrFail(primaryKey) {
        return await this.queryInstance().findOrFail(primaryKey);
    }
    /**
     * Finds the first record—ordered by primary key—matching
     * the corresponding model and the specified where statement.
     * If not found, null is returned.
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).findBy({ email: 'how@yadoin' })
     *   // User{email: 'how@yadoin'}
     * })
     * ```
     *
     * @param whereStatement - The where statement used to locate the record
     * @returns Either the first model found matching the whereStatement, or else null
     */
    async findBy(attributes) {
        return await this.queryInstance()
            .where(attributes)
            .first();
    }
    /**
     * Finds the first record—ordered by primary key—matching
     * the corresponding model and the specified where statement.
     * If not found, an exception is raised.
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).findOrFailBy({ email: 'how@yadoin' })
     * })
     * // User{email: 'how@yadoin'}
     * ```
     *
     * @param whereStatement - The where statement used to locate the record
     * @returns The first model found matching the whereStatement
     */
    async findOrFailBy(whereStatement) {
        return await this.queryInstance().findOrFailBy(whereStatement);
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
     * await ApplicationModel.transaction(async txn => {
     *   await User.findEach(user => {
     *     console.log(user)
     *   })
     * })
     * // User{email: 'hello@world'}
     * // User{email: 'goodbye@world'}
     * ```
     *
     * @param cb - The callback to call for each found record
     * @param opts.batchSize - the batch size you wish to collect records in. If not provided, it will default to 1000
     * @returns void
     */
    async findEach(cb, opts) {
        await this.queryInstance().findEach(cb, opts);
    }
    /**
     * Returns the first record corresponding to the
     * model, ordered by primary key.
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).first()
     *   // User{id: 1}
     * })
     * ```
     *
     * @returns First record, or null if no record exists
     */
    async first() {
        return this.queryInstance().first();
    }
    /**
     * Returns the first record corresponding to the
     * model, ordered by primary key. If no record
     * is found, an exception is raised.
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).firstOrFail()
     *   // User{id: 1}
     * })
     * ```
     *
     * @returns First record
     */
    async firstOrFail() {
        return this.queryInstance().firstOrFail();
    }
    /**
     * Returns true if a record exists for the given
     * model class
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).exists()
     *   // false
     *
     *   await User.txn(txn).create({ email: 'how@yadoin' })
     *
     *   await User.txn(txn).exists()
     *   // true
     * })
     * ```
     *
     * @returns boolean
     */
    async exists() {
        return this.queryInstance().exists();
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
     * await ApplicationModel.transaction(async txn => {
     *   const user = await User.txn(txn).preload('posts', 'comments', { visibilty: 'public' }, 'replies').first()
     *   console.log(user.posts[0].comments[0].replies)
     *   // [Reply{id: 1}, Reply{id: 2}]
     * })
     * ```
     *
     * @param args - A chain of associaition names and where clauses
     * @returns A query for this model with the preload statement applied
     */
    preload(...args) {
        return this.queryInstance().preload(...args);
    }
    /**
     * Returns a new Query instance with the provided
     * joins statement attached
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).joins('posts').first()
     * })
     * ```
     *
     * @param args - A chain of associaition names and where clauses
     * @returns A Query for this model with the joins clause applied
     */
    joins(...args) {
        return this.queryInstance().joins(...args);
    }
    /**
     * Returns a new instance of Query scoped to the given
     * model class
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   const query = User.txn(txn).queryInstance()
     * })
     * ```
     *
     * @returns A new Query instance
     */
    queryInstance() {
        return new query_1.default(this.dreamInstance).txn(this.dreamTransaction);
    }
    /**
     * Returns a query for this model which disregards default scopes
     *
     * @returns A query for this model which disregards default scopes
     */
    removeAllDefaultScopes() {
        return this.queryInstance().removeAllDefaultScopes();
    }
    /**
     * Prevents a specific default scope from applying when
     * the Query is executed
     *
     * @returns A new Query which will prevent a specific default scope from applying
     */
    removeDefaultScope(scopeName) {
        return this.queryInstance().removeDefaultScope(scopeName);
    }
    /**
     * Returns the last record corresponding to the
     * model, ordered by primary key.
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).last()
     *   // User{id: 99}
     * })
     * ```
     *
     * @returns Last record, or null if no record exists
     */
    async last() {
        return this.queryInstance().last();
    }
    /**
     * Returns the last record corresponding to the
     * model, ordered by primary key. If no record
     * is found, an exception is raised.
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).lastOrFail()
     *   // User{id: 99}
     * })
     * ```
     *
     * @returns Last record
     */
    async lastOrFail() {
        return this.queryInstance().lastOrFail();
    }
    /**
     * Returns a new Kysely SelectQueryBuilder instance to be used
     * in a sub Query
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).where({
     *     id: Post.txn(txn).nestedSelect('userId'),
     *   }).all()
     *   // [User{id: 1}, ...]
     * })
     * ```
     *
     * @param selection - the column to use for your nested Query
     * @returns A Kysely SelectQueryBuilder instance
     */
    nestedSelect(selection) {
        return this.queryInstance().nestedSelect(selection);
    }
    /**
     * Returns a new Query instance, attaching the provided
     * order statement
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).order('id').all()
     *   // [User{id: 1}, User{id: 2}, ...]
     * })
     * ```
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).order({ name: 'asc', id: 'desc' }).all()
     *   // [User{name: 'a', id: 99}, User{name: 'a', id: 97}, User{ name: 'b', id: 98 } ...]
     * })
     * ```
     *
     * @param orderStatement - Either a string or an object specifying order. If a string, the order is implicitly ascending. If the orderStatement is an object, statements will be provided in the order of the keys set in the object
     * @returns A query for this model with the order clause applied
     */
    order(arg) {
        return this.queryInstance().order(arg);
    }
    /**
     * Plucks the provided fields from the corresponding model
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).pluck('id')
     *   // [1, 3, 2]
     * })
     * ```
     *
     * If more than one column is requested, a multi-dimensional
     * array is returned:
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).order('id').pluck('id', 'email')
     *   // [[1, 'a@a.com'], [2, 'b@b.com']]
     * })
     * ```
     *
     * @param fields - The column or array of columns to pluck
     * @returns An array of pluck results
     */
    async pluck(...fields) {
        return await this.queryInstance().pluck(...fields);
    }
    /**
     * Plucks the specified fields from the given dream class table
     * in batches, passing each found columns into the
     * provided callback function
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).order('id').pluckEach('id', (id) => {
     *     console.log(id)
     *   })
     *   // 1
     *   // 2
     *   // 3
     * })
     * ```
     *
     * @param fields - a list of fields to pluck, followed by a callback function to call for each set of found fields
     * @returns void
     */
    async pluckEach(...fields) {
        await this.queryInstance().pluckEach(...fields);
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
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).passthrough({ locale: 'es-ES' })
     *     .preload('posts', 'currentLocalizedText')
     *     .first()
     * })
     * ```
     *
     * @param passthroughWhereStatement - Where statement used for associations that require passthrough data
     * @returns A Query for this model with the passthrough data
     */
    passthrough(passthroughWhereStatement) {
        return this.queryInstance().passthrough(passthroughWhereStatement);
    }
    /**
     * Applies a where statement to a new Query instance
     * scoped to this model
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).where({ email: 'how@yadoin' }).first()
     *   // User{email: 'how@yadoin'}
     * })
     * ```
     *
     * @param whereStatement - Where statement to apply to the Query
     * @returns A Query for this model with the where clause applied
     */
    where(attributes) {
        return this.queryInstance().where(attributes);
    }
    /**
     * Applies "OR"'d where statements to a Query scoped
     * to this model.
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).whereAny([{ email: 'how@yadoin' }, { name: 'fred' }]).first()
     *   // [User{email: 'how@yadoin'}, User{name: 'fred'}, User{name: 'fred'}]
     * })
     * ```
     *
     * @param whereStatements - a list of where statements to `OR` together
     * @returns A Query for this model with the whereAny clause applied
     */
    whereAny(attributes) {
        return this.queryInstance().whereAny(attributes);
    }
    /**
     * Applies a whereNot statement to a new Query instance
     * scoped to this model.
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.txn(txn).whereNot({ email: 'how@yadoin' }).first()
     *   // User{email: 'hello@world'}
     * })
     * ```
     *
     * @param whereStatement - A where statement to negate and apply to the Query
     * @returns A Query for this model with the whereNot clause applied
     */
    whereNot(attributes) {
        return this.queryInstance().whereNot(attributes);
    }
}
exports.default = DreamClassTransactionBuilder;
