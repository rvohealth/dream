import { DeleteQueryBuilder, SelectQueryBuilder, UpdateQueryBuilder } from 'kysely';
import ConnectedToDB from '../db/ConnectedToDB';
import { DbConnectionType } from '../db/types';
import { LimitStatement, OffsetStatement, OrderQueryStatement, PassthroughWhere, WhereStatement } from '../decorators/associations/shared';
import Dream from '../dream';
import DreamTransaction from './transaction';
import { AllDefaultScopeNames, DefaultScopeName, DreamAttributes, DreamColumn, DreamColumnNames, DreamTableSchema, FinalVariadicTableName, OrderDir, PassthroughColumnNames, RelaxedJoinsStatement, RelaxedJoinsWhereStatement, RelaxedPreloadStatement, RelaxedPreloadWhereStatement, TableColumnNames, TableColumnType, TableOrAssociationName, VariadicCountThroughArgs, VariadicJoinsArgs, VariadicLoadArgs, VariadicMinMaxThroughArgs, VariadicPluckEachThroughArgs, VariadicPluckThroughArgs } from './types';
export default class Query<DreamInstance extends Dream> extends ConnectedToDB<DreamInstance> {
    /**
     * @internal
     *
     * stores the default batch sizes for various
     * provided batching methods
     */
    static readonly BATCH_SIZES: {
        FIND_EACH: number;
        PLUCK_EACH: number;
        PLUCK_EACH_THROUGH: number;
    };
    /**
     * @internal
     *
     * stores the dream transaction applied to the
     * current Query instance
     */
    dreamTransaction: DreamTransaction<Dream> | null;
    /**
     * @internal
     *
     * stores the passthrough where statements applied to the
     * current Query instance
     */
    private readonly passthroughWhereStatement;
    /**
     * @internal
     *
     * stores the where statements applied to the
     * current Query instance
     */
    private readonly whereStatements;
    /**
     * @internal
     *
     * stores the where not statements applied to the
     * current Query instance
     */
    private readonly whereNotStatements;
    /**
     * @internal
     *
     * stores the limit statements applied to the
     * current Query instance
     */
    private readonly limitStatement;
    /**
     * @internal
     *
     * stores the offset statements applied to the
     * current Query instance
     */
    private readonly offsetStatement;
    /**
     * @internal
     *
     * stores the or statements applied to the
     * current Query instance
     */
    private readonly orStatements;
    /**
     * @internal
     *
     * stores the order statements applied to the
     * current Query instance
     */
    private readonly orderStatements;
    /**
     * @internal
     *
     * stores the preload statements applied to the
     * current Query instance
     */
    private readonly preloadStatements;
    /**
     * @internal
     *
     * stores the preload where statements applied to the
     * current Query instance
     */
    private readonly preloadWhereStatements;
    /**
     * @internal
     *
     * stores the joins statements applied to the
     * current Query instance
     */
    private readonly joinsStatements;
    /**
     * @internal
     *
     * stores the joins where statements applied to the
     * current Query instance
     */
    private readonly joinsWhereStatements;
    /**
     * @internal
     *
     * Whether or not to bypass all default scopes for this Query
     */
    private readonly bypassAllDefaultScopes;
    /**
     * @internal
     *
     * Whether or not to bypass all default scopes for this Query, but not associations
     */
    private readonly bypassAllDefaultScopesExceptOnAssociations;
    /**
     * @internal
     *
     * Specific default scopes to bypass
     */
    private readonly defaultScopesToBypass;
    /**
     * @internal
     *
     * Specific default scopes to bypass, but not associations
     */
    private readonly defaultScopesToBypassExceptOnAssociations;
    /**
     * @internal
     *
     * Whether or not to bypass SoftDelete and really destroy a record
     * when calling destroy.
     */
    private readonly shouldReallyDestroy;
    /**
     * @internal
     *
     * The distinct column to apply to the Query
     */
    private readonly distinctColumn;
    /**
     * @internal
     *
     * The base sql alias to use for the base model
     * of this Query
     */
    private baseSqlAlias;
    /**
     * @internal
     *
     * Used for unscoping Query instances. In most cases, this will be null,
     * but when calling `removeAllDefaultScopes`, a removeAllDefaultScopes Query is stored as
     * baseSelectQuery.
     */
    private baseSelectQuery;
    constructor(dreamInstance: DreamInstance, opts?: QueryOpts<DreamInstance, DreamColumnNames<DreamInstance>>);
    /**
     * Returns true. Useful for distinguishing Query instances
     * from other objects.
     *
     * @returns true
     */
    get isDreamQuery(): boolean;
    /**
     * @internal
     *
     * Used for applying preload and load statements
     *
     * @returns An associated Query
     */
    private dreamClassQueryWithScopeBypasses;
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
    clone(opts?: QueryOpts<DreamInstance>): Query<DreamInstance>;
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
    find<Schema extends DreamInstance['schema'], TableName extends keyof Schema = DreamInstance['table'] & keyof Schema>(primaryKey: Schema[TableName]['columns'][DreamInstance['primaryKey'] & keyof Schema[TableName]['columns']]['coercedType']): Promise<DreamInstance | null>;
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
    findOrFail<Schema extends DreamInstance['schema'], TableName extends keyof Schema = DreamInstance['table'] & keyof Schema>(primaryKey: Schema[TableName]['columns'][DreamInstance['primaryKey'] & keyof Schema[TableName]['columns']]['coercedType']): Promise<DreamInstance>;
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
    findBy<DB extends DreamInstance['DB'], Schema extends DreamInstance['schema']>(whereStatement: WhereStatement<DB, Schema, DreamInstance['table']>): Promise<DreamInstance | null>;
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
    findOrFailBy<DB extends DreamInstance['DB'], Schema extends DreamInstance['schema']>(whereStatement: WhereStatement<DB, Schema, DreamInstance['table']>): Promise<DreamInstance>;
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
    findEach(this: Query<DreamInstance>, cb: (instance: DreamInstance) => void | Promise<void>, { batchSize }?: {
        batchSize?: number;
    }): Promise<void>;
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
    loadInto<DB extends DreamInstance['DB'], Schema extends DreamInstance['schema'], TableName extends DreamInstance['table'], const Arr extends readonly unknown[]>(dreams: Dream[], ...args: [...Arr, VariadicLoadArgs<DB, Schema, TableName, Arr>]): Promise<void>;
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
    preload<DB extends DreamInstance['DB'], Schema extends DreamInstance['schema'], TableName extends DreamInstance['table'], const Arr extends readonly unknown[]>(...args: [...Arr, VariadicLoadArgs<DB, Schema, TableName, Arr>]): Query<DreamInstance>;
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
    joins<DB extends DreamInstance['DB'], Schema extends DreamInstance['schema'], TableName extends DreamInstance['table'], const Arr extends readonly unknown[]>(...args: [...Arr, VariadicJoinsArgs<DB, Schema, TableName, Arr>]): Query<DreamInstance>;
    /**
     * @internal
     *
     * Applies a join statement for an association
     *
     */
    private fleshOutJoinsStatements;
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
    pluckThrough<DB extends DreamInstance['DB'], Schema extends DreamInstance['schema'], TableName extends DreamInstance['table'], const Arr extends readonly unknown[]>(...args: [...Arr, VariadicPluckThroughArgs<DB, Schema, TableName, Arr>]): Promise<any[]>;
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
    pluckEachThrough<DB extends DreamInstance['DB'], Schema extends DreamInstance['schema'], TableName extends DreamInstance['table'], const Arr extends readonly unknown[]>(...args: [...Arr, VariadicPluckEachThroughArgs<DB, Schema, TableName, Arr>]): Promise<void>;
    /**
     * @internal
     *
     * Returns the last association name in the pluck throguh args
     */
    private pluckThroughArgumentsToAssociationNames;
    /**
     * @internal
     *
     * Returns the last association name in the pluck throguh args
     */
    private pluckThroughArgumentsToTargetAssociationName;
    /**
     * @internal
     *
     * Builds an association map for use when
     * applying pluckThrough statements
     *
     */
    private pluckThroughArgumentsToDreamClassesMap;
    /**
     * @internal
     *
     * Builds an association map for use when
     * applying pluckThrough statements
     *
     */
    private associationsToDreamClassesMap;
    /**
     * @internal
     *
     * Applies pluckThrough statements
     *
     */
    private fleshOutPluckThroughStatements;
    /**
     * @internal
     *
     * Changes the base sql alias
     *
     */
    private setBaseSQLAlias;
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
    private setAssociationQueryBase;
    /**
     * Prevents default scopes from applying when
     * the Query is executed
     *
     * @returns A new Query which will prevent default scopes from applying
     */
    removeAllDefaultScopes(): Query<DreamInstance>;
    /**
     * Prevents default scopes from applying when
     * the Query is executed, but not when applying to associations
     *
     * @returns A new Query which will prevent default scopes from applying, but not when applying to asociations
     */
    protected removeAllDefaultScopesExceptOnAssociations(): Query<DreamInstance>;
    /**
     * Prevents a specific default scope from applying when
     * the Query is executed
     *
     * @returns A new Query which will prevent a specific default scope from applying
     */
    removeDefaultScope(scopeName: AllDefaultScopeNames<DreamInstance>): Query<DreamInstance>;
    /**
     * Prevents a specific default scope from applying when
     * the Query is executed, but not when applying to asociations
     *
     * @returns A new Query which will prevent a specific default scope from applying, but not when applying to asociations
     */
    protected removeDefaultScopeExceptOnAssociations(scopeName: DefaultScopeName<DreamInstance>): Query<DreamInstance>;
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
    passthrough(passthroughWhereStatement: PassthroughWhere<PassthroughColumnNames<DreamInstance>>): Query<DreamInstance>;
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
    where<DB extends DreamInstance['DB'], Schema extends DreamInstance['schema']>(whereStatement: WhereStatement<DB, Schema, DreamInstance['table']> | null): Query<DreamInstance>;
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
    whereAny<DB extends DreamInstance['DB'], Schema extends DreamInstance['schema']>(whereStatements: WhereStatement<DB, Schema, DreamInstance['table']>[]): Query<DreamInstance>;
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
    whereNot<DB extends DreamInstance['DB'], Schema extends DreamInstance['schema']>(whereStatement: WhereStatement<DB, Schema, DreamInstance['table']>): Query<DreamInstance>;
    /**
     * @internal
     *
     * Applies a where clause
     */
    private _where;
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
    nestedSelect<SimpleFieldType extends keyof DreamColumnNames<DreamInstance>, PluckThroughFieldType>(this: Query<DreamInstance>, selection: SimpleFieldType | PluckThroughFieldType): SelectQueryBuilder<any, any, any>;
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
    order(arg: DreamColumnNames<DreamInstance> | Partial<Record<DreamColumnNames<DreamInstance>, OrderDir>> | null): Query<DreamInstance>;
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
    limit(limit: number | null): Query<DreamInstance>;
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
    offset(offset: number | null): Query<DreamInstance>;
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
    sql(): import("kysely").CompiledQuery<object>;
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
    toKysely<QueryType extends 'select' | 'delete' | 'update', ToKyselyReturnType = QueryType extends 'select' ? SelectQueryBuilder<DreamInstance['DB'], DreamInstance['table'], any> : QueryType extends 'delete' ? DeleteQueryBuilder<DreamInstance['DB'], DreamInstance['table'], any> : QueryType extends 'update' ? UpdateQueryBuilder<DreamInstance['DB'], DreamInstance['table'], DreamInstance['table'], any> : never>(type: QueryType): ToKyselyReturnType;
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
    txn(dreamTransaction: DreamTransaction<Dream>): Query<DreamInstance>;
    /**
     * Retrieves the number of records in the database
     *
     * ```ts
     * await User.query().count()
     * ```
     *
     * @returns The number of records in the database
     */
    count(): Promise<number>;
    /**
     * Returns new Query with distinct clause applied
     *
     * ```ts
     * await User.query().distinct('name').pluck('name')
     * ```
     *
     * @returns A cloned Query with the distinct clause applied
     */
    distinct(column?: TableColumnNames<DreamInstance['DB'], DreamInstance['table']> | boolean): Query<DreamInstance>;
    /**
     * @internal
     *
     * Returns a namespaced column name
     *
     * @returns A string
     */
    private namespaceColumn;
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
    max<ColumnName extends DreamColumnNames<DreamInstance>>(columnName: ColumnName): Promise<DreamColumn<DreamInstance, ColumnName & keyof DreamAttributes<DreamInstance>> | null>;
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
    min<ColumnName extends DreamColumnNames<DreamInstance>>(columnName: ColumnName): Promise<DreamColumn<DreamInstance, ColumnName & keyof DreamAttributes<DreamInstance>> | null>;
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
    minThrough<DB extends DreamInstance['DB'], Schema extends DreamInstance['schema'], TableName extends DreamInstance['table'], const Arr extends readonly unknown[], FinalColumnWithAlias extends VariadicMinMaxThroughArgs<DB, Schema, TableName, Arr>, FinalColumn extends FinalColumnWithAlias extends Readonly<`${string}.${infer R extends Readonly<string>}`> ? R : never, FinalTableName extends FinalVariadicTableName<DB, Schema, TableName, Arr>, FinalColumnType extends TableColumnType<Schema, FinalTableName, FinalColumn>>(...args: [...Arr, FinalColumnWithAlias]): Promise<FinalColumnType>;
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
    maxThrough<DB extends DreamInstance['DB'], Schema extends DreamInstance['schema'], TableName extends DreamInstance['table'], const Arr extends readonly unknown[], FinalColumnWithAlias extends VariadicMinMaxThroughArgs<DB, Schema, TableName, Arr>, FinalColumn extends FinalColumnWithAlias extends Readonly<`${string}.${infer R extends Readonly<string>}`> ? R : never, FinalTableName extends FinalVariadicTableName<DB, Schema, TableName, Arr>, FinalColumnType extends TableColumnType<Schema, FinalTableName, FinalColumn>>(...args: [...Arr, FinalColumnWithAlias]): Promise<FinalColumnType>;
    minMaxThrough<DB extends DreamInstance['DB'], Schema extends DreamInstance['schema']>(minOrMax: 'min' | 'max', args: unknown[]): Promise<any>;
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
    countThrough<DB extends DreamInstance['DB'], Schema extends DreamInstance['schema'], TableName extends DreamInstance['table'], const Arr extends readonly unknown[]>(...args: [...Arr, VariadicCountThroughArgs<DB, Schema, TableName, Arr>]): Promise<number>;
    /**
     * @internal
     *
     * Runs the query and extracts plucked values
     *
     * @returns An array of plucked values
     */
    private pluckWithoutMarshalling;
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
    pluck<TableName extends DreamInstance['table']>(...fields: (DreamColumnNames<DreamInstance> | `${TableName}.${DreamColumnNames<DreamInstance>}`)[]): Promise<any[]>;
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
    pluckEach<TableName extends DreamInstance['table'], CB extends (plucked: any) => void | Promise<void>>(...fields: (DreamColumnNames<DreamInstance> | `${TableName}.${DreamColumnNames<DreamInstance>}` | CB | FindEachOpts)[]): Promise<void>;
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
    all(): Promise<DreamInstance[]>;
    /**
     * @internal
     *
     * Retrieves a Query with the requested connection.
     *
     * @param connection - The connection you wish to access
     * @returns A Query with the requested connection
     */
    protected connection(connection: DbConnectionType): Query<DreamInstance>;
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
    exists(): Promise<boolean>;
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
    first(): Promise<DreamInstance | null>;
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
    firstOrFail(): Promise<DreamInstance>;
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
    last(): Promise<DreamInstance | null>;
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
    lastOrFail(): Promise<DreamInstance>;
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
    destroy({ skipHooks, cascade, }?: {
        skipHooks?: boolean;
        cascade?: boolean;
    }): Promise<number>;
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
    reallyDestroy({ skipHooks, cascade, }?: {
        skipHooks?: boolean;
        cascade?: boolean;
    }): Promise<number>;
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
    undestroy({ cascade, skipHooks, }?: {
        cascade?: boolean;
        skipHooks?: boolean;
    }): Promise<number>;
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
    delete(): Promise<number>;
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
    update(attributes: DreamTableSchema<DreamInstance>, { skipHooks }?: {
        skipHooks?: boolean;
    }): Promise<number>;
    private updateWithoutCallingModelHooks;
    /**
     * @internal
     *
     * Applies pluck values to a provided callback function
     *
     * @returns An array of pluck values
     */
    private pluckValuesToPluckResponse;
    /**
     * @internal
     *
     * Used for applying first and last queries
     *
     * @returns A dream instance or null
     */
    private takeOne;
    /**
     * @internal
     *
     * Used to hydrate dreams with the provided associations
     */
    private hydrateAssociation;
    /**
     * @internal
     *
     * Used to bridge through associations
     */
    private followThroughAssociation;
    /**
     * @internal
     *
     * Polymorphic BelongsTo. Since polymorphic associations may point to multiple tables,
     * preload by loading each target class separately.
     *
     * Used to preload polymorphic belongs to associations
     */
    private preloadPolymorphicBelongsTo;
    private preloadPolymorphicAssociationModel;
    /**
     * @internal
     *
     * Applies a preload statement
     */
    private applyOnePreload;
    /**
     * @internal
     *
     * Applies a preload statement
     */
    private hydratePreload;
    /**
     * @internal
     *
     * Applies a preload statement
     */
    private applyPreload;
    /**
     * @internal
     *
     * retrieves where statements that can be applied
     */
    private applyableWhereStatements;
    private conditionallyApplyDefaultScopes;
    private joinsBridgeThroughAssociations;
    private applyOneJoin;
    private conditionallyApplyDefaultScopesDependentOnAssociation;
    private distinctColumnNameForAssociation;
    private recursivelyJoin;
    private throwUnlessAllRequiredWhereClausesProvided;
    private applyWhereStatements;
    private applyOrderStatementForAssociation;
    private applySingleWhereStatement;
    private whereStatementsToExpressionWrappers;
    private orStatementsToExpressionWrappers;
    private dreamWhereStatementToExpressionBuilderParts;
    private recursivelyApplyJoinWhereStatement;
    private buildCommon;
    private checkForQueryViolations;
    private aliasWhereStatements;
    private rawifiedSelfWhereClause;
    private buildDelete;
    private buildSelect;
    private buildUpdate;
    private attachLimitAndOrderStatementsToNonSelectQuery;
    private get hasSimilarityClauses();
    private similarityStatementBuilder;
    private conditionallyAttachSimilarityColumnsToSelect;
    private conditionallyAttachSimilarityColumnsToUpdate;
    private invertOrder;
}
export interface QueryOpts<DreamInstance extends Dream, ColumnType extends DreamColumnNames<DreamInstance> = DreamColumnNames<DreamInstance>, Schema extends DreamInstance['schema'] = DreamInstance['schema'], DB extends DreamInstance['DB'] = DreamInstance['DB'], PassthroughColumns extends PassthroughColumnNames<DreamInstance> = PassthroughColumnNames<DreamInstance>> {
    baseSqlAlias?: TableOrAssociationName<Schema>;
    baseSelectQuery?: Query<any> | null;
    passthroughWhereStatement?: PassthroughWhere<PassthroughColumns> | null;
    where?: readonly WhereStatement<DB, Schema, any>[] | null;
    whereNot?: readonly WhereStatement<DB, Schema, any>[] | null;
    limit?: LimitStatement | null;
    offset?: OffsetStatement | null;
    or?: WhereStatement<DB, Schema, any>[][] | null;
    order?: OrderQueryStatement<ColumnType>[] | null;
    preloadStatements?: RelaxedPreloadStatement;
    preloadWhereStatements?: RelaxedPreloadWhereStatement<DB, Schema>;
    distinctColumn?: ColumnType | null;
    joinsStatements?: RelaxedJoinsStatement;
    joinsWhereStatements?: RelaxedJoinsWhereStatement<DB, Schema>;
    bypassAllDefaultScopes?: boolean;
    bypassAllDefaultScopesExceptOnAssociations?: boolean;
    defaultScopesToBypass?: AllDefaultScopeNames<DreamInstance>[];
    defaultScopesToBypassExceptOnAssociations?: DefaultScopeName<DreamInstance>[];
    transaction?: DreamTransaction<Dream> | null | undefined;
    connection?: DbConnectionType;
    shouldReallyDestroy?: boolean;
}
export interface FindEachOpts {
    batchSize?: number;
}
