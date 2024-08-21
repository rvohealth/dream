"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const associationQuery_1 = __importDefault(require("./internal/associations/associationQuery"));
const associationUpdateQuery_1 = __importDefault(require("./internal/associations/associationUpdateQuery"));
const createAssociation_1 = __importDefault(require("./internal/associations/createAssociation"));
const destroyAssociation_1 = __importDefault(require("./internal/associations/destroyAssociation"));
const undestroyAssociation_1 = __importDefault(require("./internal/associations/undestroyAssociation"));
const destroyDream_1 = __importDefault(require("./internal/destroyDream"));
const destroyOptions_1 = require("./internal/destroyOptions");
const reload_1 = __importDefault(require("./internal/reload"));
const saveDream_1 = __importDefault(require("./internal/saveDream"));
const scopeHelpers_1 = require("./internal/scopeHelpers");
const undestroyDream_1 = __importDefault(require("./internal/undestroyDream"));
const load_builder_1 = __importDefault(require("./load-builder"));
class DreamInstanceTransactionBuilder {
    constructor(dreamInstance, txn) {
        this.dreamInstance = dreamInstance;
        this.dreamTransaction = txn;
    }
    /**
     * Plucks the specified fields from the join Query,
     * scoping the query to the model instance's primary
     * key.
     *
     * ```ts
     *
     * await ApplicationModel.transaction(async txn => {
     *   const user = await User.txn(txn).first()
     *   await user.txn(txn).pluckThrough(
     *     'posts',
     *     { createdAt: range(CalendarDate.yesterday()) },
     *     'comments',
     *     'replies',
     *     'replies.body'
     *   )
     * })
     * // ['loved it!', 'hated it :(']
     * ```
     *
     * If more than one column is requested, a multi-dimensional
     * array is returned:
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   const user = await User.txn(txn).first()
     *   await user.txn(txn).pluckThrough(
     *     'posts',
     *     { createdAt: range(CalendarDate.yesterday()) },
     *     'comments',
     *     'replies',
     *     ['replies.body', 'replies.numLikes']
     *   )
     * })
     * // [['loved it!', 1], ['hated it :(', 3]]
     * ```
     *
     * @param args - A chain of association names and where clauses ending with the column or array of columns to pluck
     * @returns An array of pluck results
     */
    async pluckThrough(...args) {
        return this.queryInstance().pluckThrough(...args);
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
     *
     * await ApplicationModel.transaction(async txn => {
     *   await user.txn(txn).pluckEachThrough(
     *     'posts',
     *     { createdAt: range(CalendarDate.yesterday()) },
     *     'comments',
     *     'replies',
     *     ['replies.body', 'replies.numLikes'],
     *     ([body, numLikes]) => {
     *       console.log({ body, numLikes })
     *     }
     *   )
     *
     *   // { body: 'loved it!', numLikes: 2 }
     *   // { body: 'hated it :(', numLikes: 0 }
     *   })
     * ```
     *
     * @param args - A chain of association names and where clauses ending with the column or array of columns to pluck and the callback function
     * @returns void
     */
    async pluckEachThrough(...args) {
        return this.queryInstance().pluckEachThrough(...args);
    }
    /**
     * Join through associations, with optional where clauses,
     * and return the minimum value for the specified column
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   const firstPostId = await user.txn(txn).minThrough('posts', { createdAt: range(start) }, 'posts.rating')
     * })
     * // 2.5
     * ```
     *
     * @param args - A chain of association names and where clauses ending with the column to min
     * @returns the min value of the specified column for the nested association's records
     */
    async minThrough(...args) {
        return (await this.queryInstance().minThrough(...args));
    }
    /**
     * Join through associations, with optional where clauses,
     * and return the maximum value for the specified column
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   const firstPostId = await user.txn(txn).maxThrough('posts', { createdAt: range(start) }, 'posts.rating')
     * })
     * // 4.8
     * ```
     *
     * @param args - A chain of association names and where clauses ending with the column to max
     * @returns the max value of the specified column for the nested association's records
     */
    async maxThrough(...args) {
        return (await this.queryInstance().maxThrough(...args));
    }
    /**
     * Retrieves the number of records matching
     * the given query.
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await user.txn(txn).where({ email: null }).countThrough('posts', 'comments', { body: null })
     *   // 42
     * })
     * ```
     *
     * @param args - A chain of association names and where clauses
     * @returns the number of records found matching the given parameters
     */
    async countThrough(...args) {
        return await this.queryInstance().countThrough(...args);
    }
    /**
     * Loads the requested associations upon execution
     *
     * NOTE: Preload is often a preferrable way of achieving the
     * same goal.
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await user
     *    .txn(txn)
     *    .load('posts', { body: ops.ilike('%hello world%') }, 'comments', 'replies')
     *    .load('images')
     *    .execute()
     *
     *   user.posts[0].comments[0].replies[0]
     *   // Reply{}
     *
     *   user.images[0]
     *   // Image{}
     * })
     * ```
     *
     * @param args - A list of associations (and optional where clauses) to load
     * @returns A chainable LoadBuilder instance
     */
    load(...args) {
        return new load_builder_1.default(this.dreamInstance, this.dreamTransaction).load(...args);
    }
    /**
     * Deletes the record represented by this instance
     * from the database, calling any destroy
     * hooks on this model.
     *
     * ```ts
     * const user = await User.last()
     * await ApplicationModel.transaction(async txn => {
     *   await user.txn(txn).destroy()
     * })
     * ```
     *
     * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
     * @param opts.cascade - if false, will skip applying cascade deletes on "dependent: 'destroy'" associations. Defaults to true
     * @returns the instance that was destroyed
     */
    async destroy(options = {}) {
        return await (0, destroyDream_1.default)(this.dreamInstance, this.dreamTransaction, (0, destroyOptions_1.destroyOptions)(options));
    }
    /**
     * Deletes the record represented by this instance
     * from the database, calling any destroy
     * hooks on this model.
     *
     * ```ts
     * const user = await User.last()
     * await ApplicationModel.transaction(async txn => {
     *   await user.txn(txn).reallyDestroy()
     * })
     * ```
     *
     * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
     * @param opts.cascade - if false, will skip applying cascade deletes on "dependent: 'destroy'" associations. Defaults to true
     * @returns the instance that was destroyed
     */
    async reallyDestroy(options = {}) {
        return await (0, destroyDream_1.default)(this.dreamInstance, this.dreamTransaction, (0, destroyOptions_1.reallyDestroyOptions)(options));
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
     * @returns The number of records that were removed
     */
    async undestroy(options = {}) {
        await (0, undestroyDream_1.default)(this.dreamInstance, this.dreamTransaction, (0, destroyOptions_1.undestroyOptions)(options));
        await this.reload();
        return this;
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
     *  await ApplicationModel.transaction(async txn => {
     *    await user.txn(txn).update({ email: 'sally@gmail.com' })
     *  })
     * ```
     *
     * @param attributes - the attributes to set on the model
     * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
     * @returns void
     */
    async update(attributes, { skipHooks } = {}) {
        this.dreamInstance.assignAttributes(attributes);
        await (0, saveDream_1.default)(this.dreamInstance, this.dreamTransaction, { skipHooks });
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
     *  await ApplicationModel.transaction(async txn => {
     *    await user.txn(txn).updateAttributes({ email: 'sally@gmail.com' })
     *  })
     * ```
     *
     * @param attributes - The attributes to update on this instance
     * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
     * @returns - void
     */
    async updateAttributes(attributes, { skipHooks } = {}) {
        this.dreamInstance.setAttributes(attributes);
        await (0, saveDream_1.default)(this.dreamInstance, this.dreamTransaction, { skipHooks });
    }
    /**
     * Reloads an instance, refreshing all it's attribute values
     * to those in the database.
     *
     * NOTE: this does not refresh associations
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await user.txn(txn).reload()
     * })
     * ```
     *
     * @returns void
     */
    async reload() {
        await (0, reload_1.default)(this.dreamInstance, this.dreamTransaction);
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
     *
     * await ApplicationModel.transaction(async txn => {
     *   user.name = 'fred'
     *   await user.txn(txn).save()
     * })
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
        await (0, saveDream_1.default)(this.dreamInstance, this.dreamTransaction, { skipHooks });
    }
    /**
     * Returns a Query instance for the specified
     * association on the current instance.
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await user.txn(txn).associationQuery('posts').all()
     *   // only user posts returned
     * })
     * ```
     *
     * @returns A Query scoped to the specified association on the current instance
     */
    associationQuery(associationName) {
        return (0, associationQuery_1.default)(this.dreamInstance, this.dreamTransaction, associationName, {
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
     * await ApplicationModel.transaction(async txn => {
     *   await user.txn(txn).createAssociation('posts', { body: 'hello world' })
     *   await user.txn(txn).createAssociation('posts', { body: 'howyadoin' })
     *   await user.txn(txn).updateAssociation('posts', { body: 'goodbye world' }, { where: { body: 'hello world' }})
     *   // 1
     * })
     * ```
     *
     * @returns The number of updated records
     */
    async updateAssociation(associationName, attributes, updateAssociationOptions) {
        return await (0, associationUpdateQuery_1.default)(this.dreamInstance, this.dreamTransaction, associationName, {
            associationWhereStatement: updateAssociationOptions?.where,
            bypassAllDefaultScopes: updateAssociationOptions?.bypassAllDefaultScopes ?? scopeHelpers_1.DEFAULT_BYPASS_ALL_DEFAULT_SCOPES,
            defaultScopesToBypass: updateAssociationOptions?.defaultScopesToBypass ?? scopeHelpers_1.DEFAULT_DEFAULT_SCOPES_TO_BYPASS,
        }).update(attributes, { skipHooks: updateAssociationOptions?.skipHooks ?? scopeHelpers_1.DEFAULT_SKIP_HOOKS });
    }
    /**
     * Creates an association for an instance. Automatically
     * handles setting foreign key and, in the case of polymorphism,
     * foreign key type.
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await user.txn(txn).createAssociation('posts', { body: 'hello world' })
     * })
     * ```
     *
     * @param associationName - the name of the association to create
     * @param attributes - the attributes with which to create the associated model
     * @returns The created association
     */
    async createAssociation(associationName, opts = {}) {
        return await (0, createAssociation_1.default)(this.dreamInstance, this.dreamTransaction, associationName, opts);
    }
    /**
     * Destroys models associated with the current instance,
     * deleting their corresponding records within the database.
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await user.txn(txn).destroyAssociation('posts', { body: 'hello world' })
     * })
     * ```
     *
     * @param associationName - The name of the association to destroy
     * @param opts.whereStatement - Optional where statement to apply to query before destroying
     * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
     * @param opts.cascade - if false, will skip applying cascade undeletes on "dependent: 'destroy'" associations. Defaults to true
     * @returns The number of records deleted
     */
    async destroyAssociation(associationName, options) {
        return await (0, destroyAssociation_1.default)(this.dreamInstance, this.dreamTransaction, associationName, {
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
     * await ApplicationModel.transaction(async txn => {
     *   await user.txn(txn).reallyDestroyAssociation('posts', { body: 'hello world' })
     * })
     * ```
     *
     * @param associationName - The name of the association to destroy
     * @param opts.whereStatement - Optional where statement to apply to query before destroying
     * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
     * @param opts.cascade - if false, will skip applying cascade undeletes on "dependent: 'destroy'" associations. Defaults to true
     * @returns The number of records deleted
     */
    async reallyDestroyAssociation(associationName, options) {
        return await (0, destroyAssociation_1.default)(this.dreamInstance, this.dreamTransaction, associationName, {
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
     * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
     * @param opts.cascade - if false, will skip applying cascade undeletes on "dependent: 'destroy'" associations. Defaults to true
     * @returns The number of records undestroyed
     */
    async undestroyAssociation(associationName, options) {
        return await (0, undestroyAssociation_1.default)(this.dreamInstance, this.dreamTransaction, associationName, {
            ...(0, destroyOptions_1.undestroyOptions)(options),
            associationWhereStatement: options?.where,
        });
    }
    ///////////////////
    // end: undestroyAssociation
    ///////////////////
    /**
     * @internal
     *
     * returns a query instance, scoped to the current
     * dream instance with primary key where statement
     * automatically applied.
     */
    queryInstance() {
        const dreamClass = this.dreamInstance.constructor;
        const id = this.dreamInstance.primaryKeyValue;
        return dreamClass.txn(this.dreamTransaction).where({ [this.dreamInstance.primaryKey]: id });
    }
}
exports.default = DreamInstanceTransactionBuilder;
