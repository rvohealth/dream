import { DeleteQueryBuilder, SelectQueryBuilder, UpdateQueryBuilder } from 'kysely'
import { SOFT_DELETE_SCOPE_NAME } from '../decorators/class/SoftDelete.js'
import DreamApp from '../dream-app/index.js'
import Dream from '../Dream.js'
import AssociationDeclaredWithoutAssociatedDreamClass from '../errors/associations/AssociationDeclaredWithoutAssociatedDreamClass.js'
import CannotCallUndestroyOnANonSoftDeleteModel from '../errors/CannotCallUndestroyOnANonSoftDeleteModel.js'
import CannotPassAdditionalFieldsToPluckEachAfterCallback from '../errors/CannotPassAdditionalFieldsToPluckEachAfterCallback.js'
import LeftJoinPreloadIncompatibleWithFindEach from '../errors/LeftJoinPreloadIncompatibleWithFindEach.js'
import MissingRequiredCallbackFunctionToPluckEach from '../errors/MissingRequiredCallbackFunctionToPluckEach.js'
import NoUpdateAllOnJoins from '../errors/NoUpdateAllOnJoins.js'
import NoUpdateOnAssociationQuery from '../errors/NoUpdateOnAssociationQuery.js'
import CannotPaginateWithLimit from '../errors/pagination/CannotPaginateWithLimit.js'
import CannotPaginateWithOffset from '../errors/pagination/CannotPaginateWithOffset.js'
import RecordNotFound from '../errors/RecordNotFound.js'
import cloneDeepSafe from '../helpers/cloneDeepSafe.js'
import isObject from '../helpers/isObject.js'
import namespaceColumn from '../helpers/namespaceColumn.js'
import protectAgainstPollutingAssignment from '../helpers/protectAgainstPollutingAssignment.js'
import ops from '../ops/index.js'
import { HasManyStatement } from '../types/associations/hasMany.js'
import { HasOneStatement } from '../types/associations/hasOne.js'
import {
  AssociationStatement,
  ColumnNamesAccountingForJoinedAssociations,
  LimitStatement,
  OffsetStatement,
  OrderQueryStatement,
  PassthroughOnClause,
  WhereStatement,
  WhereStatementForJoinedAssociation,
} from '../types/associations/shared.js'
import { DbConnectionType } from '../types/db.js'
import {
  AllDefaultScopeNames,
  DefaultScopeName,
  DreamColumnNames,
  DreamConstructorType,
  DreamTableSchema,
  OrderDir,
  PassthroughColumnNames,
  PluckEachArgs,
  PrimaryKeyForFind,
  RelaxedJoinAndStatement,
  RelaxedJoinStatement,
  RelaxedPreloadOnStatement,
  RelaxedPreloadStatement,
  TableColumnNames,
  TableOrAssociationName,
} from '../types/dream.js'
import {
  DefaultQueryTypeOptions,
  ExtendQueryType,
  FindEachOpts,
  NamespacedOrBaseModelColumnTypes,
  PaginatedDreamQueryOptions,
  PaginatedDreamQueryResult,
  QueryToKyselyDBType,
  QueryToKyselyTableNamesType,
} from '../types/query.js'
import {
  JoinedAssociation,
  JoinedAssociationsTypeFromAssociations,
  QueryTypeOptions,
  VariadicJoinsArgs,
  VariadicLeftJoinLoadArgs,
  VariadicLoadArgs,
} from '../types/variadic.js'
import DreamTransaction from './DreamTransaction.js'
import computedPaginatePage from './internal/computedPaginatePage.js'
import PostgresQueryDriver from './QueryDriver/Postgres.js'

export default class Query<
  DreamInstance extends Dream,
  QueryTypeOpts extends Readonly<QueryTypeOptions> = DefaultQueryTypeOptions<DreamInstance>,
