"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const kysely_1 = require("kysely");
const lodash_isempty_1 = __importDefault(require("lodash.isempty"));
const luxon_1 = require("luxon");
const pluralize_1 = require("pluralize");
const ConnectedToDB_1 = __importDefault(require("../db/ConnectedToDB"));
const associationToGetterSetterProp_1 = __importDefault(require("../decorators/associations/associationToGetterSetterProp"));
const soft_delete_1 = require("../decorators/soft-delete");
const cannot_associate_through_polymorphic_1 = __importDefault(require("../exceptions/associations/cannot-associate-through-polymorphic"));
const cannot_join_polymorphic_belongs_to_error_1 = __importDefault(require("../exceptions/associations/cannot-join-polymorphic-belongs-to-error"));
const join_attempted_with_missing_association_1 = __importDefault(require("../exceptions/associations/join-attempted-with-missing-association"));
const missing_required_association_where_clause_1 = __importDefault(require("../exceptions/associations/missing-required-association-where-clause"));
const missing_required_passthrough_for_association_where_clause_1 = __importDefault(require("../exceptions/associations/missing-required-passthrough-for-association-where-clause"));
const missing_through_association_1 = __importDefault(require("../exceptions/associations/missing-through-association"));
const missing_through_association_source_1 = __importDefault(require("../exceptions/associations/missing-through-association-source"));
const cannot_call_undestroy_on_a_non_soft_delete_model_1 = __importDefault(require("../exceptions/cannot-call-undestroy-on-a-non-soft-delete-model"));
const cannot_negate_similarity_clause_1 = __importDefault(require("../exceptions/cannot-negate-similarity-clause"));
const cannot_pass_additional_fields_to_pluck_each_after_callback_function_1 = __importDefault(require("../exceptions/cannot-pass-additional-fields-to-pluck-each-after-callback-function"));
const missing_required_callback_function_to_pluck_each_1 = __importDefault(require("../exceptions/missing-required-callback-function-to-pluck-each"));
const no_updateall_on_association_query_1 = __importDefault(require("../exceptions/no-updateall-on-association-query"));
const no_updateall_on_joins_1 = __importDefault(require("../exceptions/no-updateall-on-joins"));
const record_not_found_1 = __importDefault(require("../exceptions/record-not-found"));
const CalendarDate_1 = __importDefault(require("../helpers/CalendarDate"));
const allNestedObjectKeys_1 = require("../helpers/allNestedObjectKeys");
const cloneDeepSafe_1 = __importDefault(require("../helpers/cloneDeepSafe"));
const compact_1 = __importDefault(require("../helpers/compact"));
const marshalDBValue_1 = require("../helpers/marshalDBValue");
const protectAgainstPollutingAssignment_1 = __importDefault(require("../helpers/protectAgainstPollutingAssignment"));
const range_1 = require("../helpers/range");
const snakeify_1 = __importDefault(require("../helpers/snakeify"));
const typechecks_1 = require("../helpers/typechecks");
const ops_1 = __importDefault(require("../ops"));
const curried_ops_statement_1 = __importDefault(require("../ops/curried-ops-statement"));
const ops_statement_1 = __importDefault(require("../ops/ops-statement"));
const load_into_models_1 = __importDefault(require("./internal/associations/load-into-models"));
const executeDatabaseQuery_1 = __importDefault(require("./internal/executeDatabaseQuery"));
const extractValueFromJoinsPluckResponse_1 = require("./internal/extractValueFromJoinsPluckResponse");
const orderByDirection_1 = __importDefault(require("./internal/orderByDirection"));
const shouldBypassDefaultScope_1 = __importDefault(require("./internal/shouldBypassDefaultScope"));
const SimilarityBuilder_1 = __importDefault(require("./internal/similarity/SimilarityBuilder"));
const sqlResultToDreamInstance_1 = __importDefault(require("./internal/sqlResultToDreamInstance"));
const types_1 = require("./types");
const OPERATION_NEGATION_MAP = {
    '=': '!=',
    '==': '!=',
    '!=': '=',
    '<>': '=',
    '>': '<=',
    '>=': '<',
    '<': '>=',
    '<=': '>',
    in: 'not in',
    'not in': 'in',
    is: 'is not',
    'is not': 'is',
    like: 'not like',
    'not like': 'like',
    // 'match',
    ilike: 'not ilike',
    'not ilike': 'ilike',
    // '@>',
    // '<@',
    // '?',
    // '?&',
    '!<': '<',
    '!>': '>',
    // '<=>',
    '!~': '~',
    '~': '!~',
    '~*': '!~*',
    '!~*': '~*',
    // '@@',
    // '@@@',
    // '!!',
    // '<->',
};
class Query extends ConnectedToDB_1.default {
    constructor(dreamInstance, opts = {}) {
        super(dreamInstance, opts);
        /**
         * @internal
         *
         * stores the dream transaction applied to the
         * current Query instance
         */
        this.dreamTransaction = null;
        /**
         * @internal
         *
         * stores the passthrough where statements applied to the
         * current Query instance
         */
        this.passthroughWhereStatement = Object.freeze({});
        /**
         * @internal
         *
         * stores the where statements applied to the
         * current Query instance
         */
        this.whereStatements = Object.freeze([]);
        /**
         * @internal
         *
         * stores the where not statements applied to the
         * current Query instance
         */
        this.whereNotStatements = Object.freeze([]);
        /**
         * @internal
         *
         * stores the or statements applied to the
         * current Query instance
         */
        this.orStatements = Object.freeze([]);
        /**
         * @internal
         *
         * stores the order statements applied to the
         * current Query instance
         */
        this.orderStatements = Object.freeze([]);
        /**
         * @internal
         *
         * stores the preload statements applied to the
         * current Query instance
         */
        this.preloadStatements = Object.freeze({});
        /**
         * @internal
         *
         * stores the preload where statements applied to the
         * current Query instance
         */
        this.preloadWhereStatements = Object.freeze({});
        /**
         * @internal
         *
         * stores the joins statements applied to the
         * current Query instance
         */
        this.joinsStatements = Object.freeze({});
        /**
         * @internal
         *
         * stores the joins where statements applied to the
         * current Query instance
         */
        this.joinsWhereStatements = Object.freeze({});
        /**
         * @internal
         *
         * Whether or not to bypass all default scopes for this Query
         */
        this.bypassAllDefaultScopes = false;
        /**
         * @internal
         *
         * Whether or not to bypass all default scopes for this Query, but not associations
         */
        this.bypassAllDefaultScopesExceptOnAssociations = false;
        /**
         * @internal
         *
         * Specific default scopes to bypass
         */
        this.defaultScopesToBypass = [];
        /**
         * @internal
         *
         * Specific default scopes to bypass, but not associations
         */
        this.defaultScopesToBypassExceptOnAssociations = [];
        /**
         * @internal
         *
         * Whether or not to bypass SoftDelete and really destroy a record
         * when calling destroy.
         */
        this.shouldReallyDestroy = false;
        /**
         * @internal
         *
         * The distinct column to apply to the Query
         */
        this.distinctColumn = null;
        this.passthroughWhereStatement = Object.freeze(opts.passthroughWhereStatement || {});
        this.whereStatements = Object.freeze(opts.where || []);
        this.whereNotStatements = Object.freeze(opts.whereNot || []);
        this.orStatements = Object.freeze(opts.or || []);
        this.orderStatements = Object.freeze(opts.order || []);
        this.preloadStatements = Object.freeze(opts.preloadStatements || {});
        this.preloadWhereStatements = Object.freeze(opts.preloadWhereStatements || {});
        this.joinsStatements = Object.freeze(opts.joinsStatements || {});
        this.joinsWhereStatements = Object.freeze(opts.joinsWhereStatements || {});
        this.baseSqlAlias = opts.baseSqlAlias || this.dreamInstance['table'];
        this.baseSelectQuery = opts.baseSelectQuery || null;
        this.limitStatement = opts.limit || null;
        this.offsetStatement = opts.offset || null;
        this.bypassAllDefaultScopes = opts.bypassAllDefaultScopes || false;
        this.bypassAllDefaultScopesExceptOnAssociations = opts.bypassAllDefaultScopesExceptOnAssociations || false;
        this.defaultScopesToBypass = opts.defaultScopesToBypass || [];
        this.defaultScopesToBypassExceptOnAssociations = opts.defaultScopesToBypassExceptOnAssociations || [];
        this.dreamTransaction = opts.transaction || null;
        this.distinctColumn = opts.distinctColumn || null;
        this.connectionOverride = opts.connection;
        this.shouldReallyDestroy = opts.shouldReallyDestroy || false;
    }
    /**
     * Returns true. Useful for distinguishing Query instances
     * from other objects.
     *
     * @returns true
     */
    get isDreamQuery() {
        return true;
    }
    /**
     * @internal
     *
     * Used for applying preload and load statements
     *
     * @returns An associated Query
     */
    dreamClassQueryWithScopeBypasses(dreamClass, { bypassAllDefaultScopesExceptOnAssociations = false, defaultScopesToBypassExceptOnAssociations = [], } = {}) {
        const associationQuery = dreamClass.query().clone({
            passthroughWhereStatement: this.passthroughWhereStatement,
            bypassAllDefaultScopes: this.bypassAllDefaultScopes,
            bypassAllDefaultScopesExceptOnAssociations,
            defaultScopesToBypass: this.defaultScopesToBypass,
            defaultScopesToBypassExceptOnAssociations,
        });
        return this.dreamTransaction ? associationQuery.txn(this.dreamTransaction) : associationQuery;
    }
    /**
     * @internal
     *
     * Returns a cloned version of the Query
     *
     * ```ts
     * const clonedQuery = User.query().clone()
     * ```
     *
     * @param opts - Statements to override when cloning the Query
     * @returns A cloned Query with the provided overrides clause applied
     */
    clone(opts = {}) {
        return new Query(this.dreamInstance, {
            baseSqlAlias: opts.baseSqlAlias || this.baseSqlAlias,
            baseSelectQuery: opts.baseSelectQuery || this.baseSelectQuery,
            passthroughWhereStatement: Object.freeze({
                ...this.passthroughWhereStatement,
                ...(opts.passthroughWhereStatement || {}),
            }),
            where: opts.where === null ? [] : Object.freeze([...this.whereStatements, ...(opts.where || [])]),
            whereNot: opts.whereNot === null ? [] : Object.freeze([...this.whereNotStatements, ...(opts.whereNot || [])]),
            limit: opts.limit === null ? null : opts.limit !== undefined ? opts.limit : this.limitStatement || null,
            offset: opts.limit === null || opts.offset === null
                ? null
                : opts.offset !== undefined
                    ? opts.offset
                    : this.offsetStatement || null,
            or: opts.or === null ? [] : [...this.orStatements, ...(opts.or || [])],
            order: opts.order === null ? [] : [...this.orderStatements, ...(opts.order || [])],
            distinctColumn: opts.distinctColumn !== undefined ? opts.distinctColumn : this.distinctColumn,
            // when passed, preloadStatements, preloadWhereStatements, joinsStatements, and joinsWhereStatements are already
            // cloned versions of the `this.` versions, handled in the `preload` and `joins` methods
            preloadStatements: opts.preloadStatements || this.preloadStatements,
            preloadWhereStatements: opts.preloadWhereStatements || this.preloadWhereStatements,
            joinsStatements: opts.joinsStatements || this.joinsStatements,
            joinsWhereStatements: opts.joinsWhereStatements || this.joinsWhereStatements,
            // end:when passed, preloadStatements, preloadWhereStatements, joinsStatements, and joinsWhereStatements are already...
            bypassAllDefaultScopes: opts.bypassAllDefaultScopes !== undefined ? opts.bypassAllDefaultScopes : this.bypassAllDefaultScopes,
            bypassAllDefaultScopesExceptOnAssociations: opts.bypassAllDefaultScopesExceptOnAssociations !== undefined
                ? opts.bypassAllDefaultScopesExceptOnAssociations
                : this.bypassAllDefaultScopesExceptOnAssociations,
            defaultScopesToBypass: opts.defaultScopesToBypass !== undefined ? opts.defaultScopesToBypass : this.defaultScopesToBypass,
            defaultScopesToBypassExceptOnAssociations: opts.defaultScopesToBypassExceptOnAssociations !== undefined
                ? opts.defaultScopesToBypassExceptOnAssociations
                : this.defaultScopesToBypassExceptOnAssociations,
            transaction: opts.transaction || this.dreamTransaction,
            connection: opts.connection,
            shouldReallyDestroy: opts.shouldReallyDestroy !== undefined ? opts.shouldReallyDestroy : this.shouldReallyDestroy,
        });
    }
    /**
     * Finds a record matching the Query with the
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
    async find(primaryKey) {
        if (!primaryKey)
            return null;
        return await this.where({
            [this.dreamInstance.primaryKey]: primaryKey,
        }).first();
    }
    /**
     * Finds a record matching the Query with the
     * specified primary key. If not found, an exception
     * is raised.
     *
     * ```ts
     * await User.query().findOrFail(123)
     * // User{id: 123}
     * ```
     *
     * @param primaryKey - The primaryKey of the record to look up
     * @returns The found record
     */
    async findOrFail(primaryKey) {
        const record = await this.find(primaryKey);
        if (!record)
            throw new record_not_found_1.default(this.dreamInstance.constructor.name);
        return record;
    }
    /**
     * Finds a record matching the Query and the
     * specified where statement. If not found, null
     * is returned
     *
     * ```ts
     * await User.query().findBy({ email: 'how@yadoin' })
     * // User{email: 'how@yadoin'}
     * ```
     *
     * @param whereStatement - The where statement used to locate the record
     * @returns Either the the first record found matching the attributes, or else null
     */
    async findBy(whereStatement) {
        return await this.where(whereStatement).first();
    }
    /**
     * Finds a record matching the Query and the
     * specified where statement. If not found, null
     * is returned
     *
     * ```ts
     * await User.query().findOrFailBy({ email: 'how@yadoin' })
     * // User{email: 'how@yadoin'}
     * ```
     *
     * @param whereStatement - The where statement used to locate the record
     * @returns Either the the first record found matching the attributes, or else null
     */
    async findOrFailBy(whereStatement) {
        const record = await this.findBy(whereStatement);
        if (!record)
            throw new record_not_found_1.default(this.dreamInstance.constructor.name);
        return record;
    }
    /**
     * Finds all records matching the Query in batches,
     * and then calls the provided callback
     * for each found record. Once all records
     * have been passed for a given batch, the next set of
     * records will be fetched and passed to your callback, until all
     * records matching the Query have been fetched.
     *
     * ```ts
     * await User.order('id').findEach(user => {
     *   console.log(user)
     * })
     * // User{id: 1}
     * // User{id: 2}
     * ```
     *
     * @param cb - The callback to call for each found record
     * @param opts.batchSize - the batch size you wish to collect records in. If not provided, it will default to 1000
     * @returns void
     */
    async findEach(cb, { batchSize = Query.BATCH_SIZES.FIND_EACH } = {}) {
        let records;
        const query = this.order(null).order(this.dreamClass.primaryKey).limit(batchSize);
        let lastId = null;
        do {
            if (lastId)
                records = await query.where({ [this.dreamInstance.primaryKey]: ops_1.default.greaterThan(lastId) }).all();
            else
                records = await query.all();
            for (const record of records) {
                await cb(record);
            }
            lastId = records[records.length - 1]?.primaryKeyValue;
        } while (records.length > 0 && records.length === batchSize);
    }
    /**
     * Given a collection of records, load a common association.
     * This can be useful to reduce database queries when multiple
     * dream classes have identical associations that should be loaded.
     *
     * For example, we can sideload the associations
     * shared by both associations called `localizedTexts`,
     * so long as `localizedTexts` points to the same class on
     * both Image and Post:
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
     * await Image.query().loadInto([image, post], 'localizedTexts')
     * ```
     *
     * @param dreams - An array of dream instances to load associations into
     * @param args - A chain of association names
     * @returns A LoadIntoModels instance
     *
     */
    async loadInto(dreams, ...args) {
        const query = this.preload(...args);
        await new load_into_models_1.default(query.preloadStatements, query.passthroughWhereStatement).loadInto(dreams);
    }
    /**
     * Applies preload statement to Query, which will load the
     * specified associations onto the instance upon execution.
     *
     * ```ts
     * const user = await User.query().preload('posts', 'comments', { visibilty: 'public' }, 'replies').first()
     * console.log(user.posts[0].comments[0].replies[0])
     * // [Reply{id: 1}, Reply{id: 2}]
     * ```
     *
     * @param args - A chain of associaition names and where clauses
     * @returns A cloned Query with the preload statement applied
     */
    preload(...args) {
        const preloadStatements = (0, cloneDeepSafe_1.default)(this.preloadStatements);
        const preloadWhereStatements = (0, cloneDeepSafe_1.default)(this.preloadWhereStatements);
        this.fleshOutJoinsStatements(preloadStatements, preloadWhereStatements, null, [...args]);
        return this.clone({ preloadStatements, preloadWhereStatements });
    }
    /**
     * Returns a new Query instance, with the provided
     * joins statement attached
     *
     * ```ts
     * await User.query().joins('posts').first()
     * ```
     *
     * @param args - A chain of associaition names and where clauses
     * @returns A cloned Query with the joins clause applied
     */
    joins(...args) {
        const joinsStatements = (0, cloneDeepSafe_1.default)(this.joinsStatements);
        const joinsWhereStatements = (0, cloneDeepSafe_1.default)(this.joinsWhereStatements);
        this.fleshOutJoinsStatements(joinsStatements, joinsWhereStatements, null, [...args]);
        return this.clone({ joinsStatements, joinsWhereStatements });
    }
    /**
     * @internal
     *
     * Applies a join statement for an association
     *
     */
    fleshOutJoinsStatements(joinsStatements, joinsWhereStatements, previousAssociationName, associationStatements) {
        const nextAssociationStatement = associationStatements.shift();
        if (nextAssociationStatement === undefined) {
            // just satisfying typing
        }
        else if ((0, typechecks_1.isString)(nextAssociationStatement)) {
            const nextStatement = nextAssociationStatement;
            if (!joinsStatements[nextStatement])
                joinsStatements[(0, protectAgainstPollutingAssignment_1.default)(nextStatement)] = {};
            if (!joinsWhereStatements[nextStatement])
                joinsWhereStatements[(0, protectAgainstPollutingAssignment_1.default)(nextStatement)] = {};
            const nextJoinsStatements = joinsStatements[nextStatement];
            const nextJoinsWhereStatements = joinsWhereStatements[nextStatement];
            this.fleshOutJoinsStatements(nextJoinsStatements, nextJoinsWhereStatements, nextStatement, associationStatements);
        }
        else if (Array.isArray(nextAssociationStatement)) {
            // this supports the final argument of load/preload statements
            const nextStatement = nextAssociationStatement;
            nextStatement.forEach(associationStatement => {
                joinsStatements[(0, protectAgainstPollutingAssignment_1.default)(associationStatement)] = {};
            });
        }
        else if ((0, typechecks_1.isObject)(nextAssociationStatement) && previousAssociationName) {
            const clonedNextAssociationStatement = (0, cloneDeepSafe_1.default)(nextAssociationStatement);
            const keys = Object.keys(clonedNextAssociationStatement);
            keys.forEach((key) => {
                joinsWhereStatements[(0, protectAgainstPollutingAssignment_1.default)(key)] = clonedNextAssociationStatement[key];
            });
            this.fleshOutJoinsStatements(joinsStatements, joinsWhereStatements, previousAssociationName, associationStatements);
        }
    }
    /**
     * Plucks the specified fields from the join Query
     *
     * ```ts
     * await User.query().pluckThrough(
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
     * await User.query().pluckThrough(
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
        const joinsStatements = (0, cloneDeepSafe_1.default)(this.joinsStatements);
        const joinsWhereStatements = (0, cloneDeepSafe_1.default)(this.joinsWhereStatements);
        const pluckStatement = [
            this.fleshOutPluckThroughStatements(joinsStatements, joinsWhereStatements, null, [...args]),
        ].flat();
        const vals = await this.clone({ joinsStatements, joinsWhereStatements }).pluckWithoutMarshalling(...pluckStatement);
        const associationNamesToDreamClasses = this.pluckThroughArgumentsToDreamClassesMap([...args]);
        const mapFn = (val, index) => {
            return (0, extractValueFromJoinsPluckResponse_1.extractValueFromJoinsPluckResponse)(val, index, pluckStatement, this.dreamClass, associationNamesToDreamClasses);
        };
        const response = this.pluckValuesToPluckResponse(pluckStatement, vals, mapFn, {
            excludeFirstValue: false,
        });
        return response;
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
     * await User.query().pluckEachThrough(
     *   'posts',
     *   { createdAt: range(CalendarDate.yesterday()) },
     *   'comments',
     *   'replies',
     *   ['replies.id', 'replies.body'],
     *   ([id, body]) => {
     *     console.log({ id, body })
     *   }
     * )
     *
     * // { id: 1, body: 'loved it!' }
     * // { id: 2, body: 'hated it :('}
     * ```
     *
     * @param args - A chain of association names and where clauses ending with the column or array of columns to pluck and the callback function
     * @returns void
     */
    async pluckEachThrough(...args) {
        const allOpts = [...args];
        const providedCbIndex = allOpts.findIndex(v => typeof v === 'function');
        const providedCb = allOpts[providedCbIndex];
        const providedOpts = allOpts[providedCbIndex + 1];
        if (!providedCb)
            throw new missing_required_callback_function_to_pluck_each_1.default('pluckEachThrough', (0, compact_1.default)(allOpts));
        if (providedOpts !== undefined && !providedOpts?.batchSize)
            throw new cannot_pass_additional_fields_to_pluck_each_after_callback_function_1.default('pluckEachThrough', (0, compact_1.default)(allOpts));
        const batchSize = providedOpts?.batchSize || Query.BATCH_SIZES.PLUCK_EACH_THROUGH;
        const joinsStatements = (0, cloneDeepSafe_1.default)(this.joinsStatements);
        const joinsWhereStatements = (0, cloneDeepSafe_1.default)(this.joinsWhereStatements);
        const fieldArgs = [...args];
        const onlyColumns = fieldArgs.filter((_, index) => index < providedCbIndex);
        const pluckStatement = [
            this.fleshOutPluckThroughStatements(joinsStatements, joinsWhereStatements, null, onlyColumns),
        ].flat();
        const associationNamesToDreamClasses = this.pluckThroughArgumentsToDreamClassesMap([...fieldArgs]);
        const finalAssociationName = this.pluckThroughArgumentsToTargetAssociationName([...fieldArgs]);
        const finalDreamClass = associationNamesToDreamClasses[finalAssociationName];
        const finalPrimaryKey = `${finalAssociationName}.${finalDreamClass.primaryKey}`;
        const pluckStatementIncludesPrimaryKey = pluckStatement.includes(finalPrimaryKey) || pluckStatement.includes(finalDreamClass.primaryKey);
        const columnsIncludingPrimaryKey = pluckStatementIncludesPrimaryKey
            ? pluckStatement
            : [finalPrimaryKey, ...pluckStatement];
        const baseQuery = this.clone({ joinsStatements, joinsWhereStatements });
        const mapFn = (val, index) => {
            return (0, extractValueFromJoinsPluckResponse_1.extractValueFromJoinsPluckResponse)(val, index, pluckStatement, this.dreamClass, associationNamesToDreamClasses);
        };
        let offset = 0;
        let results;
        do {
            results = await baseQuery
                .order(null)
                .order(finalPrimaryKey)
                .offset(offset)
                .limit(batchSize)
                .pluckWithoutMarshalling(...columnsIncludingPrimaryKey);
            const plucked = this.pluckValuesToPluckResponse(pluckStatement, results, mapFn, {
                excludeFirstValue: !pluckStatementIncludesPrimaryKey,
            });
            for (const data of plucked) {
                await providedCb(data);
            }
            offset += batchSize;
        } while (results.length > 0 && results.length === batchSize);
    }
    /**
     * @internal
     *
     * Returns the last association name in the pluck throguh args
     */
    pluckThroughArgumentsToAssociationNames(associationStatements) {
        const joinsStatements = {};
        this.fleshOutPluckThroughStatements(joinsStatements, {}, null, associationStatements);
        return (0, allNestedObjectKeys_1.allNestedObjectKeys)(joinsStatements);
    }
    /**
     * @internal
     *
     * Returns the last association name in the pluck throguh args
     */
    pluckThroughArgumentsToTargetAssociationName(
    // associationStatements: (
    //   | string
    //   | WhereStatement<DB, SyncedAssociations, any>
    //   | `${any}.${any}`
    //   | `${any}.${any}`[]
    //   | undefined
    // )[]
    // Complex type isn't gaining us anything and is making it difficult to use this private method
    associationStatements) {
        const associations = this.pluckThroughArgumentsToAssociationNames(associationStatements);
        return associations[associations.length - 1];
    }
    /**
     * @internal
     *
     * Builds an association map for use when
     * applying pluckThrough statements
     *
     */
    pluckThroughArgumentsToDreamClassesMap(
    // associationStatements: (
    //   | string
    //   | WhereStatement<DB, SyncedAssociations, any>
    //   | `${any}.${any}`
    //   | `${any}.${any}`[]
    //   | undefined
    // )[]
    // Complex type isn't gaining us anything and is making it difficult to use this private method
    associationStatements) {
        const associations = this.pluckThroughArgumentsToAssociationNames(associationStatements);
        return this.associationsToDreamClassesMap(associations);
    }
    /**
     * @internal
     *
     * Builds an association map for use when
     * applying pluckThrough statements
     *
     */
    associationsToDreamClassesMap(associationNames) {
        const associationsToDreamClassesMap = {};
        associationNames.reduce((dreamClass, associationName) => {
            const association = dreamClass['getAssociationMetadata'](associationName);
            const through = association.through;
            if (through) {
                const throughAssociation = dreamClass['getAssociationMetadata'](through);
                const throughAssociationDreamClass = throughAssociation.modelCB();
                associationsToDreamClassesMap[through] = throughAssociationDreamClass;
            }
            const nextDreamClass = association.modelCB();
            associationsToDreamClassesMap[associationName] = nextDreamClass;
            return nextDreamClass;
        }, this.dreamClass);
        return associationsToDreamClassesMap;
    }
    /**
     * @internal
     *
     * Applies pluckThrough statements
     *
     */
    fleshOutPluckThroughStatements(joinsStatements, joinsWhereStatements, previousAssociationName, 
    // associationStatements: (
    //   | string
    //   | WhereStatement<DB, SyncedAssociations, any>
    //   | `${any}.${any}`
    //   | `${any}.${any}`[]
    //   | undefined
    // )[]
    // Complex type isn't gaining us anything and is making it difficult to use this private method
    associationStatements) {
        const nextAssociationStatement = associationStatements.shift();
        if (nextAssociationStatement === undefined) {
            // just satisfying typing
        }
        else if (Array.isArray(nextAssociationStatement)) {
            return nextAssociationStatement;
        }
        else if ((0, typechecks_1.isString)(nextAssociationStatement) && nextAssociationStatement.includes('.')) {
            return nextAssociationStatement;
        }
        else if ((0, typechecks_1.isString)(nextAssociationStatement)) {
            const nextStatement = nextAssociationStatement;
            if (!joinsStatements[nextStatement])
                joinsStatements[(0, protectAgainstPollutingAssignment_1.default)(nextStatement)] = {};
            if (!joinsWhereStatements[nextStatement])
                joinsWhereStatements[(0, protectAgainstPollutingAssignment_1.default)(nextStatement)] = {};
            const nextJoinsStatements = joinsStatements[nextStatement];
            const nextJoinsWhereStatements = joinsWhereStatements[nextStatement];
            return this.fleshOutPluckThroughStatements(nextJoinsStatements, nextJoinsWhereStatements, nextStatement, associationStatements);
        }
        else if ((0, typechecks_1.isObject)(nextAssociationStatement) && previousAssociationName) {
            const clonedNextAssociationStatement = (0, cloneDeepSafe_1.default)(nextAssociationStatement);
            const keys = Object.keys(clonedNextAssociationStatement);
            keys.forEach((key) => {
                joinsWhereStatements[(0, protectAgainstPollutingAssignment_1.default)(key)] = clonedNextAssociationStatement[key];
            });
            return this.fleshOutPluckThroughStatements(joinsStatements, joinsWhereStatements, previousAssociationName, associationStatements);
        }
    }
    /**
     * @internal
     *
     * Changes the base sql alias
     *
     */
    setBaseSQLAlias(baseSqlAlias) {
        return this.clone({ baseSqlAlias });
    }
    /**
     * @internal
     *
     * Association queries start from the table corresponding to an instance
     * of a Dream and join the association. However, the Dream may have
     * default scopes that would preclude finding that instance, so the
     * Query that forms the base of an association query must be unscoped,
     * but that unscoping should not carry through to other associations
     * (thus the use of `removeAllDefaultScopesExceptOnAssociations` instead of
     * `removeAllDefaultScopes`).
     *
     * The association that this query is loading leverages `joins`, and the
     * joining code explicitly handles applying / omitting default scopes.
     * We set `bypassAllDefaultScopesExceptOnAssociations: true` on this Query
     * to let that code do its work. This keeps the implementation DRY and simpler
     * (without `bypassAllDefaultScopesExceptOnAssociations`, the default scopes would
     * be applied twice, and when the association attempts to remove a default
     * association would be foiled because it would be applied outside of the context
     * where the association is modifying the query).
     *
     */
    setAssociationQueryBase(baseSelectQuery) {
        return this.clone({
            baseSelectQuery: baseSelectQuery.removeAllDefaultScopesExceptOnAssociations(),
            bypassAllDefaultScopesExceptOnAssociations: true,
        });
    }
    /**
     * Prevents default scopes from applying when
     * the Query is executed
     *
     * @returns A new Query which will prevent default scopes from applying
     */
    removeAllDefaultScopes() {
        return this.clone({
            bypassAllDefaultScopes: true,
            baseSelectQuery: this.baseSelectQuery?.removeAllDefaultScopes(),
        });
    }
    /**
     * Prevents default scopes from applying when
     * the Query is executed, but not when applying to associations
     *
     * @returns A new Query which will prevent default scopes from applying, but not when applying to asociations
     */
    removeAllDefaultScopesExceptOnAssociations() {
        return this.clone({
            bypassAllDefaultScopesExceptOnAssociations: true,
            baseSelectQuery: this.baseSelectQuery?.removeAllDefaultScopesExceptOnAssociations(),
        });
    }
    /**
     * Prevents a specific default scope from applying when
     * the Query is executed
     *
     * @returns A new Query which will prevent a specific default scope from applying
     */
    removeDefaultScope(scopeName) {
        return this.clone({
            defaultScopesToBypass: [...this.defaultScopesToBypass, scopeName],
            baseSelectQuery: this.baseSelectQuery?.removeDefaultScope(scopeName),
        });
    }
    /**
     * Prevents a specific default scope from applying when
     * the Query is executed, but not when applying to asociations
     *
     * @returns A new Query which will prevent a specific default scope from applying, but not when applying to asociations
     */
    removeDefaultScopeExceptOnAssociations(scopeName) {
        return this.clone({
            defaultScopesToBypassExceptOnAssociations: [
                ...this.defaultScopesToBypassExceptOnAssociations,
                scopeName,
            ],
            baseSelectQuery: this.baseSelectQuery?.removeDefaultScopeExceptOnAssociations(scopeName),
        });
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
     * await User.query().passthrough({ locale: 'es-ES' })
     *   .preload('posts', 'currentLocalizedText')
     *   .first()
     * ```
     *
     * @param passthroughWhereStatement - where statement used for associations that require passthrough data
     * @returns A cloned Query with the passthrough data
     */
    passthrough(passthroughWhereStatement) {
        return this.clone({ passthroughWhereStatement });
    }
    /**
     * Applies a where statement to the Query instance
     *
     * ```ts
     * await User.where({ email: 'how@yadoin' }).first()
     * // User{email: 'how@yadoin'}
     * ```
     *
     * @param whereStatement - Where statement to apply to the Query
     * @returns A cloned Query with the where clause applied
     */
    where(whereStatement) {
        return this._where(whereStatement, 'where');
    }
    /**
     * Accepts a list of where statements, each of
     * which is combined via `OR`
     *
     * ```ts
     * await User.query().whereAny([{ email: 'how@yadoin' }, { name: 'fred' }]).first()
     * // [User{email: 'how@yadoin'}, User{name: 'fred'}, User{name: 'fred'}]
     * ```
     *
     * @param whereStatements - a list of where statements to `OR` together
     * @returns A cloned Query with the whereAny clause applied
     */
    whereAny(whereStatements) {
        return this.clone({
            or: [whereStatements.map(obj => ({ ...obj }))],
        });
    }
    /**
     * Applies a whereNot statement to the Query instance
     *
     * ```ts
     * await User.query().whereNot({ email: 'how@yadoin' }).first()
     * // User{email: 'hello@world'}
     * ```
     *
     * @param whereStatement - A where statement to negate and apply to the Query
     * @returns A cloned Query with the whereNot clause applied
     */
    whereNot(whereStatement) {
        return this._where(whereStatement, 'whereNot');
    }
    /**
     * @internal
     *
     * Applies a where clause
     */
    _where(whereStatement, typeOfWhere) {
        return this.clone({
            [typeOfWhere]: whereStatement === null ? null : [{ ...whereStatement }],
        });
    }
    /**
     * Returns a new Kysely SelectQueryBuilder instance to be used
     * in a sub Query
     *
     * ```ts
     * const records = await User.where({
     *   id: Post.query().nestedSelect('userId'),
     * }).all()
     * // [User{id: 1}, ...]
     * ```
     *
     * @param selection - the column to use for your nested Query
     * @returns A Kysely SelectQueryBuilder instance
     */
    nestedSelect(selection) {
        const query = this.buildSelect({ bypassSelectAll: true, bypassOrder: true });
        return query.select(this.namespaceColumn(selection));
    }
    /**
     * Returns a new Query instance, attaching the provided
     * order statement
     *
     * ```ts
     * await User.query().order('id').all()
     * // [User{id: 1}, User{id: 2}, ...]
     * ```
     *
     * ```ts
     * await User.query().order({ name: 'asc', id: 'desc' }).all()
     * // [User{name: 'a', id: 99}, User{name: 'a', id: 97}, User{ name: 'b', id: 98 } ...]
     * ```
     *
     * @param orderStatement - Either a string or an object specifying order. If a string, the order is implicitly ascending. If the orderStatement is an object, statements will be provided in the order of the keys set in the object
     * @returns A cloned Query with the order clause applied
     */
    order(arg) {
        if (arg === null)
            return this.clone({ order: null });
        if ((0, typechecks_1.isString)(arg))
            return this.clone({ order: [{ column: arg, direction: 'asc' }] });
        let query = this.clone();
        Object.keys(arg).forEach(key => {
            const column = key;
            const direction = arg[key];
            query = query.clone({
                order: [{ column: column, direction }],
            });
        });
        return query;
    }
    /**
     * Returns a new Query instance, specifying a limit
     *
     * ```ts
     * await User.order('id').limit(2).all()
     * // [User{id: 1}, User{id: 2}]
     * ```
     *
     * @returns A cloned Query with the limit clause applied
     */
    limit(limit) {
        return this.clone({ limit });
    }
    /**
     * Returns a new Query instance, specifying an offset
     *
     * ```ts
     * await User.order('id').offset(2).limit(2).all()
     * // [User{id: 3}, User{id: 4}]
     * ```
     *
     * @returns A cloned Query with the offset clause applied
     */
    offset(offset) {
        return this.clone({ offset });
    }
    /**
     * Returns the sql that would be executed by this Query
     *
     * ```ts
     * User.where({ email: 'how@yadoin' }).sql()
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
     * //  sql: 'select "users".* from "users" where ("users"."email" = $1 and "users"."deleted_at" is null)',
     * //  parameters: [ 'how@yadoin' ]
     * //}
     * ```
     *
     * @returns An object representing the underlying sql statement
     *
     */
    sql() {
        const kyselyQuery = this.buildSelect();
        return kyselyQuery.compile();
    }
    /**
     * Converts the given dream class into a Kysely query, enabling
     * you to build custom queries using the Kysely API
     *
     * ```ts
     * await User.query().toKysely('select').where('email', '=', 'how@yadoin').execute()
     * ```
     *
     * @param type - the type of Kysely query builder instance you would like to obtain
     * @returns A Kysely query. Depending on the type passed, it will return either a SelectQueryBuilder, DeleteQueryBuilder, or an UpdateQueryBuilder
     */
    toKysely(type) {
        switch (type) {
            case 'select':
                return this.buildSelect();
            case 'delete':
                return this.buildDelete();
            case 'update':
                return this.buildUpdate({});
            // TODO: in the future, we should support insert type, but don't yet, since inserts are done outside
            // the query class for some reason.
            default:
                throw new Error('never');
        }
    }
    /**
     * Applies transaction to the Query instance
     *
     * ```ts
     * await ApplicationModel.transaction(async txn => {
     *   await User.query().txn(txn).create({ email: 'how@yadoin' })
     * })
     * ```
     *
     * @param txn - A DreamTransaction instance (usually collected by calling `ApplicationModel.transaction`)
     * @returns A cloned Query with the transaction applied
     *
     */
    txn(dreamTransaction) {
        return this.clone({ transaction: dreamTransaction });
    }
    /**
     * Retrieves the number of records in the database
     *
     * ```ts
     * await User.query().count()
     * ```
     *
     * @returns The number of records in the database
     */
    async count() {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const { count } = this.dbFor('select').fn;
        const distinctColumn = this.distinctColumn;
        const query = this.clone({ distinctColumn: null });
        let kyselyQuery = query.buildSelect({ bypassSelectAll: true, bypassOrder: true });
        const countClause = distinctColumn
            ? count((0, kysely_1.sql) `DISTINCT ${distinctColumn}`)
            : count(query.namespaceColumn(query.dreamInstance.primaryKey));
        kyselyQuery = kyselyQuery.select(countClause.as('tablecount'));
        const data = await (0, executeDatabaseQuery_1.default)(kyselyQuery, 'executeTakeFirstOrThrow');
        return parseInt(data.tablecount.toString());
    }
    /**
     * Returns new Query with distinct clause applied
     *
     * ```ts
     * await User.query().distinct('name').pluck('name')
     * ```
     *
     * @returns A cloned Query with the distinct clause applied
     */
    distinct(column = true) {
        if (column === true) {
            return this.clone({
                distinctColumn: this.namespaceColumn(this.dreamInstance.primaryKey),
            });
        }
        else if (column === false) {
            return this.clone({ distinctColumn: null });
        }
        else {
            return this.clone({ distinctColumn: this.namespaceColumn(column) });
        }
    }
    /**
     * @internal
     *
     * Returns a namespaced column name
     *
     * @returns A string
     */
    namespaceColumn(column) {
        if (column.includes('.'))
            return column;
        return `${this.baseSqlAlias}.${column}`;
    }
    /**
     * Retrieves the max value of the specified column
     * for this Query
     *
     * ```ts
     * await User.query().max('id')
     * // 99
     * ```
     *
     * @param columnName - a column name on the model
     * @returns the max value of the specified column for this Query
     *
     */
    async max(columnName) {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const { max } = this.dbFor('select').fn;
        let kyselyQuery = this.buildSelect({ bypassSelectAll: true, bypassOrder: true });
        kyselyQuery = kyselyQuery.select(max(columnName));
        const data = await (0, executeDatabaseQuery_1.default)(kyselyQuery, 'executeTakeFirstOrThrow');
        return (0, marshalDBValue_1.marshalDBValue)(this.dreamClass, columnName, data.max);
    }
    /**
     * Retrieves the min value of the specified column
     * for this Query
     *
     * ```ts
     * await User.query().min('id')
     * // 1
     * ```
     *
     * @param columnName - a column name on the model
     * @returns the min value of the specified column for this Query
     */
    async min(columnName) {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const { min } = this.dbFor('select').fn;
        let kyselyQuery = this.buildSelect({ bypassSelectAll: true, bypassOrder: true });
        kyselyQuery = kyselyQuery.select(min(columnName));
        const data = await (0, executeDatabaseQuery_1.default)(kyselyQuery, 'executeTakeFirstOrThrow');
        return (0, marshalDBValue_1.marshalDBValue)(this.dreamClass, columnName, data.min);
    }
    /**
     * Join through associations, with optional where clauses,
     * and return the minimum value for the specified column
     *
     * ```ts
     * await User.query().minThrough('posts', { createdAt: range(start) }, 'posts.rating')
     * // 2.5
     * ```
     *
     * @param args - A chain of association names and where clauses ending with the column to min
     * @returns the min value of the specified column for the nested association's records
     */
    async minThrough(...args) {
        return await this.minMaxThrough('min', args);
    }
    /**
     * Join through associations, with optional where clauses,
     * and return the maximum value for the specified column
     *
     * ```ts
     * await User.query().maxThrough('posts', { createdAt: range(start) }, 'posts.rating')
     * // 4.8
     * ```
     *
     * @param args - A chain of association names and where clauses ending with the column to max
     * @returns the max value of the specified column for the nested association's records
     */
    async maxThrough(...args) {
        return await this.minMaxThrough('max', args);
    }
    async minMaxThrough(minOrMax, args) {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const { min, max } = this.dbFor('select').fn;
        const joinsStatements = (0, cloneDeepSafe_1.default)(this.joinsStatements);
        const joinsWhereStatements = (0, cloneDeepSafe_1.default)(this.joinsWhereStatements);
        const pluckStatement = [
            this.fleshOutPluckThroughStatements(joinsStatements, joinsWhereStatements, null, [...args]),
        ].flat();
        const columnName = pluckStatement[0];
        let kyselyQuery = this.clone({ joinsStatements, joinsWhereStatements }).buildSelect({
            bypassSelectAll: true,
            bypassOrder: true,
        });
        switch (minOrMax) {
            case 'min':
                kyselyQuery = kyselyQuery.select(min(columnName));
                break;
            case 'max':
                kyselyQuery = kyselyQuery.select(max(columnName));
                break;
        }
        const data = await (0, executeDatabaseQuery_1.default)(kyselyQuery, 'executeTakeFirstOrThrow');
        return (0, marshalDBValue_1.marshalDBValue)(this.dreamClass, columnName, data[minOrMax]);
    }
    /**
     * Retrieves the number of records matching
     * the given query.
     *
     * ```ts
     * await User.where({ email: null }).countThrough('posts', 'comments', { body: null })
     * // 42
     * ```
     *
     * @param args - A chain of association names and where clauses
     * @returns the number of records found matching the given parameters
     */
    async countThrough(...args) {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const { count } = this.dbFor('select').fn;
        const joinsStatements = (0, cloneDeepSafe_1.default)(this.joinsStatements);
        const joinsWhereStatements = (0, cloneDeepSafe_1.default)(this.joinsWhereStatements);
        this.fleshOutPluckThroughStatements(joinsStatements, joinsWhereStatements, null, [...args]);
        const distinctColumn = this.distinctColumn;
        const query = this.clone({ joinsStatements, joinsWhereStatements, distinctColumn: null });
        let kyselyQuery = query.buildSelect({
            bypassSelectAll: true,
            bypassOrder: true,
        });
        const countClause = distinctColumn
            ? count((0, kysely_1.sql) `DISTINCT ${distinctColumn}`)
            : count(query.namespaceColumn(query.dreamInstance.primaryKey));
        kyselyQuery = kyselyQuery.select(countClause.as('tablecount'));
        const data = await (0, executeDatabaseQuery_1.default)(kyselyQuery, 'executeTakeFirstOrThrow');
        return parseInt(data.tablecount.toString());
    }
    /**
     * @internal
     *
     * Runs the query and extracts plucked values
     *
     * @returns An array of plucked values
     */
    async pluckWithoutMarshalling(...fields) {
        let kyselyQuery = this.removeAllDefaultScopesExceptOnAssociations().buildSelect({ bypassSelectAll: true });
        const aliases = [];
        fields.forEach((field, index) => {
            const alias = `dr${index}`;
            aliases.push(alias);
            kyselyQuery = kyselyQuery.select(`${this.namespaceColumn(field)} as ${alias}`);
        });
        return (await (0, executeDatabaseQuery_1.default)(kyselyQuery, 'execute')).map(singleResult => aliases.map(alias => singleResult[alias]));
    }
    /**
     * Plucks the provided fields from the given dream class table
     *
     * ```ts
     * await User.order('id').pluck('id')
     * // [1, 2, 3]
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
    async pluck(...fields) {
        const vals = await this.pluckWithoutMarshalling(...fields);
        const mapFn = (val, index) => (0, marshalDBValue_1.marshalDBValue)(this.dreamClass, fields[index], val);
        return this.pluckValuesToPluckResponse(fields, vals, mapFn, {
            excludeFirstValue: false,
        });
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
    async pluckEach(...fields) {
        const providedCbIndex = fields.findIndex(v => typeof v === 'function');
        const providedCb = fields[providedCbIndex];
        const providedOpts = fields[providedCbIndex + 1];
        if (!providedCb)
            throw new missing_required_callback_function_to_pluck_each_1.default('pluckEach', fields);
        if (providedOpts !== undefined && !providedOpts?.batchSize)
            throw new cannot_pass_additional_fields_to_pluck_each_after_callback_function_1.default('pluckEach', fields);
        const onlyColumns = fields.filter((_, index) => index < providedCbIndex);
        const batchSize = providedOpts?.batchSize || Query.BATCH_SIZES.PLUCK_EACH_THROUGH;
        const mapFn = (val, index) => (0, marshalDBValue_1.marshalDBValue)(this.dreamClass, fields[index], val);
        let offset = 0;
        let records;
        do {
            const onlyIncludesPrimaryKey = onlyColumns.includes(this.dreamClass.primaryKey);
            const columnsIncludingPrimaryKey = onlyIncludesPrimaryKey
                ? onlyColumns
                : [this.dreamClass.primaryKey, ...onlyColumns];
            records = await this.offset(offset)
                .order(null)
                .order(this.dreamClass.primaryKey)
                .limit(batchSize)
                .pluckWithoutMarshalling(...columnsIncludingPrimaryKey);
            const vals = this.pluckValuesToPluckResponse(onlyColumns, records, mapFn, {
                excludeFirstValue: !onlyIncludesPrimaryKey,
            });
            for (const val of vals) {
                await providedCb(val);
            }
            offset += batchSize;
        } while (records.length > 0 && records.length === batchSize);
    }
    /**
     * Retrieves an array containing all records matching the Query.
     * Be careful using this, since it will attempt to pull every
     * record into memory at once. When querying might return a large
     * number of records, consider using `.findEach`, which will pull
     * the records in batches.
     *
     * ```ts
     * await User.query().all()
     * ```
     *
     * @returns an array of dreams
     */
    async all() {
        const kyselyQuery = this.buildSelect();
        const results = await (0, executeDatabaseQuery_1.default)(kyselyQuery, 'execute');
        const theAll = results.map(r => (0, sqlResultToDreamInstance_1.default)(this.dreamClass, r));
        await this.applyPreload(this.preloadStatements, this.preloadWhereStatements, theAll);
        return theAll;
    }
    /**
     * @internal
     *
     * Retrieves a Query with the requested connection.
     *
     * @param connection - The connection you wish to access
     * @returns A Query with the requested connection
     */
    connection(connection) {
        return this.clone({ connection });
    }
    /**
     * Returns true if a record exists for the given
     * Query
     *
     * ```ts
     * await User.query().exists()
     * // false
     *
     * await User.create({ email: 'how@yadoin' })
     *
     * await User.query().exists()
     * // true
     * ```
     *
     * @returns boolean
     */
    async exists() {
        // Implementing via `limit(1).all()`, rather than the simpler `!!(await this.first())`
        // because it avoids the step of finding the first. Just find any, and return
        // that one.
        return (await this.limit(1).all()).length > 0;
    }
    /**
     * Returns the first record in the database
     * matching the Query. If the Query is not
     * ordered, it will automatically order
     * by primary key.
     *
     * ```ts
     * await User.query().first()
     * // User{id: 1}
     * ```
     *
     * @returns First record in the database, or null if no record exists
     */
    async first() {
        const query = this.orderStatements.length
            ? this
            : this.order({ [this.dreamInstance.primaryKey]: 'asc' });
        return await query.takeOne();
    }
    /**
     * Returns the first record in the database
     * matching the Query. If the Query is not
     * ordered, it will automatically order
     * by primary key. If no record is found,
     * an exception is raised.
     *
     * ```ts
     * await User.query().first()
     * // User{id: 1}
     * ```
     *
     * @returns First record in the database, or null if no record exists
     */
    async firstOrFail() {
        const record = await this.first();
        if (!record)
            throw new record_not_found_1.default(this.dreamInstance.constructor.name);
        return record;
    }
    /**
     * Returns the last record in the database
     * matching the Query. If the Query is not
     * ordered, it will automatically order
     * by primary key.
     *
     * ```ts
     * await User.query().last()
     * // User{id: 99}
     * ```
     *
     * @returns Last record in the database, or null if no record exists
     */
    async last() {
        const query = this.orderStatements.length
            ? this.invertOrder()
            : this.order({ [this.dreamInstance.primaryKey]: 'desc' });
        return await query.takeOne();
    }
    /**
     * Returns the last record in the database
     * matching the Query. If the Query is not
     * ordered, it will automatically order
     * by primary key. If no record is found,
     * it will raise an exception.
     *
     * ```ts
     * await User.where(...).lastOrFail()
     * // User{id: 99}
     * ```
     *
     * @returns Last record in the database, or null if no record exists
     */
    async lastOrFail() {
        const record = await this.last();
        if (!record)
            throw new record_not_found_1.default(this.dreamInstance.constructor.name);
        return record;
    }
    /**
     * Destroys all records matching the Query,
     * calling model hooks and cascading destroy
     * to associations with `dependent: 'destroy'`,
     * and returns the number of records that
     * were destroyed.
     *
     * To delete in a signle database query,
     * ignoring model hooks and association
     * dependent-destroy declarations, use
     * {@link Query.delete | delete} instead.
     *
     * ```ts
     * await User.where({ email: ops.ilike('%burpcollaborator%')}).destroy()
     * // 12
     * ```
     *
     * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
     * @param opts.cascade - if false, will skip applying cascade deletes on "dependent: 'destroy'" associations. Defaults to true
     * @returns The number of records that were removed
     */
    async destroy({ skipHooks, cascade, } = {}) {
        let counter = 0;
        const options = {
            bypassAllDefaultScopes: this.bypassAllDefaultScopes,
            defaultScopesToBypass: this.defaultScopesToBypass,
            skipHooks,
            cascade,
        };
        await this.findEach(async (result) => {
            const subquery = this.dreamTransaction
                ? result.txn(this.dreamTransaction)
                : result;
            if (this.shouldReallyDestroy) {
                await subquery.reallyDestroy(options);
            }
            else {
                await subquery.destroy(options);
            }
            counter++;
        });
        return counter;
    }
    /**
     * Destroy, deleting from the database even
     * models designated SoftDelete.
     *
     * Calls model hooks and applies cascade destroy
     * to associations with `dependent: 'destroy'`,
     * returning the number of records that
     * were destroyed.
     *
     * If the record being destroyed is using
     * a @SoftDelete decorator, the soft delete
     * will be bypassed, causing the record
     * to be permanently removed from the database.
     *
     * To destroy without bypassing the SoftDelete
     * decorator, use {@link Query.(destroy:instance) | destroy} instead.
     *
     * ```ts
     * await User.where({ email: ops.ilike('%burpcollaborator%')}).reallyDestroy()
     * // 12
     * ```
     *
     * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
     * @param opts.cascade - if false, will skip applying cascade deletes on "dependent: 'destroy'" associations. Defaults to true
     * @returns The number of records that were removed
     */
    async reallyDestroy({ skipHooks, cascade, } = {}) {
        return await this.clone({ shouldReallyDestroy: true }).destroy({ skipHooks, cascade });
    }
    /**
     * Undestroys a SoftDelete model, unsetting
     * the `deletedAt` field in the database.
     *
     * If the model is not a SoftDelete model,
     * this will raise an exception.
     *
     * ```ts
     * await User.where({ email: ops.ilike('%burpcollaborator%')}).undestroy()
     * // 12
     * ```
     *
     * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
     * @param opts.cascade - if false, will skip applying cascade undeletes on "dependent: 'destroy'" associations. Defaults to true
     * @returns The number of records that were removed
     */
    async undestroy({ cascade, skipHooks, } = {}) {
        if (!this.dreamClass['softDelete'])
            throw new cannot_call_undestroy_on_a_non_soft_delete_model_1.default(this.dreamClass);
        let counter = 0;
        await this.removeDefaultScope(soft_delete_1.SOFT_DELETE_SCOPE_NAME).findEach(async (result) => {
            const subquery = this.dreamTransaction
                ? result.txn(this.dreamTransaction)
                : result;
            await subquery.undestroy({
                bypassAllDefaultScopes: this.bypassAllDefaultScopes,
                defaultScopesToBypass: this.defaultScopesToBypass,
                cascade,
                skipHooks,
            });
            counter++;
        });
        return counter;
    }
    /**
     * Deletes all records matching query using a single
     * database query, but does not call underlying callbacks.
     * Ignores association dependent destroy declarations,
     * though cascading may still happen at the database level.
     *
     * To apply model hooks and association dependent destroy,
     * use {@link Query.(destroy:instance) | destroy} instead.
     *
     * ```ts
     * await User.where({ email: ops.ilike('%burpcollaborator%').delete() })
     * // 12
     * ```
     *
     * @returns The number of records that were updated
     */
    async delete() {
        const deletionResult = await (0, executeDatabaseQuery_1.default)(this.buildDelete(), 'executeTakeFirst');
        return Number(deletionResult?.numDeletedRows || 0);
    }
    /**
     * Updates all records matching the Query
     *
     * ```ts
     * await User.where({ email: ops.ilike('%burpcollaborator%') }).updateAll({ email: null })
     * // 12
     * ```
     * @param attributes - The attributes used to update the records
     * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
     * @returns The number of records that were updated
     */
    async update(attributes, { skipHooks } = {}) {
        if (this.baseSelectQuery)
            throw new no_updateall_on_association_query_1.default();
        if (Object.keys(this.joinsStatements).length)
            throw new no_updateall_on_joins_1.default();
        if (skipHooks)
            return await this.updateWithoutCallingModelHooks(attributes);
        let counter = 0;
        await this.findEach(async (result) => {
            const subquery = this.dreamTransaction
                ? result.txn(this.dreamTransaction)
                : result;
            await subquery.update(attributes);
            counter++;
        });
        return counter;
    }
    async updateWithoutCallingModelHooks(attributes) {
        const kyselyQuery = this.buildUpdate(attributes);
        const res = await (0, executeDatabaseQuery_1.default)(kyselyQuery, 'execute');
        const resultData = Array.from(res.entries())?.[0]?.[1];
        return Number(resultData?.numUpdatedRows || 0);
    }
    /**
     * @internal
     *
     * Applies pluck values to a provided callback function
     *
     * @returns An array of pluck values
     */
    pluckValuesToPluckResponse(fields, vals, mapFn, { excludeFirstValue }) {
        if (excludeFirstValue)
            vals = vals.map(valueArr => valueArr.slice(1));
        if (fields.length > 1) {
            return vals.map(arr => arr.map(mapFn));
        }
        else {
            return vals.flat().map(val => mapFn(val, 0));
        }
    }
    /**
     * @internal
     *
     * Used for applying first and last queries
     *
     * @returns A dream instance or null
     */
    async takeOne() {
        const kyselyQuery = this.buildSelect();
        const results = await (0, executeDatabaseQuery_1.default)(kyselyQuery, 'executeTakeFirst');
        if (results) {
            const theFirst = (0, sqlResultToDreamInstance_1.default)(this.dreamClass, results);
            if (theFirst)
                await this.applyPreload(this.preloadStatements, this.preloadWhereStatements, [theFirst]);
            return theFirst;
        }
        else
            return null;
    }
    /**
     * @internal
     *
     * Used to hydrate dreams with the provided associations
     */
    hydrateAssociation(dreams, association, preloadedDreamsAndWhatTheyPointTo) {
        switch (association.type) {
            case 'HasMany':
                dreams.forEach((dream) => {
                    dream[association.as] = [];
                });
                break;
            default:
                dreams.forEach((dream) => {
                    dream[(0, associationToGetterSetterProp_1.default)(association)] = null;
                });
        }
        // dreams is a Rating
        // Rating belongs to: rateables (Posts / Compositions)
        // loadedAssociations is an array of Posts and Compositions
        // if rating.rateable_id === loadedAssociation.primaryKeyvalue
        //  rating.rateable = loadedAssociation
        preloadedDreamsAndWhatTheyPointTo.forEach(preloadedDreamAndWhatItPointsTo => {
            dreams
                .filter(dream => dream.primaryKeyValue === preloadedDreamAndWhatItPointsTo.pointsToPrimaryKey)
                .forEach((dream) => {
                if (association.type === 'HasMany') {
                    dream[association.as].push(preloadedDreamAndWhatItPointsTo.dream);
                }
                else {
                    // in a HasOne context, order clauses will be applied in advance,
                    // prior to hydration. Considering, we only want to set the first
                    // result and ignore other results, so we will use ||= to set.
                    dream[association.as] ||= preloadedDreamAndWhatItPointsTo.dream;
                }
            });
        });
        if (association.type === 'HasMany') {
            dreams.forEach((dream) => Object.freeze(dream[association.as]));
        }
    }
    /**
     * @internal
     *
     * Used to bridge through associations
     */
    followThroughAssociation(dreamClass, association) {
        const throughAssociation = association.through && dreamClass['getAssociationMetadata'](association.through);
        if (!throughAssociation)
            throw new missing_through_association_1.default({
                dreamClass,
                association,
            });
        const throughClass = throughAssociation.modelCB();
        if (Array.isArray(throughClass))
            throw new cannot_associate_through_polymorphic_1.default({
                dreamClass,
                association,
            });
        const newAssociation = getSourceAssociation(throughClass, association.source);
        if (!newAssociation)
            throw new missing_through_association_source_1.default({
                dreamClass,
                throughClass,
                association,
            });
        return { throughAssociation, throughClass, newAssociation };
    }
    /**
     * @internal
     *
     * Polymorphic BelongsTo. Since polymorphic associations may point to multiple tables,
     * preload by loading each target class separately.
     *
     * Used to preload polymorphic belongs to associations
     */
    async preloadPolymorphicBelongsTo(association, dreams) {
        if (!association.polymorphic)
            throw new Error(`Association ${association.as} points to an array of models but is not designated polymorphic`);
        if (association.type !== 'BelongsTo')
            throw new Error(`Polymorphic association ${association.as} points to an array of models but is ${association.type}. Only BelongsTo associations may point to an array of models.`);
        const associatedDreams = [];
        for (const associatedModel of association.modelCB()) {
            await this.preloadPolymorphicAssociationModel(dreams, association, associatedModel, associatedDreams);
        }
        return associatedDreams;
    }
    async preloadPolymorphicAssociationModel(dreams, association, associatedDreamClass, associatedDreams) {
        const relevantAssociatedModels = dreams.filter((dream) => {
            return dream[association.foreignKeyTypeField()] === associatedDreamClass['stiBaseClassOrOwnClass'].name;
        });
        if (relevantAssociatedModels.length) {
            dreams.forEach((dream) => {
                dream[(0, associationToGetterSetterProp_1.default)(association)] = null;
            });
            // Load all models of type associated that are associated with any of the already loaded Dream models
            const loadedAssociations = await this.dreamClassQueryWithScopeBypasses(associatedDreamClass, {
                // The association may remove specific default scopes that would otherwise preclude
                // certain instances of the associated class from being found.
                defaultScopesToBypassExceptOnAssociations: association.withoutDefaultScopes,
            })
                .where({
                [associatedDreamClass.primaryKey]: relevantAssociatedModels.map((dream) => dream[association.foreignKey()]),
            })
                .all();
            loadedAssociations.forEach(loadedAssociation => associatedDreams.push(loadedAssociation));
            //////////////////////////////////////////////////////////////////////////////////////////////
            // Associate each loaded association with each dream based on primary key and foreign key type
            //////////////////////////////////////////////////////////////////////////////////////////////
            for (const loadedAssociation of loadedAssociations) {
                dreams
                    .filter((dream) => {
                    return (dream[association.foreignKeyTypeField()] === loadedAssociation['stiBaseClassOrOwnClass'].name &&
                        dream[association.foreignKey()] === association.primaryKeyValue(loadedAssociation));
                })
                    .forEach((dream) => {
                    dream[association.as] = loadedAssociation;
                });
            }
            ///////////////////////////////////////////////////////////////////////////////////////////////////
            // end: Associate each loaded association with each dream based on primary key and foreign key type
            ///////////////////////////////////////////////////////////////////////////////////////////////////
        }
    }
    /**
     * @internal
     *
     * Applies a preload statement
     */
    async applyOnePreload(associationName, dreams, whereStatement = {}) {
        if (!Array.isArray(dreams))
            dreams = [dreams];
        const dream = dreams.find(dream => dream['getAssociationMetadata'](associationName));
        if (!dream)
            return;
        const association = dream['getAssociationMetadata'](associationName);
        const dreamClass = dream.constructor;
        const dreamClassToHydrate = association.modelCB();
        if ((association.polymorphic && association.type === 'BelongsTo') || Array.isArray(dreamClassToHydrate))
            return this.preloadPolymorphicBelongsTo(association, dreams);
        const dreamClassToHydrateColumns = [...dreamClassToHydrate.columns()];
        const throughColumnsToHydrate = [];
        const columnsToPluck = dreamClassToHydrateColumns.map(column => `${associationName}.${column.toString()}`);
        const asHasAssociation = association;
        if (asHasAssociation.through && asHasAssociation.preloadThroughColumns) {
            if ((0, typechecks_1.isObject)(asHasAssociation.preloadThroughColumns)) {
                const preloadMap = asHasAssociation.preloadThroughColumns;
                Object.keys(preloadMap).forEach(preloadThroughColumn => {
                    throughColumnsToHydrate.push(preloadMap[preloadThroughColumn]);
                    columnsToPluck.push(`${asHasAssociation.through}.${preloadThroughColumn}`);
                });
            }
            else {
                const preloadArray = asHasAssociation.preloadThroughColumns;
                preloadArray.forEach(preloadThroughColumn => {
                    throughColumnsToHydrate.push(preloadThroughColumn);
                    columnsToPluck.push(`${asHasAssociation.through}.${preloadThroughColumn}`);
                });
            }
        }
        columnsToPluck.push(`${dreamClass.table}.${dreamClass.primaryKey}`);
        const baseClass = dreamClass['stiBaseClassOrOwnClass']['getAssociationMetadata'](associationName)
            ? dreamClass['stiBaseClassOrOwnClass']
            : dreamClass;
        const associationDataScope = this.dreamClassQueryWithScopeBypasses(baseClass, {
            // In order to stay DRY, preloading leverages the association logic built into
            // `joins` (by using `pluck`, which calls `joins`). However, baseClass may have
            // default scopes that would preclude finding that instance. We remove all
            // default scopes on baseClass, but not subsequent associations, so that the
            // single query will be able to find each row corresponding to a Dream in `dreams`,
            // regardless of default scopes on that Dream's class.
            bypassAllDefaultScopesExceptOnAssociations: true,
        }).where({
            [dreamClass.primaryKey]: dreams.map(obj => obj.primaryKeyValue),
        });
        const hydrationData = whereStatement
            ? await associationDataScope.pluckThrough(associationName, whereStatement, columnsToPluck)
            : await associationDataScope.pluckThrough(associationName, columnsToPluck);
        const preloadedDreamsAndWhatTheyPointTo = hydrationData.map(pluckedData => {
            const attributes = {};
            dreamClassToHydrateColumns.forEach((columnName, index) => (attributes[(0, protectAgainstPollutingAssignment_1.default)(columnName)] = pluckedData[index]));
            const hydratedDream = (0, sqlResultToDreamInstance_1.default)(dreamClassToHydrate, attributes);
            throughColumnsToHydrate.forEach((throughAssociationColumn, index) => (hydratedDream.preloadedThroughColumns[throughAssociationColumn] =
                pluckedData[dreamClassToHydrateColumns.length + index]));
            return {
                dream: hydratedDream,
                pointsToPrimaryKey: pluckedData[pluckedData.length - 1],
            };
        });
        this.hydrateAssociation(dreams, association, preloadedDreamsAndWhatTheyPointTo);
        return preloadedDreamsAndWhatTheyPointTo.map(obj => obj.dream);
    }
    /**
     * @internal
     *
     * Applies a preload statement
     */
    async hydratePreload(dream) {
        await this.applyPreload(this.preloadStatements, this.preloadWhereStatements, dream);
    }
    /**
     * @internal
     *
     * Applies a preload statement
     */
    async applyPreload(preloadStatement, preloadWhereStatements, dream) {
        const keys = Object.keys(preloadStatement);
        for (const key of keys) {
            const nestedDreams = await this.applyOnePreload(key, dream, this.applyableWhereStatements(preloadWhereStatements[key]));
            if (nestedDreams) {
                await this.applyPreload(preloadStatement[key], preloadWhereStatements[key], nestedDreams);
            }
        }
    }
    /**
     * @internal
     *
     * retrieves where statements that can be applied
     */
    applyableWhereStatements(preloadWhereStatements) {
        if (preloadWhereStatements === undefined)
            return undefined;
        return Object.keys(preloadWhereStatements).reduce((agg, key) => {
            const value = preloadWhereStatements[key];
            if (value === null || value.constructor !== Object)
                agg[key] = value;
            return agg;
        }, {});
    }
    conditionallyApplyDefaultScopes() {
        if (this.bypassAllDefaultScopes || this.bypassAllDefaultScopesExceptOnAssociations)
            return this;
        const thisScopes = this.dreamClass['scopes'].default;
        let query = this;
        for (const scope of thisScopes) {
            if (!(0, shouldBypassDefaultScope_1.default)(scope.method, {
                defaultScopesToBypass: [
                    ...this.defaultScopesToBypass,
                    ...this.defaultScopesToBypassExceptOnAssociations,
                ],
            })) {
                query = this.dreamClass[scope.method](query);
            }
        }
        return query;
    }
    // Through associations don't get written into the SQL; they
    // locate the next association we need to build into the SQL
    // AND the source to reference on the other side
    joinsBridgeThroughAssociations({ query, dreamClass, association, previousAssociationTableOrAlias, }) {
        if (association.type === 'BelongsTo' || !association.through) {
            return {
                query,
                dreamClass,
                association,
                previousAssociationTableOrAlias,
            };
        }
        else {
            // We have entered joinsBridgeThroughAssociations with the
            // CompositionAssetAudits HasOne User association, which
            // is through compositionAsset
            // We now apply the compositionAsset association (a BelongsTo)
            // to the query
            const { query: queryWithThroughAssociationApplied } = this.applyOneJoin({
                query,
                dreamClass,
                previousAssociationTableOrAlias,
                currentAssociationTableOrAlias: association.through,
                originalAssociation: association,
            });
            // The through association has both a `through` and a `source`. The `source`
            // is the association on the model that has now been joined. In our example,
            // the `source` is the `user` association on the CompositionAsset model
            const { newAssociation, throughAssociation, throughClass } = this.followThroughAssociation(dreamClass, association);
            if (newAssociation.through) {
                // This new association is itself a through association, so we recursively
                // call joinsBridgeThroughAssociations
                return this.joinsBridgeThroughAssociations({
                    query: queryWithThroughAssociationApplied,
                    dreamClass: throughClass,
                    association: newAssociation,
                    previousAssociationTableOrAlias: throughAssociation.as,
                });
            }
            else {
                // This new association is not a through association, so
                // this is the target association we were looking for
                return {
                    query: queryWithThroughAssociationApplied,
                    dreamClass: association.modelCB(),
                    association: newAssociation,
                    throughClass,
                    previousAssociationTableOrAlias: association.through,
                };
            }
        }
    }
    applyOneJoin({ query, dreamClass, previousAssociationTableOrAlias, currentAssociationTableOrAlias, originalAssociation, joinsWhereStatements = {}, }) {
        let association = dreamClass['getAssociationMetadata'](currentAssociationTableOrAlias);
        if (!association)
            throw new join_attempted_with_missing_association_1.default({
                dreamClass,
                associationName: currentAssociationTableOrAlias,
            });
        const results = this.joinsBridgeThroughAssociations({
            query,
            dreamClass,
            association,
            previousAssociationTableOrAlias,
        });
        query = results.query;
        dreamClass = results.dreamClass;
        association = results.association;
        previousAssociationTableOrAlias = results.previousAssociationTableOrAlias;
        const throughClass = results.throughClass;
        if (originalAssociation?.through) {
            ///////////////////////////////////////////////////////////////////////////////////////
            // when an association is through another association, `joinsBridgeThroughAssociations`
            // is called, which eventually calls back to this method, passing in the original
            // through association as `originalAssociation`
            ///////////////////////////////////////////////////////////////////////////////////////
            if (originalAssociation.distinct) {
                query = query.distinctOn(this.distinctColumnNameForAssociation({
                    association: originalAssociation,
                    tableNameOrAlias: originalAssociation.as,
                    foreignKey: originalAssociation.primaryKey(),
                }));
            }
            if (originalAssociation.where) {
                query = this.applyWhereStatements(query, this.aliasWhereStatements([originalAssociation.where], originalAssociation.as));
                this.throwUnlessAllRequiredWhereClausesProvided(originalAssociation, originalAssociation.as, {});
            }
            if (originalAssociation.whereNot) {
                query = this.applyWhereStatements(query, this.aliasWhereStatements([originalAssociation.whereNot], originalAssociation.as), { negate: true });
            }
            if (originalAssociation.selfWhere) {
                query = this.applyWhereStatements(query, this.rawifiedSelfWhereClause({
                    associationAlias: originalAssociation.as,
                    selfAlias: previousAssociationTableOrAlias,
                    selfWhereClause: originalAssociation.selfWhere,
                }));
            }
            if (originalAssociation.selfWhereNot) {
                query = this.applyWhereStatements(query, this.rawifiedSelfWhereClause({
                    associationAlias: originalAssociation.as,
                    selfAlias: previousAssociationTableOrAlias,
                    selfWhereClause: originalAssociation.selfWhereNot,
                }), { negate: true });
            }
            if (originalAssociation.order) {
                query = this.applyOrderStatementForAssociation({
                    query,
                    tableNameOrAlias: originalAssociation.as,
                    association: originalAssociation,
                });
            }
        }
        if (association.type === 'BelongsTo') {
            if (Array.isArray(association.modelCB()))
                throw new cannot_join_polymorphic_belongs_to_error_1.default({
                    dreamClass,
                    association,
                    joinsStatements: this.joinsStatements,
                });
            const to = association.modelCB().table;
            const joinTableExpression = currentAssociationTableOrAlias === to
                ? currentAssociationTableOrAlias
                : `${to} as ${currentAssociationTableOrAlias}`;
            query = query.innerJoin(joinTableExpression, `${previousAssociationTableOrAlias}.${association.foreignKey()}`, `${currentAssociationTableOrAlias}.${association.primaryKey()}`);
        }
        else {
            const to = association.modelCB().table;
            const joinTableExpression = currentAssociationTableOrAlias === to
                ? currentAssociationTableOrAlias
                : `${to} as ${currentAssociationTableOrAlias}`;
            query = query.innerJoin(joinTableExpression, `${previousAssociationTableOrAlias}.${association.primaryKey()}`, `${currentAssociationTableOrAlias}.${association.foreignKey()}`);
            if (association.polymorphic) {
                query = this.applyWhereStatements(query, this.aliasWhereStatements([
                    {
                        [association.foreignKeyTypeField()]: throughClass
                            ? throughClass['stiBaseClassOrOwnClass'].name
                            : dreamClass['stiBaseClassOrOwnClass'].name,
                    },
                ], currentAssociationTableOrAlias));
            }
            if (association.where) {
                query = this.applyWhereStatements(query, this.aliasWhereStatements([association.where], currentAssociationTableOrAlias));
                this.throwUnlessAllRequiredWhereClausesProvided(association, currentAssociationTableOrAlias, joinsWhereStatements);
            }
            if (association.whereNot) {
                query = this.applyWhereStatements(query, this.aliasWhereStatements([association.whereNot], currentAssociationTableOrAlias), { negate: true });
            }
            if (association.selfWhere) {
                query = this.applyWhereStatements(query, this.rawifiedSelfWhereClause({
                    associationAlias: currentAssociationTableOrAlias,
                    selfAlias: previousAssociationTableOrAlias,
                    selfWhereClause: association.selfWhere,
                }));
            }
            if (association.selfWhereNot) {
                query = this.applyWhereStatements(query, this.rawifiedSelfWhereClause({
                    associationAlias: currentAssociationTableOrAlias,
                    selfAlias: previousAssociationTableOrAlias,
                    selfWhereClause: association.selfWhereNot,
                }), { negate: true });
            }
            if (association.order) {
                query = this.applyOrderStatementForAssociation({
                    query,
                    tableNameOrAlias: currentAssociationTableOrAlias,
                    association,
                });
            }
            if (association.distinct) {
                query = query.distinctOn(this.distinctColumnNameForAssociation({
                    association,
                    tableNameOrAlias: currentAssociationTableOrAlias,
                    foreignKey: association.foreignKey(),
                }));
            }
        }
        query = this.conditionallyApplyDefaultScopesDependentOnAssociation({
            query,
            tableNameOrAlias: currentAssociationTableOrAlias,
            association,
        });
        return {
            query,
            association,
            previousAssociationTableOrAlias,
            currentAssociationTableOrAlias,
        };
    }
    conditionallyApplyDefaultScopesDependentOnAssociation({ query, tableNameOrAlias, association, }) {
        let scopesQuery = new Query(this.dreamInstance);
        const associationClass = association.modelCB();
        const associationScopes = associationClass['scopes'].default;
        for (const scope of associationScopes) {
            if (!(0, shouldBypassDefaultScope_1.default)(scope.method, {
                bypassAllDefaultScopes: this.bypassAllDefaultScopes,
                defaultScopesToBypass: [...this.defaultScopesToBypass, ...(association.withoutDefaultScopes || [])],
            })) {
                const tempQuery = associationClass[scope.method](scopesQuery);
                // The scope method on a Dream model should return a clone of the Query it receives
                // (e.g. by returning `scope.where(...)`), but in case the function doesn't return,
                // or returns the wrong thing, we check before overriding `scopesQuery` with what the
                // method returned.
                if (tempQuery && tempQuery.constructor === scopesQuery.constructor)
                    scopesQuery = tempQuery;
            }
        }
        if (scopesQuery.whereStatements.length) {
            query = this.applyWhereStatements(query, this.aliasWhereStatements(scopesQuery.whereStatements, tableNameOrAlias));
        }
        return query;
    }
    distinctColumnNameForAssociation({ association, tableNameOrAlias, foreignKey, }) {
        if (!association.distinct)
            return null;
        if (association.distinct === true)
            return `${tableNameOrAlias}.${foreignKey}`;
        return `${tableNameOrAlias}.${association.distinct}`;
    }
    recursivelyJoin({ query, joinsStatement, joinsWhereStatements, dreamClass, previousAssociationTableOrAlias, }) {
        for (const currentAssociationTableOrAlias of Object.keys(joinsStatement)) {
            const results = this.applyOneJoin({
                query,
                dreamClass,
                previousAssociationTableOrAlias,
                currentAssociationTableOrAlias,
                joinsWhereStatements,
            });
            query = results.query;
            const association = results.association;
            query = this.recursivelyJoin({
                query,
                joinsStatement: joinsStatement[currentAssociationTableOrAlias],
                joinsWhereStatements: joinsWhereStatements[currentAssociationTableOrAlias],
                dreamClass: association.modelCB(),
                previousAssociationTableOrAlias: currentAssociationTableOrAlias,
            });
        }
        return query;
    }
    throwUnlessAllRequiredWhereClausesProvided(association, namespace, joinsWhereStatements) {
        const whereStatement = association.where;
        const columnsRequiringWhereStatements = Object.keys(whereStatement).reduce((agg, column) => {
            if (whereStatement[column] === types_1.DreamConst.required)
                agg.push(column);
            return agg;
        }, []);
        const missingRequiredWhereStatements = columnsRequiringWhereStatements.filter(column => joinsWhereStatements[namespace]?.[column] === undefined);
        if (missingRequiredWhereStatements.length)
            throw new missing_required_association_where_clause_1.default(association, missingRequiredWhereStatements[0]);
    }
    applyWhereStatements(query, whereStatements, { negate = false, } = {}) {
        ;
        [whereStatements].flat().forEach(statement => {
            query = this.applySingleWhereStatement(query, statement, { negate });
        });
        return query;
    }
    applyOrderStatementForAssociation({ query, tableNameOrAlias, association, }) {
        const orderStatement = association.order;
        if ((0, typechecks_1.isString)(orderStatement)) {
            query = query.orderBy(`${tableNameOrAlias}.${orderStatement}`, 'asc');
        }
        else {
            Object.keys(orderStatement).forEach(column => {
                const direction = orderStatement[column];
                query = query.orderBy(`${tableNameOrAlias}.${column}`, direction);
            });
        }
        if (association.type === 'HasOne') {
            query = query.limit(1);
        }
        return query;
    }
    applySingleWhereStatement(query, whereStatement, { negate = false, } = {}) {
        Object.keys(whereStatement)
            .filter(key => whereStatement[key] !== undefined && whereStatement[key] !== types_1.DreamConst.required)
            .forEach(attr => {
            const val = whereStatement[attr];
            if (val?.isOpsStatement &&
                val.shouldBypassWhereStatement) {
                // some ops statements are handled specifically in the select portion of the query,
                // and should be ommited from the where clause directly
                return;
            }
            const { a, b, c, a2, b2, c2 } = this.dreamWhereStatementToExpressionBuilderParts(attr, val);
            // postgres is unable to handle WHERE IN statements with blank arrays, such as in
            // "WHERE id IN ()", meaning that:
            // 1. If we receive a blank array during a IN comparison,
            //    then we need to simply regurgitate a where statement which
            //    guarantees no records.
            // 2. If we receive a blank array during a NOT IN comparison,
            //    then it is the same as the where statement not being present at all,
            //    resulting in a noop on our end
            if (b === 'in' && Array.isArray(c) && c.length === 0) {
                query = negate ? query.where((0, kysely_1.sql) `TRUE`) : query.where((0, kysely_1.sql) `FALSE`);
            }
            else if (b === 'not in' && Array.isArray(c) && c.length === 0) {
                query = negate ? query.where((0, kysely_1.sql) `FALSE`) : query.where((0, kysely_1.sql) `TRUE`);
            }
            else if (negate) {
                const negatedB = OPERATION_NEGATION_MAP[b];
                if (!negatedB)
                    throw new Error(`no negation available for comparison operator ${b}`);
                query = query.where(a, negatedB, c);
                if (b2) {
                    const negatedB2 = OPERATION_NEGATION_MAP[b2];
                    if (!negatedB2)
                        throw new Error(`no negation available for comparison operator ${b2}`);
                    query.where(a2, negatedB2, c2);
                }
            }
            else {
                query = query.where(a, b, c);
                if (b2)
                    query = query.where(a2, b2, c2);
            }
        });
        return query;
    }
    whereStatementsToExpressionWrappers(eb, whereStatement, { negate = false, } = {}) {
        return (0, compact_1.default)(Object.keys(whereStatement)
            .filter(key => whereStatement[key] !== undefined)
            .flatMap((attr) => {
            const val = whereStatement[attr];
            if (val?.isOpsStatement &&
                val.shouldBypassWhereStatement) {
                // some ops statements are handled specifically in the select portion of the query,
                // and should be ommited from the where clause directly
                return;
            }
            const { a, b, c, a2, b2, c2 } = this.dreamWhereStatementToExpressionBuilderParts(attr, val);
            // postgres is unable to handle WHERE IN statements with blank arrays, such as in
            // "WHERE id IN ()", meaning that:
            // 1. If we receive a blank array during a IN comparison,
            //    then we need to simply regurgitate a where statement which
            //    guarantees no records.
            // 2. If we receive a blank array during a NOT IN comparison,
            //    then it is the same as the where statement not being present at all,
            //    resulting in a noop on our end
            if (b === 'in' && Array.isArray(c) && c.length === 0) {
                return negate ? (0, kysely_1.sql) `TRUE` : (0, kysely_1.sql) `FALSE`;
            }
            else if (b === 'not in' && Array.isArray(c) && c.length === 0) {
                return negate ? (0, kysely_1.sql) `FALSE` : (0, kysely_1.sql) `TRUE`;
            }
            else if (negate) {
                const negatedB = OPERATION_NEGATION_MAP[b];
                if (!negatedB)
                    throw new Error(`no negation available for comparison operator ${b}`);
                const whereExpression = [eb(a, negatedB, c)];
                if (b2) {
                    const negatedB2 = OPERATION_NEGATION_MAP[b2];
                    if (!negatedB2)
                        throw new Error(`no negation available for comparison operator ${b2}`);
                    whereExpression.push(eb(a2, negatedB2, c2));
                }
                return whereExpression;
            }
            else {
                const whereExpression = [eb(a, b, c)];
                if (b2)
                    whereExpression.push(eb(a2, b2, c2));
                return whereExpression;
            }
        }));
    }
    orStatementsToExpressionWrappers(eb, orStatement) {
        return Object.keys(orStatement)
            .filter(key => orStatement[key] !== undefined)
            .reduce((expressionBuilderOrWrap, attr) => {
            const val = orStatement[attr];
            if (val?.isOpsStatement &&
                val.shouldBypassWhereStatement) {
                throw new Error('Similarity operator may not be used in whereAny');
            }
            const { a, b, c, a2, b2, c2 } = this.dreamWhereStatementToExpressionBuilderParts(attr, val);
            // postgres is unable to handle WHERE IN statements with blank arrays, such as in
            // "WHERE id IN ()", meaning that:
            // 1. If we receive a blank array during a IN comparison,
            //    then we need to simply regurgitate a where statement which
            //    guarantees no records.
            // 2. If we receive a blank array during a NOT IN comparison,
            //    then it is the same as the where statement not being present at all,
            //    resulting in a noop on our end
            if (b === 'in' && Array.isArray(c) && c.length === 0) {
                if (expressionBuilderOrWrap === null) {
                    return (0, kysely_1.sql) `FALSE`;
                }
                else {
                    return expressionBuilderOrWrap.and((0, kysely_1.sql) `FALSE`);
                }
            }
            else if (b === 'not in' && Array.isArray(c) && c.length === 0) {
                if (expressionBuilderOrWrap === null) {
                    return (0, kysely_1.sql) `TRUE`;
                }
                else {
                    return expressionBuilderOrWrap.and((0, kysely_1.sql) `TRUE`);
                }
            }
            else {
                if (expressionBuilderOrWrap === null) {
                    expressionBuilderOrWrap = eb(a, b, c);
                }
                else {
                    expressionBuilderOrWrap = expressionBuilderOrWrap.and(eb(a, b, c));
                }
                if (b2)
                    expressionBuilderOrWrap = expressionBuilderOrWrap.and(eb(a2, b2, c2));
                return expressionBuilderOrWrap;
            }
        }, null);
    }
    dreamWhereStatementToExpressionBuilderParts(attr, val) {
        let a;
        let b;
        let c;
        let a2 = null;
        let b2 = null;
        let c2 = null;
        if (val instanceof Function && val !== types_1.DreamConst.passthrough) {
            val = val();
        }
        else if (val === types_1.DreamConst.passthrough) {
            const column = attr.split('.').pop();
            if (this.passthroughWhereStatement[column] === undefined)
                throw new missing_required_passthrough_for_association_where_clause_1.default(column);
            val = this.passthroughWhereStatement[column];
        }
        if (val === null) {
            a = attr;
            b = 'is';
            c = val;
        }
        else if (['SelectQueryBuilder', 'SelectQueryBuilderImpl'].includes(val.constructor.name)) {
            a = attr;
            b = 'in';
            c = val;
        }
        else if (Array.isArray(val)) {
            a = attr;
            b = 'in';
            // postgres explicitly ignores null values within an IN query, but we want to be
            // explicit about the fact that we do not support null values in an array, so
            // we compact the value.
            c = (0, compact_1.default)(val);
        }
        else if (val instanceof curried_ops_statement_1.default) {
            val = val.toOpsStatement(this.dreamClass, attr);
            a = attr;
            b = val.operator;
            c = val.value;
        }
        else if (val instanceof ops_statement_1.default) {
            a = attr;
            b = val.operator;
            c = val.value;
        }
        else if (val instanceof range_1.Range) {
            const rangeStart = val.begin;
            const rangeEnd = val.end;
            const excludeEnd = val.excludeEnd;
            if (rangeStart && rangeEnd) {
                a = attr;
                b = '>=';
                c = rangeStart;
                a2 = attr;
                b2 = excludeEnd ? '<' : '<=';
                c2 = rangeEnd;
            }
            else if (rangeStart) {
                a = attr;
                b = '>=';
                c = rangeStart;
            }
            else {
                a = attr;
                b = excludeEnd ? '<' : '<=';
                c = rangeEnd;
            }
        }
        else {
            a = attr;
            b = '=';
            c = val;
        }
        if (c instanceof luxon_1.DateTime || c instanceof CalendarDate_1.default)
            c = c.toJSDate();
        if (c2 instanceof luxon_1.DateTime || c2 instanceof CalendarDate_1.default)
            c2 = c2.toJSDate();
        return { a, b, c, a2, b2, c2 };
    }
    recursivelyApplyJoinWhereStatement(query, whereJoinsStatement, previousAssociationTableOrAlias) {
        for (const key of Object.keys(whereJoinsStatement)) {
            const columnValue = whereJoinsStatement[key];
            if (columnValue.constructor !== Object) {
                query = this.applyWhereStatements(query, {
                    [`${previousAssociationTableOrAlias}.${String(key)}`]: columnValue,
                });
            }
            else {
                const currentAssociationTableOrAlias = key;
                query = this.recursivelyApplyJoinWhereStatement(query, whereJoinsStatement[currentAssociationTableOrAlias], currentAssociationTableOrAlias);
            }
        }
        return query;
    }
    buildCommon(kyselyQuery) {
        this.checkForQueryViolations();
        const query = this.conditionallyApplyDefaultScopes();
        if (!(0, lodash_isempty_1.default)(query.joinsStatements)) {
            kyselyQuery = query.recursivelyJoin({
                query: kyselyQuery,
                joinsStatement: query.joinsStatements,
                joinsWhereStatements: query.joinsWhereStatements,
                dreamClass: query.dreamClass,
                previousAssociationTableOrAlias: this.baseSqlAlias,
            });
        }
        if (query.whereStatements.length || query.whereNotStatements.length || query.orStatements.length) {
            kyselyQuery = kyselyQuery.where((eb) => {
                const whereStatement = query
                    .aliasWhereStatements(query.whereStatements, query.baseSqlAlias)
                    .flatMap(statement => this.whereStatementsToExpressionWrappers(eb, statement));
                const whereNotStatement = query
                    .aliasWhereStatements(query.whereNotStatements, query.baseSqlAlias)
                    .flatMap(statement => this.whereStatementsToExpressionWrappers(eb, statement, { negate: true }));
                const orEbs = [];
                if (query.orStatements.length) {
                    query.orStatements.forEach(orStatement => {
                        const aliasedOrStatementExpressionWrapper = query
                            .aliasWhereStatements(orStatement, query.baseSqlAlias)
                            .map(aliasedOrStatement => this.orStatementsToExpressionWrappers(eb, aliasedOrStatement));
                        orEbs.push(eb.or(aliasedOrStatementExpressionWrapper));
                    });
                }
                return eb.and((0, compact_1.default)([...whereStatement, ...whereNotStatement, ...orEbs]));
            });
        }
        if (!(0, lodash_isempty_1.default)(query.joinsWhereStatements)) {
            kyselyQuery = query.recursivelyApplyJoinWhereStatement(kyselyQuery, query.joinsWhereStatements, query.baseSqlAlias);
        }
        return kyselyQuery;
    }
    checkForQueryViolations() {
        const invalidWhereNotClauses = this.similarityStatementBuilder().whereNotStatementsWithSimilarityClauses();
        if (invalidWhereNotClauses.length) {
            const { tableName, columnName, opsStatement } = invalidWhereNotClauses[0];
            throw new cannot_negate_similarity_clause_1.default(tableName, columnName, opsStatement.value);
        }
    }
    aliasWhereStatements(whereStatements, alias) {
        return whereStatements.map(whereStatement => {
            return Object.keys(whereStatement).reduce((aliasedWhere, key) => {
                aliasedWhere[`${alias}.${key}`] = whereStatement[key];
                return aliasedWhere;
            }, {});
        });
    }
    rawifiedSelfWhereClause({ associationAlias, selfAlias, selfWhereClause, }) {
        const alphanumericUnderscoreRegexp = /[^a-zA-Z0-9_]/g;
        selfAlias = selfAlias.replace(alphanumericUnderscoreRegexp, '');
        return Object.keys(selfWhereClause).reduce((acc, key) => {
            const selfColumn = selfWhereClause[key]?.replace(alphanumericUnderscoreRegexp, '');
            if (!selfColumn)
                return acc;
            acc[`${associationAlias}.${key}`] = kysely_1.sql.raw(`"${(0, snakeify_1.default)(selfAlias)}"."${(0, snakeify_1.default)(selfColumn)}"`);
            return acc;
        }, {});
    }
    buildDelete() {
        const kyselyQuery = this.dbFor('delete').deleteFrom(this.baseSqlAlias);
        const results = this.attachLimitAndOrderStatementsToNonSelectQuery(kyselyQuery);
        return results.clone.buildCommon(results.kyselyQuery);
    }
    buildSelect({ bypassSelectAll = false, bypassOrder = false, } = {}) {
        let kyselyQuery;
        if (this.baseSelectQuery) {
            kyselyQuery = this.baseSelectQuery.buildSelect({ bypassSelectAll: true });
        }
        else {
            const from = this.baseSqlAlias === this.dreamClass.table
                ? this.dreamClass.table
                : `${this.dreamClass.table} as ${this.baseSqlAlias}`;
            kyselyQuery = this.dbFor('select').selectFrom(from);
        }
        if (this.distinctColumn) {
            kyselyQuery = kyselyQuery.distinctOn(this.distinctColumn);
        }
        kyselyQuery = this.buildCommon(kyselyQuery);
        kyselyQuery = this.conditionallyAttachSimilarityColumnsToSelect(kyselyQuery, {
            bypassOrder: bypassOrder || !!this.distinctColumn,
        });
        if (this.orderStatements.length && !bypassOrder) {
            this.orderStatements.forEach(orderStatement => {
                kyselyQuery = kyselyQuery.orderBy(this.namespaceColumn(orderStatement.column), (0, orderByDirection_1.default)(orderStatement.direction));
            });
        }
        if (this.limitStatement)
            kyselyQuery = kyselyQuery.limit(this.limitStatement);
        if (this.offsetStatement)
            kyselyQuery = kyselyQuery.offset(this.offsetStatement);
        if (!bypassSelectAll) {
            kyselyQuery = kyselyQuery.selectAll(this.baseSqlAlias);
        }
        return kyselyQuery;
    }
    buildUpdate(attributes) {
        let kyselyQuery = this.dbFor('update')
            .updateTable(this.dreamClass.table)
            .set(attributes);
        kyselyQuery = this.conditionallyAttachSimilarityColumnsToUpdate(kyselyQuery);
        const results = this.attachLimitAndOrderStatementsToNonSelectQuery(kyselyQuery);
        return results.clone.buildCommon(results.kyselyQuery);
    }
    attachLimitAndOrderStatementsToNonSelectQuery(kyselyQuery) {
        if (this.limitStatement || this.orderStatements.length) {
            kyselyQuery = kyselyQuery.where((eb) => {
                const subquery = this.nestedSelect(this.dreamInstance.primaryKey);
                return eb(this.dreamInstance.primaryKey, 'in', subquery);
            });
            return {
                kyselyQuery,
                clone: this.clone({ where: null, whereNot: null, order: null, limit: null }),
            };
        }
        return { kyselyQuery, clone: this };
    }
    get hasSimilarityClauses() {
        return this.similarityStatementBuilder().hasSimilarityClauses;
    }
    similarityStatementBuilder() {
        return new SimilarityBuilder_1.default(this.dreamInstance, {
            where: [...this.whereStatements],
            whereNot: [...this.whereNotStatements],
            joinsWhereStatements: this.joinsWhereStatements,
            transaction: this.dreamTransaction,
            connection: this.connectionOverride,
        });
    }
    conditionallyAttachSimilarityColumnsToSelect(kyselyQuery, { bypassOrder = false } = {}) {
        const similarityBuilder = this.similarityStatementBuilder();
        if (similarityBuilder.hasSimilarityClauses) {
            kyselyQuery = similarityBuilder.select(kyselyQuery, { bypassOrder });
        }
        return kyselyQuery;
    }
    conditionallyAttachSimilarityColumnsToUpdate(kyselyQuery) {
        const similarityBuilder = this.similarityStatementBuilder();
        if (similarityBuilder.hasSimilarityClauses) {
            kyselyQuery = similarityBuilder.update(kyselyQuery);
        }
        return kyselyQuery;
    }
    invertOrder() {
        let query = this.clone({ order: null });
        for (const orderStatement of this.orderStatements) {
            query = query.order({
                [orderStatement.column]: orderStatement.direction === 'desc' ? 'asc' : 'desc',
            });
        }
        return query;
    }
}
/**
 * @internal
 *
 * stores the default batch sizes for various
 * provided batching methods
 */
Query.BATCH_SIZES = {
    FIND_EACH: 1000,
    PLUCK_EACH: 10000,
    PLUCK_EACH_THROUGH: 1000,
};
exports.default = Query;
function getSourceAssociation(dream, sourceName) {
    if (!dream)
        return;
    if (!sourceName)
        return;
    return (dream['getAssociationMetadata'](sourceName) ||
        dream['getAssociationMetadata']((0, pluralize_1.singular)(sourceName)));
}