> {
  /**
   * @internal
   *
   * stores the default batch sizes for various
   * provided batching methods
   */
  public static readonly BATCH_SIZES = {
    FIND_EACH: 1000,
    PLUCK_EACH: 10000,
    PLUCK_EACH_THROUGH: 1000,
  }

  /**
   * @internal
   * purely for typing
   */
  public queryTypeOpts: QueryTypeOpts

  /**
   * @internal
   *
   * stores the dream transaction applied to the
   * current Query instance
   */
  public dreamTransaction: DreamTransaction<Dream> | null = null

  /**
   * @internal
   *
   * stores the passthrough on statements applied to the
   * current Query instance
   */
  private readonly passthroughOnStatement: PassthroughOnClause<PassthroughColumnNames<DreamInstance>> =
    Object.freeze({})

  /**
   * @internal
   *
   * stores the where statements applied to the
   * current Query instance
   */
  private readonly whereStatements: readonly WhereStatement<
    DreamInstance['DB'],
    DreamInstance['schema'],
    any
  >[] = Object.freeze([])

  /**
   * @internal
   *
   * stores the where not statements applied to the
   * current Query instance
   */
  private readonly whereNotStatements: readonly WhereStatement<
    DreamInstance['DB'],
    DreamInstance['schema'],
    any
  >[] = Object.freeze([])

  /**
   * @internal
   *
   * stores the limit statements applied to the
   * current Query instance
   */
  private readonly limitStatement: LimitStatement | null

  /**
   * @internal
   *
   * stores the offset statements applied to the
   * current Query instance
   */
  private readonly offsetStatement: OffsetStatement | null

  /**
   * @internal
   *
   * stores the or statements applied to the
   * current Query instance
   */
  private readonly whereAnyStatements: readonly WhereStatement<
    DreamInstance['DB'],
    DreamInstance['schema'],
    any
  >[][] = Object.freeze([])

  /**
   * @internal
   *
   * stores the order statements applied to the
   * current Query instance
   */
  private readonly orderStatements: readonly OrderQueryStatement<DreamColumnNames<DreamInstance>>[] =
    Object.freeze([])

  /**
   * @internal
   *
   * whether or not to turn joins into load statements
   */
  private readonly joinLoadActivated: boolean = false

  /**
   * @internal
   *
   * stores the preload statements applied to the
   * current Query instance
   */
  private readonly preloadStatements: RelaxedPreloadStatement = Object.freeze({})

  /**
   * @internal
   *
   * stores the preload on statements applied to the
   * current Query instance
   */
  private readonly preloadOnStatements: RelaxedPreloadOnStatement<
    DreamInstance['DB'],
    DreamInstance['schema']
  > = Object.freeze({})

  /**
   * @internal
   *
   * stores the joins statements applied to the
   * current Query instance
   */
  private readonly innerJoinStatements: RelaxedJoinStatement = Object.freeze({})

  /**
   * @internal
   *
   * stores the joins on statements applied to the
   * current Query instance
   */
  private readonly innerJoinAndStatements: RelaxedJoinAndStatement<
    DreamInstance['DB'],
    DreamInstance['schema']
  > = Object.freeze({})

  /**
   * @internal
   *
   * stores the joins statements applied to the
   * current Query instance
   */
  private readonly leftJoinStatements: RelaxedJoinStatement = Object.freeze({})

  /**
   * @internal
   *
   * stores the joins on statements applied to the
   * current Query instance
   */
  private readonly leftJoinAndStatements: RelaxedJoinAndStatement<
    DreamInstance['DB'],
    DreamInstance['schema']
  > = Object.freeze({})

  /**
   * @internal
   *
   * Whether or not to bypass all default scopes for this Query
   */
  private readonly bypassAllDefaultScopes: boolean = false

  /**
   * @internal
   *
   * Whether or not to bypass all default scopes for this Query, but not associations
   */
  private readonly bypassAllDefaultScopesExceptOnAssociations: boolean = false

  /**
   * @internal
   *
   * Specific default scopes to bypass
   */
  private readonly defaultScopesToBypass: AllDefaultScopeNames<DreamInstance>[] = []

  /**
   * @internal
   *
   * Specific default scopes to bypass, but not associations
   */
  private readonly defaultScopesToBypassExceptOnAssociations: DefaultScopeName<DreamInstance>[] = []

  /**
   * @internal
   *
   * Whether or not to bypass SoftDelete and really destroy a record
   * when calling destroy.
   */
  private readonly shouldReallyDestroy: boolean = false

  /**
   * @internal
   *
   * The distinct column to apply to the Query
   */
  private readonly distinctColumn: DreamColumnNames<DreamInstance> | null = null

  /**
   * @internal
   *
   * The base sql alias to use for the base model
   * of this Query
   */
  private baseSqlAlias: TableOrAssociationName<DreamInstance['schema']>

  private get tableName() {
    return this.dreamClass.table
  }

  private get namespacedPrimaryKey() {
    return namespaceColumn(this.dreamClass.primaryKey, this.baseSqlAlias)
  }

  /**
   * @internal
   *
   * Used for unscoping Query instances. In most cases, this will be null,
   * but when calling `removeAllDefaultScopes`, a removeAllDefaultScopes Query is stored as
   * baseSelectQuery.
   */
  private baseSelectQuery: Query<any, any> | null

  /*
   * Store the original opts, so we can hand them off succinctly to the
   * query executor. TODO: Should we do this?
   * */
  private originalOpts: QueryOpts<DreamInstance, DreamColumnNames<DreamInstance>>

  protected readonly dreamClass: DreamConstructorType<DreamInstance>
  public readonly dreamInstance: DreamInstance
  protected connectionOverride: DbConnectionType | undefined

  /**
   * @internal
   *
   * stores the Dream models joined in this Query instance
   */
  protected readonly innerJoinDreamClasses: readonly (typeof Dream)[] = Object.freeze([])

  constructor(
    dreamInstance: DreamInstance,
    opts: QueryOpts<DreamInstance, DreamColumnNames<DreamInstance>> = {}
  ) {
    this.dreamInstance = dreamInstance
    this.dreamClass = dreamInstance.constructor as DreamConstructorType<DreamInstance>
    this.dreamTransaction = opts.transaction || null
    this.connectionOverride = opts.connection
    this.innerJoinDreamClasses = Object.freeze(opts.innerJoinDreamClasses || [])

    this.passthroughOnStatement = Object.freeze(opts.passthroughOnStatement || {})
    this.whereStatements = Object.freeze(opts.where || [])
    this.whereNotStatements = Object.freeze(opts.whereNot || [])
    this.whereAnyStatements = Object.freeze(opts.or || [])
    this.orderStatements = Object.freeze(opts.order || [])
    this.joinLoadActivated = opts.loadFromJoins || false
    this.preloadStatements = Object.freeze(opts.preloadStatements || {})
    this.preloadOnStatements = Object.freeze(opts.preloadOnStatements || {})
    this.innerJoinStatements = Object.freeze(opts.innerJoinStatements || {})
    this.innerJoinAndStatements = Object.freeze(opts.innerJoinAndStatements || {})
    this.leftJoinStatements = Object.freeze(opts.leftJoinStatements || {})
    this.leftJoinAndStatements = Object.freeze(opts.leftJoinAndStatements || {})
    this.baseSqlAlias = opts.baseSqlAlias || this.tableName
    this.baseSelectQuery = opts.baseSelectQuery || null
    this.limitStatement = opts.limit || null
    this.offsetStatement = opts.offset || null
    this.bypassAllDefaultScopes = opts.bypassAllDefaultScopes || false
    this.bypassAllDefaultScopesExceptOnAssociations = opts.bypassAllDefaultScopesExceptOnAssociations || false
    this.defaultScopesToBypass = opts.defaultScopesToBypass || []
    this.defaultScopesToBypassExceptOnAssociations = opts.defaultScopesToBypassExceptOnAssociations || []
    this.dreamTransaction = opts.transaction || null
    this.distinctColumn = opts.distinctColumn || null
    this.connectionOverride = opts.connection
    this.shouldReallyDestroy = opts.shouldReallyDestroy || false
    this.originalOpts = Object.freeze(opts)
  }

  /**
   * Returns true. Useful for distinguishing Query instances
   * from other objects.
   *
   * @returns true
   */
  public get isDreamQuery() {
    return true
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
  public clone<Q extends Query<DreamInstance, QueryTypeOpts>>(
    this: Q,
    opts: QueryOpts<DreamInstance, any> = {}
  ): Q {
    return new Query<DreamInstance, QueryTypeOpts>(this.dreamInstance, {
      baseSqlAlias: opts.baseSqlAlias || this.baseSqlAlias,
      baseSelectQuery: opts.baseSelectQuery || this.baseSelectQuery,
      passthroughOnStatement: {
        ...this.passthroughOnStatement,
        ...opts.passthroughOnStatement,
      },

      where: opts.where === null ? [] : [...this.whereStatements, ...(opts.where || [])],
      whereNot: opts.whereNot === null ? [] : [...this.whereNotStatements, ...(opts.whereNot || [])],
      limit: opts.limit === null ? null : opts.limit !== undefined ? opts.limit : this.limitStatement || null,
      offset:
        opts.limit === null || opts.offset === null
          ? null
          : opts.offset !== undefined
            ? opts.offset
            : this.offsetStatement || null,
      or: opts.or === null ? [] : [...this.whereAnyStatements, ...(opts.or || [])],
      order: opts.order === null ? [] : [...this.orderStatements, ...(opts.order || [])],

      distinctColumn: opts.distinctColumn !== undefined ? opts.distinctColumn : this.distinctColumn,
      loadFromJoins: opts.loadFromJoins !== undefined ? opts.loadFromJoins : this.joinLoadActivated,

      // when passed, preloadStatements, preloadOnStatements, innerJoinStatements, and innerJoinAndStatements are already
      // cloned versions of the `this.` versions, handled in the `preload` and `joins` methods
      preloadStatements: opts.preloadStatements || this.preloadStatements,
      preloadOnStatements: opts.preloadOnStatements || this.preloadOnStatements,
      innerJoinDreamClasses: opts.innerJoinDreamClasses || this.innerJoinDreamClasses,
      innerJoinStatements: opts.innerJoinStatements || this.innerJoinStatements,
      innerJoinAndStatements: opts.innerJoinAndStatements || this.innerJoinAndStatements,
      leftJoinStatements: opts.leftJoinStatements || this.leftJoinStatements,
      leftJoinAndStatements: opts.leftJoinAndStatements || this.leftJoinAndStatements,
      // end:when passed, preloadStatements, preloadOnStatements, innerJoinStatements, and innerJoinAndStatements are already...

      bypassAllDefaultScopes:
        opts.bypassAllDefaultScopes !== undefined ? opts.bypassAllDefaultScopes : this.bypassAllDefaultScopes,
      bypassAllDefaultScopesExceptOnAssociations:
        opts.bypassAllDefaultScopesExceptOnAssociations !== undefined
          ? opts.bypassAllDefaultScopesExceptOnAssociations
          : this.bypassAllDefaultScopesExceptOnAssociations,
      defaultScopesToBypass:
        opts.defaultScopesToBypass !== undefined ? opts.defaultScopesToBypass : this.defaultScopesToBypass,

      defaultScopesToBypassExceptOnAssociations:
        opts.defaultScopesToBypassExceptOnAssociations !== undefined
          ? opts.defaultScopesToBypassExceptOnAssociations
          : this.defaultScopesToBypassExceptOnAssociations,

      transaction: opts.transaction || this.dreamTransaction,
      connection: opts.connection || this.connectionOverride,
      shouldReallyDestroy:
        opts.shouldReallyDestroy !== undefined ? opts.shouldReallyDestroy : this.shouldReallyDestroy,
    }) as Q
  }

  /**
   * Finds a record matching the Query with the
   * specified primary key. If not found, null
   * is returned.
   *
   * ```ts
   * await User.query().find(123)
   * // User{id: 123}
   * ```
   *
   * @param primaryKey - The primary key of the record to look up
   * @returns Either the found record, or else null
   */
  public async find(primaryKey: PrimaryKeyForFind<DreamInstance>): Promise<DreamInstance | null> {
    if (!primaryKey) return null

    return await this.where({
      [this.dreamInstance.primaryKey]: primaryKey,
    } as any).first()
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
   * @param primaryKey - The primary key of the record to look up
   * @returns The found record
   */
  public async findOrFail(primaryKey: PrimaryKeyForFind<DreamInstance>): Promise<DreamInstance> {
    const record = await this.find(primaryKey)
    if (!record) throw new RecordNotFound(this.dreamInstance['sanitizedConstructorName'])
    return record
  }

  /**
   * Finds a record matching the Query and the
   * specified where statement. If not found, null
   * is returned.
   *
   * ```ts
   * await User.query().findBy({ email: 'how@yadoin' })
   * // User{email: 'how@yadoin'}
   * ```
   *
   * @param whereStatement - The where statement used to locate the record
   * @returns Either the first record found matching the attributes, or else null
   */
  public async findBy<DB extends DreamInstance['DB'], Schema extends DreamInstance['schema']>(
    whereStatement: WhereStatement<DB, Schema, DreamInstance['table']>
  ): Promise<DreamInstance | null> {
    return await this._where(whereStatement, 'where').first()
  }

  /**
   * Finds a record matching the Query and the
   * specified where statement. If not found, an exception
   * is raised.
   *
   * ```ts
   * await User.query().findOrFailBy({ email: 'how@yadoin' })
   * // User{email: 'how@yadoin'}
   * ```
   *
   * @param whereStatement - The where statement used to locate the record
   * @returns The first record found matching the attributes
   */
  public async findOrFailBy<DB extends DreamInstance['DB'], Schema extends DreamInstance['schema']>(
    whereStatement: WhereStatement<DB, Schema, DreamInstance['table']>
  ): Promise<DreamInstance> {
    const record = await this.findBy(whereStatement)
    if (!record) throw new RecordNotFound(this.dreamInstance['sanitizedConstructorName'])
    return record
  }

  /**
   * Finds all records matching the Query in batches,
   * and then calls the provided callback for each found record.
   * Once all records have been passed for a given batch, the next set of
   * records will be fetched and passed to your callback, until all
   * records matching the Query have been fetched.
   *
   * ```ts
   * await User.order('id').findEach(user => {
   *   DreamApp.log(user)
   * })
   * // User{id: 1}
   * // User{id: 2}
   * ```
   *
   * @param cb - The callback to call for each found record
   * @param options - Options for destroying the instance
   * @param options.batchSize - The batch size you wish to collect records in. If not provided, it will default to 1000
   * @returns void
   */
  public async findEach(
    this: Query<DreamInstance, QueryTypeOpts>,
    cb: (instance: DreamInstance) => void | Promise<void>,
    { batchSize = Query.BATCH_SIZES.FIND_EACH }: { batchSize?: number } = {}
  ): Promise<void> {
    if (this.joinLoadActivated) throw new LeftJoinPreloadIncompatibleWithFindEach()
    let records: any[]
    const query = this.order(null)
      .order(this.namespacedPrimaryKey as any)
      .limit(batchSize as any)
    let lastId = null

    do {
      if (lastId)
        records = await query.where({ [this.dreamInstance.primaryKey]: ops.greaterThan(lastId) } as any).all()
      else records = await query.all()

      for (const record of records) {
        await cb(record)
      }

      lastId = records.at(-1)?.primaryKeyValue
    } while (records.length > 0 && records.length === batchSize)
  }

  /**
   * Load each specified association using a single SQL query.
   * See {@link #preload} for preloading in separate queries.
   *
   * Note: since leftJoinPreload loads via single query, it has
   * some downsides and that may be avoided using {@link #preload}:
   * 1. `limit` and `offset` will be automatically removed
   * 2. `through` associations will bring additional namespaces into the query that can conflict with through associations from other associations, creating an invalid query
   * 3. each nested association will result in an additional record which duplicates data from the outer record. E.g., given `.leftJoinPreload('a', 'b', 'c')`, if each `a` has 10 `b` and each `b` has 10 `c`, then for one `a`, 100 records will be returned, each of which has all of the columns of `a`. `.preload('a', 'b', 'c')` would perform three separate SQL queries, but the data for a single `a` would only be returned once.
   * 4. the individual query becomes more complex the more associations are included
   * 5. associations loading associations loading associations could result in exponential amounts of data; in those cases, `.preload(...).findEach(...)` avoids instantiating massive amounts of data at once
   *
   *
   * ```ts
   * const posts = await user.associationQuery('posts').leftJoinPreload('comments', { visibilty: 'public' }, 'replies').all()
   * console.log(posts[0].comments[0].replies[0])
   * // [Reply{id: 1}, Reply{id: 2}]
   * ```
   *
   * @param args - A chain of association names and and/andNot/andAny clauses
   * @returns A cloned Query with the joinLoad statement applied
   */
  public leftJoinPreload<
    Q extends Query<DreamInstance, any>,
    DB extends DreamInstance['DB'],
    Schema extends DreamInstance['schema'],
    TableName extends DreamInstance['table'],
    const Arr extends readonly unknown[],
    const LastArg extends VariadicLeftJoinLoadArgs<DB, Schema, TableName, Arr>,
    Incompatible extends Q['queryTypeOpts'] extends Readonly<{ allowLeftJoinPreload: false }> ? true : false,
    const JoinedAssociationsCandidate = JoinedAssociationsTypeFromAssociations<
      DB,
      Schema,
      TableName,
      Incompatible extends true ? [] : [...Arr, LastArg]
    >,
    const JoinedAssociations extends
      readonly JoinedAssociation[] = JoinedAssociationsCandidate extends readonly JoinedAssociation[]
      ? JoinedAssociationsCandidate
      : never,
    RetQuery = Query<
      DreamInstance,
      ExtendQueryType<
        QueryTypeOpts,
        Readonly<{
          joinedAssociations: JoinedAssociations
          allowPreload: false
          allowLimit: false
          allowOffset: false
          allowPaginate: false
        }>
      >
    >,
  >(
    this: Q,
    ...args: Incompatible extends true
      ? 'leftJoinPreload is incompatible with preload, limit, offset, and paginate'[]
      : [...Arr, LastArg]
  ): RetQuery {
    const untypedArgs: any[] = [...args] as any[]
    const lastAssociations = [untypedArgs.pop()].flat()

    let joinedClone = this

    lastAssociations.forEach(associationName => {
      joinedClone = joinedClone.leftJoin(...untypedArgs, associationName)
    })

    return joinedClone.clone({ loadFromJoins: true }) as any
  }

  /**
   * Load each specified association using a separate SQL query.
   * See {@link #leftJoinPreload} for preloading in a single query.
   *
   * ```ts
   * const user = await User.query().preload('posts', 'comments', { visibilty: 'public' }, 'replies').first()
   * console.log(user.posts[0].comments[0].replies[0])
   * // [Reply{id: 1}, Reply{id: 2}]
   * ```
   *
   * @param args - A chain of association names and and/andNot/andAny clauses
   * @returns A cloned Query with the preload statement applied
   */
  public preload<
    Q extends Query<DreamInstance, any>,
    DB extends DreamInstance['DB'],
    Schema extends DreamInstance['schema'],
    TableName extends DreamInstance['table'],
    const Arr extends readonly unknown[],
    Incompatible extends Q['queryTypeOpts'] extends Readonly<{ allowPreload: false }> ? true : false,
    RetQuery = Query<
      DreamInstance,
      ExtendQueryType<
        QueryTypeOpts,
        Readonly<{
          allowLeftJoinPreload: false
        }>
      >
    >,
  >(
    this: Q,
    ...args: Incompatible extends true
      ? 'preload is incompatible with leftJoinPreload'[]
      : [...Arr, VariadicLoadArgs<DB, Schema, TableName, Arr>]
  ): RetQuery {
    const preloadStatements = cloneDeepSafe(this.preloadStatements)

    const preloadOnStatements: RelaxedPreloadOnStatement<DB, Schema> = cloneDeepSafe(this.preloadOnStatements)

    this.fleshOutJoinStatements([], preloadStatements, preloadOnStatements, null, [...(args as any)])
    return this.clone({ preloadStatements, preloadOnStatements: preloadOnStatements }) as unknown as RetQuery
  }

  /**
   * Returns a new Query instance, with the provided
   * joins statement attached
   *
   * ```ts
   * await User.query().innerJoin('posts').first()
   * ```
   *
   * @param args - A chain of association names and and/andNot/andAny clauses
   * @returns A cloned Query with the joins clause applied
   */
  public innerJoin<
    DB extends DreamInstance['DB'],
    Schema extends DreamInstance['schema'],
    TableName extends DreamInstance['table'],
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
    RetQuery = Query<
      DreamInstance,
      ExtendQueryType<
        QueryTypeOpts,
        Readonly<{
          joinedAssociations: JoinedAssociations
        }>
      >
    >,
  >(...args: [...Arr, LastArg]): RetQuery {
    const innerJoinDreamClasses: (typeof Dream)[] = [...this.innerJoinDreamClasses]
    const innerJoinStatements = cloneDeepSafe(this.innerJoinStatements)

    const innerJoinAndStatements: RelaxedJoinAndStatement<DB, Schema> = cloneDeepSafe(
      this.innerJoinAndStatements
    )

    this.fleshOutJoinStatements(
      innerJoinDreamClasses as any,
      innerJoinStatements,
      innerJoinAndStatements,
      null,
      [...(args as any)]
    )

    return this.clone({
      innerJoinDreamClasses,
      innerJoinStatements,
      innerJoinAndStatements,
    }) as any
  }

  /**
   * @internal
   *
   * @param args - A chain of association names and and/andNot/andAny clauses
   * @returns A cloned Query with the joins clause applied
   */
  public leftJoin<
    DB extends DreamInstance['DB'],
    Schema extends DreamInstance['schema'],
    TableName extends DreamInstance['table'],
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
    RetQuery = Query<
      DreamInstance,
      ExtendQueryType<
        QueryTypeOpts,
        Readonly<{
          joinedAssociations: JoinedAssociations
        }>
      >
    >,
  >(...args: [...Arr, LastArg]): RetQuery {
    const innerJoinDreamClasses: (typeof Dream)[] = [...this.innerJoinDreamClasses]
    const leftJoinStatements = cloneDeepSafe(this.leftJoinStatements)

    const leftJoinAndStatements: RelaxedJoinAndStatement<DB, Schema> = cloneDeepSafe(
      this.leftJoinAndStatements
    )

    this.fleshOutJoinStatements(innerJoinDreamClasses, leftJoinStatements, leftJoinAndStatements, null, [
      ...(args as any),
    ])

    return this.clone({
      innerJoinDreamClasses,
      leftJoinStatements,
      leftJoinAndStatements,
    }) as any
  }

  /**
   * @internal
   *
   */
  private fleshOutJoinStatements<DB extends DreamInstance['DB'], Schema extends DreamInstance['schema']>(
    innerJoinDreamClasses: (typeof Dream)[],
    joinStatements: RelaxedJoinStatement,
    joinAndStatements: RelaxedJoinAndStatement<DB, Schema>,
    previousAssociationName: null | string,
    associationStatements: (string | WhereStatement<DB, Schema, any> | undefined)[],
    previousDreamClass: typeof Dream | null = this.dreamClass
  ) {
    const nextAssociationStatement = associationStatements.shift()

    if (nextAssociationStatement === undefined) {
      // just satisfying typing
    } else if (typeof nextAssociationStatement === 'string') {
      const nextStatement = nextAssociationStatement

      if (!joinStatements[nextStatement])
        joinStatements[protectAgainstPollutingAssignment(nextStatement)] = {}
      if (!joinAndStatements[nextStatement])
        joinAndStatements[protectAgainstPollutingAssignment(nextStatement)] = {}

      const nextDreamClass = this.addAssociatedDreamClassToInnerJoinDreamClasses(
        previousDreamClass,
        nextStatement,
        innerJoinDreamClasses
      )

      const nextJoinsStatements = joinStatements[nextStatement]
      const nextJoinsOnStatements = joinAndStatements[nextStatement] as RelaxedJoinAndStatement<DB, Schema>

      this.fleshOutJoinStatements(
        innerJoinDreamClasses,
        nextJoinsStatements as any,
        nextJoinsOnStatements,
        nextStatement,
        associationStatements,
        nextDreamClass
      )

      //
    } else if (Array.isArray(nextAssociationStatement)) {
      // this supports the final argument of load/preload statements
      nextAssociationStatement.forEach((associationName: string) => {
        this.addAssociatedDreamClassToInnerJoinDreamClasses(
          previousDreamClass,
          associationName,
          innerJoinDreamClasses
        )
      })

      nextAssociationStatement.forEach(associationStatement => {
        joinStatements[protectAgainstPollutingAssignment(associationStatement)] = {}
      })
      //
    } else if (isObject(nextAssociationStatement) && previousAssociationName) {
      const clonedNextAssociationStatement = cloneDeepSafe(nextAssociationStatement)

      const keys = Object.keys(clonedNextAssociationStatement)

      keys.forEach((key: string) => {
        joinAndStatements[protectAgainstPollutingAssignment(key)] = (clonedNextAssociationStatement as any)[
          key
        ]
      })

      this.fleshOutJoinStatements(
        innerJoinDreamClasses,
        joinStatements,
        joinAndStatements,
        previousAssociationName,
        associationStatements,
        previousDreamClass
      )
    }
  }

  /**
   * @internal
   *
   * Adds Dream class to temporary innerJoinDreamClasses array based on association name
   *
   */
  private addAssociatedDreamClassToInnerJoinDreamClasses(
    previousDreamClass: typeof Dream | null,
    associationName: string,
    innerJoinDreamClasses: (typeof Dream)[]
  ): typeof Dream | null {
    if (!previousDreamClass) return null

    const association = (previousDreamClass['associationMetadataMap']() as any)[
      associationName
    ] as AssociationStatement
    if (!association) return null

    this.addThroughAssociatedDreamClassToInnerJoinDreamClasses(
      previousDreamClass,
      association,
      innerJoinDreamClasses
    )

    const dreamClasses = [association.modelCB()].flat()
    dreamClasses.forEach(dreamClass => innerJoinDreamClasses.push(dreamClass))

    const dreamClass = dreamClasses[0]
    if (dreamClass === undefined)
      throw new AssociationDeclaredWithoutAssociatedDreamClass(previousDreamClass, association.as)

    return dreamClass
  }

  private addThroughAssociatedDreamClassToInnerJoinDreamClasses(
    dreamClass: typeof Dream,
    _association: AssociationStatement,
    innerJoinDreamClasses: (typeof Dream)[]
  ) {
    const association = _association as
      | HasManyStatement<any, any, any, any>
      | HasOneStatement<any, any, any, any>
    const throughAssociationName = association.through
    if (!throughAssociationName) return

    const throughAssociation = (dreamClass['associationMetadataMap']() as any)[
      throughAssociationName
    ] as AssociationStatement

    if (!throughAssociation) return

    const throughDreamClass = [throughAssociation.modelCB()].flat()[0]
    if (throughDreamClass === undefined)
      throw new AssociationDeclaredWithoutAssociatedDreamClass(dreamClass, throughAssociation.as)

    innerJoinDreamClasses.push(throughDreamClass)

    this.addThroughAssociatedDreamClassToInnerJoinDreamClasses(
      dreamClass,
      throughAssociation,
      innerJoinDreamClasses
    )
  }

  /**
   * @internal
   *
   * Changes the base sql alias
   *
   */
  private setBaseSQLAlias<Schema extends DreamInstance['schema']>(
    baseSqlAlias: TableOrAssociationName<Schema>
  ) {
    return this.clone({ baseSqlAlias })
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
  private setAssociationQueryBase(baseSelectQuery: Query<any, any>) {
    return this.clone({
      baseSelectQuery: baseSelectQuery.removeAllDefaultScopesExceptOnAssociations(),
      bypassAllDefaultScopesExceptOnAssociations: true,
    })
  }

  /**
   * Prevents default scopes from applying when
   * the Query is executed
   *
   * @returns A new Query which will prevent default scopes from applying
   */
  public removeAllDefaultScopes(): Query<DreamInstance, QueryTypeOpts> {
    return this.clone({
      bypassAllDefaultScopes: true,
      baseSelectQuery: this.baseSelectQuery?.removeAllDefaultScopes(),
    })
  }

  /**
   * Prevents default scopes from applying when
   * the Query is executed, but not when applying to associations
   *
   * @returns A new Query which will prevent default scopes from applying, but not when applying to asociations
   */
  protected removeAllDefaultScopesExceptOnAssociations(): Query<DreamInstance, QueryTypeOpts> {
    return this.clone({
      bypassAllDefaultScopesExceptOnAssociations: true,
      baseSelectQuery: this.baseSelectQuery?.removeAllDefaultScopesExceptOnAssociations(),
    })
  }

  /**
   * Prevents a specific default scope from applying when
   * the Query is executed
   *
   * @returns A new Query which will prevent a specific default scope from applying
   */
  public removeDefaultScope(
    scopeName: AllDefaultScopeNames<DreamInstance>
  ): Query<DreamInstance, QueryTypeOpts> {
    return this.clone({
      defaultScopesToBypass: [...this.defaultScopesToBypass, scopeName],
      baseSelectQuery: this.baseSelectQuery?.removeDefaultScope(scopeName),
    })
  }

  /**
   * Prevents a specific default scope from applying when
   * the Query is executed, but not when applying to asociations
   *
   * @returns A new Query which will prevent a specific default scope from applying, but not when applying to asociations
   */
  protected removeDefaultScopeExceptOnAssociations(
    scopeName: DefaultScopeName<DreamInstance>
  ): Query<DreamInstance, QueryTypeOpts> {
    return this.clone({
      defaultScopesToBypassExceptOnAssociations: [
        ...this.defaultScopesToBypassExceptOnAssociations,
        scopeName,
      ],
      baseSelectQuery: this.baseSelectQuery?.removeDefaultScopeExceptOnAssociations(scopeName),
    })
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
   *     and: { locale: DreamConst.passthrough },
   *   })
   *   public currentLocalizedText: LocalizedText
   * }
   *
   * await User.query().passthrough({ locale: 'es-ES' })
   *   .preload('posts', 'currentLocalizedText')
   *   .first()
   * ```
   *
   * @param passthroughOnStatement - where statement used for associations that require passthrough data
   * @returns A cloned Query with the passthrough data
   */
  public passthrough(passthroughOnStatement: PassthroughOnClause<PassthroughColumnNames<DreamInstance>>) {
    return this.clone({ passthroughOnStatement: passthroughOnStatement })
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
  public where<DB extends DreamInstance['DB'], Schema extends DreamInstance['schema']>(
    whereStatement: WhereStatementForJoinedAssociation<
      QueryTypeOpts['joinedAssociations'],
      DB,
      Schema,
      QueryTypeOpts['rootTableName']
    > | null
  ): Query<DreamInstance, QueryTypeOpts> {
    return this._where(whereStatement as any, 'where')
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
  public whereAny<DB extends DreamInstance['DB'], Schema extends DreamInstance['schema']>(
    whereStatements:
      | WhereStatementForJoinedAssociation<
          QueryTypeOpts['joinedAssociations'],
          DB,
          Schema,
          QueryTypeOpts['rootTableName']
        >[]
      | null
  ): Query<DreamInstance, QueryTypeOpts> {
    return this.clone({
      or: whereStatements ? [(whereStatements as any).map((obj: any) => ({ ...obj }))] : whereStatements,
    })
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
  public whereNot<DB extends DreamInstance['DB'], Schema extends DreamInstance['schema']>(
    whereStatement: WhereStatementForJoinedAssociation<
      QueryTypeOpts['joinedAssociations'],
      DB,
      Schema,
      QueryTypeOpts['rootTableName']
    > | null
  ): Query<DreamInstance, QueryTypeOpts> {
    return this._where(whereStatement, 'whereNot')
  }

  /**
   * @internal
   *
   * Applies a where clause
   */
  private _where(
    whereStatement: WhereStatement<any, any, any> | null,
    typeOfWhere: 'where' | 'whereNot'
  ): Query<DreamInstance, QueryTypeOpts> {
    return this.clone({
      [typeOfWhere]: whereStatement === null ? null : [{ ...whereStatement }],
    })
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
  public nestedSelect<SimpleFieldType extends keyof DreamColumnNames<DreamInstance>, PluckThroughFieldType>(
    this: Query<DreamInstance, QueryTypeOpts>,
    selection: SimpleFieldType | PluckThroughFieldType
  ) {
    return this.dbDriverInstance().nestedSelect(selection)
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

  public order<
    Q extends Query<DreamInstance, QueryTypeOpts>,
    DB extends DreamInstance['DB'],
    ColumnName extends ColumnNamesAccountingForJoinedAssociations<
      Q['queryTypeOpts']['joinedAssociations'],
      DB,
      QueryTypeOpts['rootTableName'],
      QueryTypeOpts['rootTableAlias']
    >,
  >(arg: ColumnName | Partial<Record<ColumnName, OrderDir>> | null) {
    if (arg === null) return this.clone({ order: null })
    if (typeof arg === 'string') return this.clone({ order: [{ column: arg as any, direction: 'asc' }] })

    let query = this.clone()

    Object.keys(arg).forEach(key => {
      const column = key as DreamColumnNames<DreamInstance>
      const direction = (arg as any)[key] as OrderDir

      query = query.clone({
        order: [{ column: column as any, direction }],
      })
    })

    return query
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
  public limit<
    Q extends Query<DreamInstance, any>,
    Incompatible extends Q['queryTypeOpts'] extends Readonly<{ allowLimit: false }> ? true : false,
    RetQuery = Query<
      DreamInstance,
      ExtendQueryType<
        QueryTypeOpts,
        Readonly<{
          allowPaginate: false
          allowLeftJoinPreload: false
        }>
      >
    >,
  >(
    this: Q,
    limit: Incompatible extends true
      ? 'limit is incompatible with paginate and leftJoinPreload'[]
      : number | null
  ): RetQuery {
    return this.clone({ limit: limit as unknown as number | null }) as unknown as RetQuery
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
  public offset<
    Q extends Query<DreamInstance, any>,
    Incompatible extends Q['queryTypeOpts'] extends Readonly<{ allowOffset: false }> ? true : false,
    RetQuery = Query<
      DreamInstance,
      ExtendQueryType<
        QueryTypeOpts,
        Readonly<{
          allowPaginate: false
          allowLeftJoinPreload: false
        }>
      >
    >,
  >(
    this: Q,
    offset: Incompatible extends true
      ? 'offset is incompatible with paginate and leftJoinPreload'[]
      : number | null
  ): RetQuery {
    return this.clone({ offset: offset as unknown as number | null }) as unknown as RetQuery
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
  public sql() {
    return this.dbDriverInstance().sql()
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
  public toKysely<
    QueryType extends 'select' | 'delete' | 'update',
    DbType = QueryToKyselyDBType<typeof this>,
    TableNames = QueryToKyselyTableNamesType<typeof this>,
    ToKyselyReturnType = QueryType extends 'select'
      ? SelectQueryBuilder<DbType, TableNames & keyof DbType, unknown>
      : QueryType extends 'delete'
        ? DeleteQueryBuilder<DbType, TableNames & keyof DbType, unknown>
        : QueryType extends 'update'
          ? UpdateQueryBuilder<DbType, TableNames & keyof DbType, TableNames & keyof DbType, unknown>
          : never,
  >(type: QueryType) {
    switch (type) {
      case 'select':
        return this.dbDriverInstance()['buildSelect']() as ToKyselyReturnType

      case 'delete':
        return this.dbDriverInstance()['buildDelete']() as ToKyselyReturnType

      case 'update':
        return this.dbDriverInstance()['buildUpdate']({}) as ToKyselyReturnType

      // TODO: in the future, we should support insert type, but don't yet, since inserts are done outside
      // the query class for some reason.
      default: {
        // protection so that if a new QueryType is ever added, this will throw a type error at build time
        const _never: never = type
        throw new Error(`Unhandled QueryType: ${_never as string}`)
      }
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
  public txn(dreamTransaction: DreamTransaction<Dream> | null) {
    return this.clone({ transaction: dreamTransaction })
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
  public async count() {
    return await this.dbDriverInstance().count()
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
  public distinct(column: TableColumnNames<DreamInstance['DB'], DreamInstance['table']> | boolean = true) {
    if (column === true) {
      return this.clone({
        distinctColumn: this.namespaceColumn(
          this.dreamInstance.primaryKey
        ) as DreamColumnNames<DreamInstance>,
      })
    } else if (column === false) {
      return this.clone({ distinctColumn: null })
    } else {
      return this.clone({ distinctColumn: this.namespaceColumn(column) as DreamColumnNames<DreamInstance> })
    }
  }

  /**
   * @internal
   *
   * Returns a namespaced column name
   *
   * @returns A string
   */
  private namespaceColumn(column: string, alias: string = this.baseSqlAlias) {
    return namespaceColumn(column, alias)
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
  public async max<
    Q extends Query<DreamInstance, QueryTypeOpts>,
    DB extends DreamInstance['DB'],
    ColumnName extends ColumnNamesAccountingForJoinedAssociations<
      Q['queryTypeOpts']['joinedAssociations'],
      DB,
      QueryTypeOpts['rootTableName'],
      QueryTypeOpts['rootTableAlias']
    >,
    ReturnType extends NamespacedOrBaseModelColumnTypes<[ColumnName], Q, DreamInstance>[0],
  >(columnName: ColumnName): Promise<ReturnType> {
    return await this.dbDriverInstance().max(columnName)
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
  public async min<
    Q extends Query<DreamInstance, QueryTypeOpts>,
    DB extends DreamInstance['DB'],
    ColumnName extends ColumnNamesAccountingForJoinedAssociations<
      Q['queryTypeOpts']['joinedAssociations'],
      DB,
      QueryTypeOpts['rootTableName'],
      QueryTypeOpts['rootTableAlias']
    >,
    ReturnType extends NamespacedOrBaseModelColumnTypes<[ColumnName], Q, DreamInstance>[0],
  >(columnName: ColumnName): Promise<ReturnType> {
    return await this.dbDriverInstance().min(columnName)
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
   * @param columnNames - The column or array of columns to pluck
   * @returns An array of pluck results
   */
  public async pluck<
    Q extends Query<DreamInstance, QueryTypeOpts>,
    DB extends DreamInstance['DB'],
    const ColumnNames extends ColumnNamesAccountingForJoinedAssociations<
      Q['queryTypeOpts']['joinedAssociations'],
      DB,
      QueryTypeOpts['rootTableName'],
      QueryTypeOpts['rootTableAlias']
    >[],
    ReturnValue extends ColumnNames['length'] extends 1
      ? NamespacedOrBaseModelColumnTypes<ColumnNames, Q, DreamInstance>[0][]
      : NamespacedOrBaseModelColumnTypes<ColumnNames, Q, DreamInstance>[],
  >(this: Q, ...columnNames: ColumnNames): Promise<ReturnValue> {
    const vals = await this.dbDriverInstance().pluck(...(columnNames as any[]))

    return (columnNames.length > 1 ? vals : vals.flat()) as ReturnValue
  }

  /**
   * Plucks the specified column names from the given dream class table
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
   * @param args - a list of column names to pluck, followed by a callback function to call for each set of found fields
   * @returns void
   */
  public async pluckEach<
    Q extends Query<DreamInstance, QueryTypeOpts>,
    DB extends DreamInstance['DB'],
    const ColumnNames extends ColumnNamesAccountingForJoinedAssociations<
      Q['queryTypeOpts']['joinedAssociations'],
      DB,
      QueryTypeOpts['rootTableName'],
      QueryTypeOpts['rootTableAlias']
    >[],
    CbArgTypes extends NamespacedOrBaseModelColumnTypes<ColumnNames, Q, DreamInstance>,
  >(this: Q, ...args: PluckEachArgs<ColumnNames, CbArgTypes>): Promise<void> {
    const providedCbIndex = args.findIndex(v => typeof v === 'function')
    const providedCb = args[providedCbIndex] as unknown as (...plucked: any[]) => void | Promise<void>
    const providedOpts = args[providedCbIndex + 1] as FindEachOpts

    if (!providedCb) throw new MissingRequiredCallbackFunctionToPluckEach('pluckEach', args)
    if (providedOpts !== undefined && !providedOpts?.batchSize)
      throw new CannotPassAdditionalFieldsToPluckEachAfterCallback('pluckEach', args)

    const onlyColumns = args.filter(
      (_, index) => index < providedCbIndex
    ) as DreamColumnNames<DreamInstance>[]

    const batchSize = providedOpts?.batchSize || Query.BATCH_SIZES.PLUCK_EACH_THROUGH

    let offset = 0
    let records: any[]
    do {
      const onlyIncludesPrimaryKey = onlyColumns.find(
        column => column === this.dreamClass.primaryKey || column === this.namespacedPrimaryKey
      )
      const columnsIncludingPrimaryKey: DreamColumnNames<DreamInstance>[] = onlyIncludesPrimaryKey
        ? onlyColumns
        : [this.namespacedPrimaryKey, ...onlyColumns]

      const query = this.offset(offset as any)
        .order(null)
        .order(this.namespacedPrimaryKey as any)
        .limit(batchSize as any)

      records = await this.dbDriverInstance(query).pluck(...columnsIncludingPrimaryKey)

      // In order to batch, we need to order by primary key, so the primary key must be plucked.
      // If the developer did not include the primary key in the columns to pluck, then we prepended it above
      // and need to remove it from each group of plucked columns prior to passing them into the callback functions
      const vals = onlyIncludesPrimaryKey ? records : records.map(valueArr => valueArr.slice(1))

      for (const val of vals) {
        await providedCb(...val)
      }

      offset += batchSize
    } while (records.length > 0 && records.length === batchSize)
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
  public async all(
    options: {
      columns?: DreamColumnNames<DreamInstance>[]
    } = {}
  ) {
    return await this.dbDriverInstance().takeAll(options)
  }

  public static dbDriverClass<T extends Dream>() {
    return PostgresQueryDriver<T>
  }

  public dbDriverInstance(query: Query<DreamInstance, any> = this) {
    const driverClass = Query.dbDriverClass<DreamInstance>()
    return new driverClass(query)
  }

  /**
   * Paginates the results of your query, accepting a pageSize and page argument,
   * which it uses to segment your query into pages, leveraging limit and offset
   * to deliver your query to you in pages.
   *
   * ```ts
   * const paginated = await User.order('email').paginate({ pageSize: 100, page: 2 })
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
   * @param opts.page - the page number that you want to fetch results for
   * @param opts.pageSize - the number of results per page (optional)
   * @returns results.recordCount - A number representing the total number of records matching your query
   * @returns results.pageCount - The number of pages needed to encapsulate all the matching records
   * @returns results.currentPage - The current page (same as what is provided in the paginate args)
   * @returns results.results - An array of records matching the current record
   */
  public async paginate<
    Q extends Query<DreamInstance, any>,
    Incompatible extends Q['queryTypeOpts'] extends Readonly<{ allowPaginate: false }> ? true : false,
  >(
    this: Q,
    opts: Incompatible extends true
      ? 'paginate is incompatible with limit, offset, and leftJoinPreload'[]
      : PaginatedDreamQueryOptions
  ): Promise<PaginatedDreamQueryResult<DreamInstance>> {
    if (this.limitStatement) throw new CannotPaginateWithLimit()
    if (this.offsetStatement) throw new CannotPaginateWithOffset()
    const page = computedPaginatePage((opts as any).page)

    const recordCount = await this.count()
    const pageSize = (opts as any).pageSize || DreamApp.getOrFail().paginationPageSize

    const pageCount = Math.ceil(recordCount / pageSize)
    const results = await (this as any)
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .all()

    return {
      recordCount,
      pageCount,
      currentPage: page,
      results,
    }
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
  public connection(connection: DbConnectionType) {
    return this._connection(connection)
  }

  private _connection(connection: DbConnectionType | undefined) {
    if (!connection) return this
    return this.clone({ connection })
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
  public async exists(): Promise<boolean> {
    // Implementing via `limit(1).all()`, rather than the simpler `!!(await this.first())`
    // because it avoids the step of finding the first. Just find any, and return
    // that one.
    return (await (this as any).limit(1).all()).length > 0
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
  public async first() {
    const query = this.orderStatements.length
      ? this
      : this.order({ [this.namespacedPrimaryKey as any]: 'asc' } as any)
    const dbDriverClass = Query.dbDriverClass<DreamInstance>()
    return await new dbDriverClass(query).takeOne()
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
  public async firstOrFail() {
    const record = await this.first()
    if (!record) throw new RecordNotFound(this.dreamInstance['sanitizedConstructorName'])
    return record
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
  public async last() {
    const query = this.orderStatements.length
      ? this.invertOrder()
      : this.order({ [this.namespacedPrimaryKey]: 'desc' } as any)

    const dbDriverClass = Query.dbDriverClass<DreamInstance>()
    return await new dbDriverClass(query).takeOne()
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
  public async lastOrFail() {
    const record = await this.last()
    if (!record) throw new RecordNotFound(this.dreamInstance['sanitizedConstructorName'])
    return record
  }

  /**
   * Destroys all records matching the Query,
   * calling model hooks and cascading destroy
   * to associations with `dependent: 'destroy'`,
   * and returns the number of records that
   * were destroyed.
   *
   * To delete in a single database query,
   * ignoring model hooks and association
   * dependent-destroy declarations, use
   * {@link Query.delete | delete} instead.
   *
   * ```ts
   * await User.where({ email: ops.ilike('%burpcollaborator%') }).destroy()
   * // 12
   * ```
   *
   * @param options - Options for destroying the instance
   * @param options.skipHooks - If true, skips applying model hooks during the destroy operation. Defaults to false
   * @param options.cascade - If false, skips destroying associations marked `dependent: 'destroy'`. Defaults to true
   * @param options.bypassAllDefaultScopes - If true, bypasses all default scopes when cascade destroying. Defaults to false
   * @param options.defaultScopesToBypass - An array of default scope names to bypass when cascade destroying. Defaults to an empty array
   * @returns The number of records that were removed
   */
  public async destroy({
    skipHooks,
    cascade,
  }: {
    skipHooks?: boolean | undefined
    cascade?: boolean | undefined
  } = {}): Promise<number> {
    let counter = 0

    const options = {
      bypassAllDefaultScopes: this.bypassAllDefaultScopes,
      defaultScopesToBypass: this.defaultScopesToBypass,
      skipHooks,
      cascade,
    }

    await this.findEach(async result => {
      const subquery = this.dreamTransaction
        ? (result.txn(this.dreamTransaction) as unknown as DreamInstance)
        : result

      if (this.shouldReallyDestroy) {
        await subquery.reallyDestroy(options)
      } else {
        await subquery.destroy(options)
      }
      counter++
    })

    return counter
  }

  /**
   * Destroys all records matching the Query,
   * ignoring the SoftDelete decorator and
   * permanently removing records from the database.
   *
   * Calls model hooks and applies cascade destroy
   * to associations with `dependent: 'destroy'`,
   * returning the number of records that
   * were destroyed.
   *
   * To destroy without bypassing the SoftDelete
   * decorator, use {@link Query.(destroy:instance) | destroy} instead.
   *
   * ```ts
   * await User.where({ email: ops.ilike('%burpcollaborator%') }).reallyDestroy()
   * // 12
   * ```
   *
   * @param options - Options for destroying the instance
   * @param options.skipHooks - If true, skips applying model hooks during the destroy operation. Defaults to false
   * @param options.cascade - If false, skips destroying associations marked `dependent: 'destroy'`. Defaults to true
   * @param options.bypassAllDefaultScopes - If true, bypasses all default scopes when cascade destroying. Defaults to false
   * @param options.defaultScopesToBypass - An array of default scope names to bypass when cascade destroying. Defaults to an empty array
   * @returns The number of records that were removed
   */
  public async reallyDestroy({
    skipHooks,
    cascade,
  }: { skipHooks?: boolean; cascade?: boolean } = {}): Promise<number> {
    return await this.clone({ shouldReallyDestroy: true }).destroy({ skipHooks, cascade })
  }

  /**
   * Undestroys a SoftDelete model, unsetting
   * the `deletedAt` field in the database.
   *
   * If the model is not a SoftDelete model,
   * this will raise an exception.
   *
   * ```ts
   * await User.where({ email: ops.ilike('%burpcollaborator%') }).undestroy()
   * // 12
   * ```
   *
   * @param options - Options for undestroying the instance
   * @param options.skipHooks - If true, skips applying model hooks during the undestroy operation. Defaults to false
   * @param options.cascade - If false, skips undestroying associations marked `dependent: 'destroy'`. Defaults to true
   * @param options.bypassAllDefaultScopes - If true, bypasses all default scopes when cascade undestroying. Defaults to false
   * @param options.defaultScopesToBypass - An array of default scope names to bypass when cascade undestroying (soft delete is always bypassed). Defaults to an empty array
   * @returns The number of records that were removed
   */
  public async undestroy({
    cascade,
    skipHooks,
  }: {
    cascade?: boolean
    skipHooks?: boolean
  } = {}): Promise<number> {
    if (!this.dreamClass['softDelete']) throw new CannotCallUndestroyOnANonSoftDeleteModel(this.dreamClass)
    let counter = 0

    await this.removeDefaultScope(SOFT_DELETE_SCOPE_NAME as AllDefaultScopeNames<DreamInstance>).findEach(
      async result => {
        const subquery = this.dreamTransaction
          ? (result.txn(this.dreamTransaction) as unknown as DreamInstance)
          : result

        await subquery.undestroy({
          bypassAllDefaultScopes: this.bypassAllDefaultScopes,
          defaultScopesToBypass: this.defaultScopesToBypass,
          cascade,
          skipHooks,
        })
        counter++
      }
    )

    return counter
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
   * @returns The number of records that were removed
   */
  public async delete(): Promise<number> {
    return await this.dbDriverInstance().delete()
  }

  /**
   * Updates all records matching the Query
   *
   * ```ts
   * await User.where({ email: ops.ilike('%burpcollaborator%') }).updateAll({ email: null })
   * // 12
   * ```
   * @param attributes - The attributes used to update the records
   * @param options - Options for updating the instance
   * @param options.skipHooks - If true, skips applying model hooks. Defaults to false
   * @returns The number of records that were updated
   */
  public async update(
    attributes: DreamTableSchema<DreamInstance>,
    { skipHooks }: { skipHooks?: boolean } = {}
  ): Promise<number> {
    if (this.baseSelectQuery) throw new NoUpdateOnAssociationQuery()
    if (Object.keys(this.innerJoinStatements).length) throw new NoUpdateAllOnJoins()
    if (Object.keys(this.leftJoinStatements).length) throw new NoUpdateAllOnJoins()

    if (skipHooks) return await this.updateWithoutCallingModelHooks(attributes)

    let counter = 0

    await this.findEach(async result => {
      const subquery = this.dreamTransaction
        ? (result.txn(this.dreamTransaction) as unknown as DreamInstance)
        : result

      await subquery.update(attributes as any)
      counter++
    })

    return counter
  }

  private async updateWithoutCallingModelHooks(attributes: DreamTableSchema<DreamInstance>) {
    return await this.dbDriverInstance().update(attributes)
  }

  private invertOrder() {
    let query = this.clone({ order: null })

    for (const orderStatement of this.orderStatements) {
      query = query.order({
        [orderStatement.column]: orderStatement.direction === 'desc' ? 'asc' : 'desc',
      } as any)
    }

    return query
  }
}

export interface QueryOpts<
  DreamInstance extends Dream,
  ColumnType extends DreamColumnNames<DreamInstance> = DreamColumnNames<DreamInstance>,
  Schema extends DreamInstance['schema'] = DreamInstance['schema'],
  DB extends DreamInstance['DB'] = DreamInstance['DB'],
  PassthroughColumns extends PassthroughColumnNames<DreamInstance> = PassthroughColumnNames<DreamInstance>,
> {
  baseSqlAlias?: TableOrAssociationName<Schema> | undefined
  baseSelectQuery?: Query<any, any> | null | undefined
  passthroughOnStatement?: PassthroughOnClause<PassthroughColumns> | null | undefined
  where?: readonly WhereStatement<DB, Schema, any>[] | null | undefined
  whereNot?: readonly WhereStatement<DB, Schema, any>[] | null | undefined
  limit?: LimitStatement | null | undefined
  offset?: OffsetStatement | null | undefined
  or?: WhereStatement<DB, Schema, any>[][] | null | undefined
  order?: OrderQueryStatement<ColumnType>[] | null | undefined
  loadFromJoins?: boolean | undefined
  preloadStatements?: RelaxedPreloadStatement | undefined
  preloadOnStatements?: RelaxedPreloadOnStatement<DB, Schema> | undefined
  distinctColumn?: ColumnType | null | undefined
  innerJoinDreamClasses?: readonly (typeof Dream)[] | undefined
  innerJoinStatements?: RelaxedJoinStatement | undefined
  innerJoinAndStatements?: RelaxedJoinAndStatement<DB, Schema> | undefined
  leftJoinStatements?: RelaxedJoinStatement | undefined
  leftJoinAndStatements?: RelaxedJoinAndStatement<DB, Schema> | undefined
  bypassAllDefaultScopes?: boolean | undefined
  bypassAllDefaultScopesExceptOnAssociations?: boolean | undefined
  defaultScopesToBypass?: AllDefaultScopeNames<DreamInstance>[] | undefined
  defaultScopesToBypassExceptOnAssociations?: DefaultScopeName<DreamInstance>[] | undefined
  transaction?: DreamTransaction<Dream> | null | undefined
  connection?: DbConnectionType | undefined
  shouldReallyDestroy?: boolean | undefined
}
