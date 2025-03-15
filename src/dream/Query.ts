import {
  AliasedExpression,
  DeleteQueryBuilder,
  ExpressionBuilder,
  ExpressionWrapper,
  JoinBuilder,
  ComparisonOperatorExpression as KyselyComparisonOperatorExpression,
  SelectQueryBuilder,
  SqlBool,
  UpdateQueryBuilder,
  Updateable,
  sql,
} from 'kysely'
import { DateTime } from 'luxon'
import pluralize from 'pluralize-esm'
import ConnectedToDB from '../db/ConnectedToDB.js.js'
import { DbConnectionType } from '../db/types.js.js'
import associationToGetterSetterProp from '../decorators/associations/associationToGetterSetterProp.js.js'
import { BelongsToStatement } from '../decorators/associations/BelongsTo.js.js'
import { HasManyStatement } from '../decorators/associations/HasMany.js.js'
import { HasOneStatement } from '../decorators/associations/HasOne.js.js'
import {
  AssociationStatement,
  ColumnNamesAccountingForJoinedAssociations,
  LimitStatement,
  OffsetStatement,
  OrderQueryStatement,
  PassthroughOnClause,
  SelfOnStatement,
  WhereStatement,
  WhereStatementForJoinedAssociation,
} from '../decorators/associations/shared.js'
import { SOFT_DELETE_SCOPE_NAME } from '../decorators/SoftDelete.js.js'
import Dream from '../Dream.js.js'
import CannotAssociateThroughPolymorphic from '../errors/associations/CannotAssociateThroughPolymorphic.js.js'
import CannotJoinPolymorphicBelongsToError from '../errors/associations/CannotJoinPolymorphicBelongsToError.js.js'
import JoinAttemptedOnMissingAssociation from '../errors/associations/JoinAttemptedOnMissingAssociation.js.js'
import MissingRequiredAssociationOnClause from '../errors/associations/MissingRequiredAssociationOnClause.js.js'
import MissingRequiredPassthroughForAssociationOnClause from '../errors/associations/MissingRequiredPassthroughForAssociationOnClause.js.js'
import MissingThroughAssociation from '../errors/associations/MissingThroughAssociation.js.js'
import MissingThroughAssociationSource from '../errors/associations/MissingThroughAssociationSource.js.js'
import CannotCallUndestroyOnANonSoftDeleteModel from '../errors/CannotCallUndestroyOnANonSoftDeleteModel.js.js'
import CannotNegateSimilarityClause from '../errors/CannotNegateSimilarityClause.js.js'
import CannotPassAdditionalFieldsToPluckEachAfterCallback from '../errors/CannotPassAdditionalFieldsToPluckEachAfterCallback.js.js'
import CannotPassUndefinedAsAValueToAWhereClause from '../errors/CannotPassUndefinedAsAValueToAWhereClause.js.js'
import LeftJoinPreloadIncompatibleWithFindEach from '../errors/LeftJoinPreloadIncompatibleWithFindEach.js.js'
import MissingRequiredCallbackFunctionToPluckEach from '../errors/MissingRequiredCallbackFunctionToPluckEach.js.js'
import NoUpdateAllOnJoins from '../errors/NoUpdateAllOnJoins.js.js'
import NoUpdateOnAssociationQuery from '../errors/NoUpdateOnAssociationQuery.js.js'
import RecordNotFound from '../errors/RecordNotFound.js.js'
import CalendarDate from '../helpers/CalendarDate.js.js'
import camelize from '../helpers/camelize.js.js'
import cloneDeepSafe from '../helpers/cloneDeepSafe.js.js'
import compact from '../helpers/compact.js.js'
import isEmpty from '../helpers/isEmpty.js.js'
import namespaceColumn from '../helpers/namespaceColumn.js.js'
import objectPathsToArrays from '../helpers/objectPathsToArrays.js.js'
import protectAgainstPollutingAssignment from '../helpers/protectAgainstPollutingAssignment.js.js'
import { Range } from '../helpers/range.js.js'
import snakeify from '../helpers/snakeify.js.js'
import { isObject, isString } from '../helpers/typechecks.js.js'
import { FindInterfaceWithValue } from '../helpers/typeutils.js.js'
import uniq from '../helpers/uniq.js.js'
import CurriedOpsStatement from '../ops/curried-ops-statement.js.js'
import ops from '../ops/index.js.js'
import OpsStatement from '../ops/ops-statement.js.js'
import DreamTransaction from './DreamTransaction.js.js'
import executeDatabaseQuery from './internal/executeDatabaseQuery.js.js'
import extractAssociationMetadataFromAssociationName from './internal/extractAssociationMetadataFromAssociationName.js.js'
import orderByDirection from './internal/orderByDirection.js.js'
import shouldBypassDefaultScope from './internal/shouldBypassDefaultScope.js.js'
import SimilarityBuilder from './internal/similarity/SimilarityBuilder.js.js'
import sqlResultToDreamInstance from './internal/sqlResultToDreamInstance.js.js'
import {
  AliasToDreamIdMap,
  AllDefaultScopeNames,
  AssociationNameToAssociationDataAndDreamClassMap,
  AssociationNameToAssociationMap,
  AssociationNameToDreamClassMap,
  DefaultScopeName,
  DreamColumnNames,
  DreamConst,
  DreamTableSchema,
  IdType,
  JoinOnStatements,
  JoinedAssociation,
  JoinedAssociationsTypeFromAssociations,
  OrderDir,
  PassthroughColumnNames,
  PluckEachArgs,
  PrimaryKeyForFind,
  QueryTypeOptions,
  RelaxedJoinOnStatement,
  RelaxedJoinStatement,
  RelaxedPreloadOnStatement,
  RelaxedPreloadStatement,
  TableColumnNames,
  TableColumnType,
  TableOrAssociationName,
  VariadicJoinsArgs,
  VariadicLeftJoinLoadArgs,
  VariadicLoadArgs,
} from './types.js'

export type QueryWithJoinedAssociationsType<
  Q extends Query<any, any>,
  JoinedAssociations extends Readonly<JoinedAssociation[]>,
> = Query<
  Q['dreamInstance'],
  ExtendQueryType<
    Q['queryTypeOpts'],
    Readonly<{
      joinedAssociations: JoinedAssociations
    }>
  >
>

export type QueryWithJoinedAssociationsTypeAndNoPreload<
  Q extends Query<any, any>,
  JoinedAssociations extends Readonly<JoinedAssociation[]> = Readonly<JoinedAssociation[]>,
> = Query<
  Q['dreamInstance'],
  ExtendQueryType<
    Q['queryTypeOpts'],
    Readonly<{
      joinedAssociations: JoinedAssociations
      allowPreload: false
    }>
  >
>

export type QueryWithJoinedAssociationsTypeAndNoLeftJoinPreload<
  Q extends Query<any, any>,
  JoinedAssociations extends Readonly<JoinedAssociation[]> = Readonly<JoinedAssociation[]>,
> = Query<
  Q['dreamInstance'],
  ExtendQueryType<
    Q['queryTypeOpts'],
    Readonly<{
      joinedAssociations: JoinedAssociations
      allowLeftJoinPreload: false
    }>
  >
>

export type DefaultQueryTypeOptions<
  TableNameSource extends Dream,
  TableAliasSource extends Dream | string = TableNameSource,
> = Readonly<{
  joinedAssociations: Readonly<[]>
  rootTableName: TableNameSource['table']
  rootTableAlias: TableAliasSource extends Dream ? TableAliasSource['table'] : TableAliasSource
  allowPreload: true
  allowLeftJoinPreload: true
}>

export default class Query<
  DreamInstance extends Dream,
  QueryTypeOpts extends Readonly<QueryTypeOptions> = DefaultQueryTypeOptions<DreamInstance>,
> extends ConnectedToDB<DreamInstance> {
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
  private readonly innerJoinOnStatements: RelaxedJoinOnStatement<
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
  private readonly leftJoinOnStatements: RelaxedJoinOnStatement<
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

  constructor(
    dreamInstance: DreamInstance,
    opts: QueryOpts<DreamInstance, DreamColumnNames<DreamInstance>> = {}
  ) {
    super(dreamInstance, opts)
    this.passthroughOnStatement = Object.freeze(opts.passthroughOnStatement || {})
    this.whereStatements = Object.freeze(opts.where || [])
    this.whereNotStatements = Object.freeze(opts.whereNot || [])
    this.whereAnyStatements = Object.freeze(opts.or || [])
    this.orderStatements = Object.freeze(opts.order || [])
    this.joinLoadActivated = opts.loadFromJoins || false
    this.preloadStatements = Object.freeze(opts.preloadStatements || {})
    this.preloadOnStatements = Object.freeze(opts.preloadOnStatements || {})
    this.innerJoinStatements = Object.freeze(opts.innerJoinStatements || {})
    this.innerJoinOnStatements = Object.freeze(opts.innerJoinOnStatements || {})
    this.leftJoinStatements = Object.freeze(opts.leftJoinStatements || {})
    this.leftJoinOnStatements = Object.freeze(opts.leftJoinOnStatements || {})
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
   * Used for applying preload and load statements
   *
   * @returns An associated Query
   */
  private dreamClassQueryWithScopeBypasses<T extends typeof Dream>(
    dreamClass: T,
    {
      bypassAllDefaultScopesExceptOnAssociations = false,
      defaultScopesToBypassExceptOnAssociations = [],
    }: {
      bypassAllDefaultScopesExceptOnAssociations?: boolean
      defaultScopesToBypassExceptOnAssociations?: AllDefaultScopeNames<DreamInstance>[]
    } = {}
  ): Query<InstanceType<T>, DefaultQueryTypeOptions<DreamInstance>> {
    const associationQuery = dreamClass.query().clone({
      passthroughOnStatement: this.passthroughOnStatement,
      bypassAllDefaultScopes: this.bypassAllDefaultScopes,
      bypassAllDefaultScopesExceptOnAssociations,
      defaultScopesToBypass: this.defaultScopesToBypass,
      defaultScopesToBypassExceptOnAssociations,
    })

    return (this.dreamTransaction ? associationQuery.txn(this.dreamTransaction) : associationQuery) as Query<
      InstanceType<T>,
      DefaultQueryTypeOptions<DreamInstance>
    >
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
        ...(opts.passthroughOnStatement || {}),
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

      // when passed, preloadStatements, preloadOnStatements, innerJoinStatements, and innerJoinOnStatements are already
      // cloned versions of the `this.` versions, handled in the `preload` and `joins` methods
      preloadStatements: opts.preloadStatements || this.preloadStatements,
      preloadOnStatements: opts.preloadOnStatements || this.preloadOnStatements,
      innerJoinDreamClasses: opts.innerJoinDreamClasses || this.innerJoinDreamClasses,
      innerJoinStatements: opts.innerJoinStatements || this.innerJoinStatements,
      innerJoinOnStatements: opts.innerJoinOnStatements || this.innerJoinOnStatements,
      leftJoinStatements: opts.leftJoinStatements || this.leftJoinStatements,
      leftJoinOnStatements: opts.leftJoinOnStatements || this.leftJoinOnStatements,
      // end:when passed, preloadStatements, preloadOnStatements, innerJoinStatements, and innerJoinOnStatements are already...

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
   *   DreamApplication.log(user)
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
      .limit(batchSize)
    let lastId = null

    do {
      if (lastId)
        records = await query.where({ [this.dreamInstance.primaryKey]: ops.greaterThan(lastId) } as any).all()
      else records = await query.all()

      for (const record of records) {
        await cb(record)
      }

      lastId = records[records.length - 1]?.primaryKeyValue
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
   * @param args - A chain of association names and on/notOn/onAny clauses
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
        }>
      >
    >,
  >(
    this: Q,
    ...args: Incompatible extends true ? 'leftJoinPreload is incompatible with preload'[] : [...Arr, LastArg]
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
   * @param args - A chain of association names and on/notOn/onAny clauses
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
    return this.clone({ preloadStatements, preloadOnStatements: preloadOnStatements }) as any
  }

  /**
   * Returns a new Query instance, with the provided
   * joins statement attached
   *
   * ```ts
   * await User.query().innerJoin('posts').first()
   * ```
   *
   * @param args - A chain of association names and on/notOn/onAny clauses
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

    const innerJoinOnStatements: RelaxedJoinOnStatement<DB, Schema> = cloneDeepSafe(
      this.innerJoinOnStatements
    )

    this.fleshOutJoinStatements(
      innerJoinDreamClasses as any,
      innerJoinStatements,
      innerJoinOnStatements,
      null,
      [...(args as any)]
    )

    return this.clone({ innerJoinDreamClasses, innerJoinStatements, innerJoinOnStatements }) as any
  }

  /**
   * @internal
   *
   * @param args - A chain of association names and on/notOn/onAny clauses
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

    const leftJoinOnStatements: RelaxedJoinOnStatement<DB, Schema> = cloneDeepSafe(this.leftJoinOnStatements)

    this.fleshOutJoinStatements(innerJoinDreamClasses, leftJoinStatements, leftJoinOnStatements, null, [
      ...(args as any),
    ])

    return this.clone({ innerJoinDreamClasses, leftJoinStatements, leftJoinOnStatements }) as any
  }

  /**
   * @internal
   *
   */
  private fleshOutJoinStatements<DB extends DreamInstance['DB'], Schema extends DreamInstance['schema']>(
    innerJoinDreamClasses: (typeof Dream)[],
    joinStatements: RelaxedJoinStatement,
    joinOnStatements: RelaxedJoinOnStatement<DB, Schema>,
    previousAssociationName: null | string,
    associationStatements: (string | WhereStatement<DB, Schema, any> | undefined)[],
    previousDreamClass: typeof Dream | null = this.dreamClass
  ) {
    const nextAssociationStatement = associationStatements.shift()

    if (nextAssociationStatement === undefined) {
      // just satisfying typing
    } else if (isString(nextAssociationStatement)) {
      const nextStatement = nextAssociationStatement as string

      if (!joinStatements[nextStatement])
        joinStatements[protectAgainstPollutingAssignment(nextStatement)] = {}
      if (!joinOnStatements[nextStatement])
        joinOnStatements[protectAgainstPollutingAssignment(nextStatement)] = {}

      const nextDreamClass = this.addAssociatedDreamClassToInnerJoinDreamClasses(
        previousDreamClass,
        nextStatement,
        innerJoinDreamClasses
      )

      const nextJoinsStatements = joinStatements[nextStatement]
      const nextJoinsOnStatements = joinOnStatements[nextStatement] as RelaxedJoinOnStatement<DB, Schema>

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
        joinOnStatements[protectAgainstPollutingAssignment(key)] = (clonedNextAssociationStatement as any)[
          key
        ]
      })

      this.fleshOutJoinStatements(
        innerJoinDreamClasses,
        joinStatements,
        joinOnStatements,
        previousAssociationName,
        associationStatements,
        previousDreamClass
      )
    }
  }

  /**
   * @internal
   *
   *
   */
  private associationNamesToDreamClassesMap(
    associationNames: string[],
    associationsToDreamClassesMap: AssociationNameToDreamClassMap = {}
  ): AssociationNameToDreamClassMap {
    const namesToAssociationsAndDreamClasses =
      this.associationNamesToAssociationDataAndDreamClassesMap(associationNames)
    return Object.keys(namesToAssociationsAndDreamClasses).reduce((remap, associationName) => {
      remap[associationName] = namesToAssociationsAndDreamClasses[associationName].dreamClass
      return remap
    }, associationsToDreamClassesMap)
  }

  /**
   * @internal
   *
   *
   */
  private associationNamesToAssociationsMap(
    associationNames: string[],
    associationsToAssociations: AssociationNameToAssociationMap = {}
  ): AssociationNameToAssociationMap {
    const namesToAssociationsAndDreamClasses =
      this.associationNamesToAssociationDataAndDreamClassesMap(associationNames)
    return Object.keys(namesToAssociationsAndDreamClasses).reduce((remap, associationName) => {
      remap[associationName] = namesToAssociationsAndDreamClasses[associationName].association
      return remap
    }, associationsToAssociations)
  }

  /**
   * @internal
   */
  private associationNamesToAssociationDataAndDreamClassesMap(
    associationNames: string[]
  ): AssociationNameToAssociationDataAndDreamClassMap {
    const associationsToDreamClassesMap: AssociationNameToAssociationDataAndDreamClassMap = {}

    associationNames.reduce((dreamClass: typeof Dream, associationName: string) => {
      const { name, alias } = extractAssociationMetadataFromAssociationName(associationName)
      const association = dreamClass['getAssociationMetadata'](name)
      const through = (association as any).through

      if (through) {
        const { throughAssociation, throughAssociationDreamClass } = this.throughAssociationDetails(
          dreamClass,
          through
        )
        associationsToDreamClassesMap[through] = {
          association: throughAssociation,
          dreamClass: throughAssociationDreamClass,
        }
      }

      const nextDreamClass = association.modelCB() as typeof Dream
      associationsToDreamClassesMap[alias] = { association, dreamClass: nextDreamClass }
      return nextDreamClass
    }, this.dreamClass)

    return associationsToDreamClassesMap
  }

  /**
   * @internal
   */
  private throughAssociationDetails(
    dreamClass: typeof Dream,
    through: string
  ): {
    throughAssociation:
      | BelongsToStatement<any, any, any, any>
      | HasOneStatement<any, any, any, any>
      | HasManyStatement<any, any, any, any>
    throughAssociationDreamClass: typeof Dream
  } {
    const throughAssociation = dreamClass['getAssociationMetadata'](through)
    const throughAssociationDreamClass = throughAssociation.modelCB() as typeof Dream
    return { throughAssociation, throughAssociationDreamClass }
  }

  /**
   * @internal
   *
   *
   */
  private joinStatementsToDreamClassesMap(joinStatements: RelaxedJoinStatement) {
    const associationsToDreamClassesMap: AssociationNameToDreamClassMap = {}

    objectPathsToArrays(joinStatements).forEach(associationChain =>
      this.associationNamesToDreamClassesMap(associationChain, associationsToDreamClassesMap)
    )

    return associationsToDreamClassesMap
  }

  /**
   * @internal
   *
   *
   */
  private joinStatementsToAssociationsMap(joinStatements: RelaxedJoinStatement) {
    const associationsToAssociationsMap: AssociationNameToAssociationMap = {}

    objectPathsToArrays(joinStatements).forEach(associationChain =>
      this.associationNamesToAssociationsMap(associationChain, associationsToAssociationsMap)
    )

    return associationsToAssociationsMap
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

    const association = (previousDreamClass['associationMetadataMap']() as any)[associationName] as
      | BelongsToStatement<any, any, any, any>
      | HasManyStatement<any, any, any, any>
      | HasOneStatement<any, any, any, any>
    if (!association) return null

    this.addThroughAssociatedDreamClassToInnerJoinDreamClasses(
      previousDreamClass,
      association,
      innerJoinDreamClasses
    )

    const dreamClasses = [association.modelCB()].flat()
    dreamClasses.forEach(dreamClass => innerJoinDreamClasses.push(dreamClass))
    return dreamClasses[0]
  }

  private addThroughAssociatedDreamClassToInnerJoinDreamClasses(
    dreamClass: typeof Dream,
    _association:
      | BelongsToStatement<any, any, any, any>
      | HasManyStatement<any, any, any, any>
      | HasOneStatement<any, any, any, any>,
    innerJoinDreamClasses: (typeof Dream)[]
  ) {
    const association = _association as
      | HasManyStatement<any, any, any, any>
      | HasOneStatement<any, any, any, any>
    const throughAssociationName = association.through
    if (!throughAssociationName) return

    const throughAssociation = (dreamClass['associationMetadataMap']() as any)[throughAssociationName] as
      | BelongsToStatement<any, any, any, any>
      | HasManyStatement<any, any, any, any>
      | HasOneStatement<any, any, any, any>

    if (!throughAssociation) return

    const throughDreamClass = [throughAssociation.modelCB()].flat()[0]
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
   *   @Deco.HasMany('LocalizedText')
   *   public localizedTexts: LocalizedText[]
   *
   *   @Deco.HasOne('LocalizedText', {
   *     on: { locale: DreamConst.passthrough },
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
    const query = this.buildSelect({ bypassSelectAll: true, bypassOrder: true })
    return query.select(this.namespaceColumn(selection as any))
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
    if (isString(arg)) return this.clone({ order: [{ column: arg as any, direction: 'asc' }] })

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
  public limit(limit: number | null): Query<DreamInstance, QueryTypeOpts> {
    return this.clone({ limit })
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
  public offset(offset: number | null): Query<DreamInstance, QueryTypeOpts> {
    return this.clone({ offset })
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
    const kyselyQuery = this.buildSelect()
    return kyselyQuery.compile()
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
    ToKyselyReturnType = QueryType extends 'select'
      ? SelectQueryBuilder<DreamInstance['DB'], DreamInstance['table'], unknown>
      : QueryType extends 'delete'
        ? DeleteQueryBuilder<DreamInstance['DB'], DreamInstance['table'], unknown>
        : QueryType extends 'update'
          ? UpdateQueryBuilder<DreamInstance['DB'], DreamInstance['table'], DreamInstance['table'], unknown>
          : never,
  >(type: QueryType) {
    switch (type) {
      case 'select':
        return this.buildSelect() as ToKyselyReturnType

      case 'delete':
        return this.buildDelete() as ToKyselyReturnType

      case 'update':
        return this.buildUpdate({}) as ToKyselyReturnType

      // TODO: in the future, we should support insert type, but don't yet, since inserts are done outside
      // the query class for some reason.
      default:
        throw new Error('never')
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
  public txn(dreamTransaction: DreamTransaction<Dream>) {
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
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { count } = this.dbFor('select').fn
    const distinctColumn = this.distinctColumn
    const query = this.clone({ distinctColumn: null })

    let kyselyQuery = query.buildSelect({ bypassSelectAll: true, bypassOrder: true })

    const countClause = distinctColumn
      ? count(sql`DISTINCT ${distinctColumn}`)
      : count(query.namespaceColumn(query.dreamInstance.primaryKey))

    kyselyQuery = kyselyQuery.select(countClause.as('tablecount'))

    const data = await executeDatabaseQuery(kyselyQuery, 'executeTakeFirstOrThrow')

    return parseInt(data.tablecount.toString())
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
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { max } = this.dbFor('select').fn
    let kyselyQuery = this.buildSelect({ bypassSelectAll: true, bypassOrder: true })

    kyselyQuery = kyselyQuery.select(max(columnName as any) as any)

    const data = await executeDatabaseQuery(kyselyQuery, 'executeTakeFirstOrThrow')

    return data.max
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
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { min } = this.dbFor('select').fn
    let kyselyQuery = this.buildSelect({ bypassSelectAll: true, bypassOrder: true })

    kyselyQuery = kyselyQuery.select(min(columnName as any) as any)
    const data = await executeDatabaseQuery(kyselyQuery, 'executeTakeFirstOrThrow')

    return data.min
  }

  /**
   * @internal
   *
   * Runs the query and extracts plucked values
   *
   * @returns An array of plucked values
   */
  private async executePluck(...fields: DreamColumnNames<DreamInstance>[]): Promise<any[]> {
    let kyselyQuery = this.removeAllDefaultScopesExceptOnAssociations().buildSelect({ bypassSelectAll: true })
    const aliases: string[] = []

    fields.forEach((field: string) => {
      // field will already be namespaced in a join situation, but when the field to pluck is on the
      // base model, it will be underscored (to match the table name), but when the selected column
      // comes back from Kysely camelCased
      aliases.push(field.includes('_') ? camelize(field) : field)
      //  namespace the selection so that when plucking the same column name from
      // multpile tables, they don't get saved as the same name (e.g. select results with two `id` columns,
      // which the pg package then returns in an object with a single `id` key)
      kyselyQuery = kyselyQuery.select(`${this.namespaceColumn(field)} as ${field}` as any)
    })

    return (await executeDatabaseQuery(kyselyQuery, 'execute')).map(singleResult =>
      aliases.map(alias => singleResult[alias])
    )
  }

  /**
   * @internal
   *
   */
  private async executeJoinLoad(
    options: {
      columns?: DreamColumnNames<DreamInstance>[]
    } = {}
  ): Promise<DreamInstance[]> {
    const query = this.limit(null).offset(null)

    let kyselyQuery = query.buildSelect({ bypassSelectAll: true })

    const aliasToDreamClassesMap = {
      [this.baseSqlAlias]: this.dreamClass,
      ...this.joinStatementsToDreamClassesMap(this.leftJoinStatements),
    }

    const associationAliasToColumnAliasMap: Record<string, Record<string, string>> = {}
    const aliasToAssociationsMap = this.joinStatementsToAssociationsMap(this.leftJoinStatements)

    const aliases = Object.keys(aliasToDreamClassesMap)

    let nextColumnAliasCounter = 0

    aliases.forEach((aliasOrExpression: string) => {
      const alias = extractAssociationMetadataFromAssociationName(aliasOrExpression).alias

      associationAliasToColumnAliasMap[alias] ||= {}
      const aliasedDreamClass = aliasToDreamClassesMap[alias]
      const association = aliasToAssociationsMap[alias]

      const columns =
        alias === this.baseSqlAlias
          ? options.columns
            ? this.columnsWithRequiredLoadColumns(options.columns)
            : this.dreamClass.columns()
          : aliasedDreamClass.columns()

      columns.forEach((column: string) => {
        const columnAlias = `dr${nextColumnAliasCounter++}`
        kyselyQuery = kyselyQuery.select(`${this.namespaceColumn(column, alias)} as ${columnAlias}`)
        associationAliasToColumnAliasMap[alias][column] = columnAlias
      })

      if (association?.type === 'HasOne' || association?.type === 'HasMany') {
        const setupPreloadData = (dbColumnName: string) => {
          const columnAlias = `dr${nextColumnAliasCounter++}`
          associationAliasToColumnAliasMap[association.through!][dbColumnName] = columnAlias
          kyselyQuery = kyselyQuery.select(
            `${this.namespaceColumn(dbColumnName, association.through)} as ${columnAlias}`
          )
        }

        if (association.through && association.preloadThroughColumns) {
          if (isObject(association.preloadThroughColumns)) {
            const preloadMap = association.preloadThroughColumns as Record<string, string>
            Object.keys(preloadMap).forEach(columnName => setupPreloadData(columnName))
          } else {
            const preloadArray = association.preloadThroughColumns as string[]
            preloadArray.forEach(columnName => setupPreloadData(columnName))
          }
        }
      }
    })

    const queryResults = await executeDatabaseQuery(kyselyQuery, 'execute')

    const aliasToDreamIdMap = queryResults.reduce(
      (aliasToDreamIdMap: AliasToDreamIdMap, singleSqlResult: any) => {
        this.fleshOutJoinLoadExecutionResults({
          currentAlias: this.baseSqlAlias,
          singleSqlResult,
          aliasToDreamIdMap,
          associationAliasToColumnAliasMap,
          aliasToAssociationsMap,
          aliasToDreamClassesMap,
          leftJoinStatements: this.leftJoinStatements,
        })

        return aliasToDreamIdMap
      },
      {} as AliasToDreamIdMap
    )

    const baseModelIdToDreamMap = aliasToDreamIdMap[this.baseSqlAlias] || new Map()
    return compact(Array.from(baseModelIdToDreamMap.values()) as DreamInstance[])
  }

  private fleshOutJoinLoadExecutionResults({
    currentAlias,
    singleSqlResult,
    aliasToDreamIdMap,
    associationAliasToColumnAliasMap,
    aliasToAssociationsMap,
    aliasToDreamClassesMap,
    leftJoinStatements,
  }: {
    currentAlias: string
    singleSqlResult: any
    aliasToDreamIdMap: AliasToDreamIdMap
    associationAliasToColumnAliasMap: Record<string, Record<string, string>>
    aliasToAssociationsMap: AssociationNameToAssociationMap
    aliasToDreamClassesMap: AssociationNameToDreamClassMap
    leftJoinStatements: RelaxedJoinStatement
  }) {
    const dreamClass = aliasToDreamClassesMap[currentAlias]
    const columnToColumnAliasMap = associationAliasToColumnAliasMap[currentAlias]
    const primaryKeyValue = singleSqlResult[columnToColumnAliasMap[dreamClass.primaryKey]]

    if (!primaryKeyValue) return null

    aliasToDreamIdMap[currentAlias] ||= new Map()

    if (!aliasToDreamIdMap[currentAlias].get(primaryKeyValue)) {
      const columnValueMap = Object.keys(columnToColumnAliasMap).reduce(
        (columnNameValueMap, columnName) => {
          columnNameValueMap[columnName] = singleSqlResult[columnToColumnAliasMap[columnName]]
          return columnNameValueMap
        },
        {} as Record<string, any>
      )
      const dream = sqlResultToDreamInstance(dreamClass, columnValueMap)

      const association = aliasToAssociationsMap[currentAlias] as
        | HasOneStatement<any, any, any, any>
        | HasManyStatement<any, any, any, any>
      if (association && association.through && association.preloadThroughColumns) {
        const throughAssociationColumnToColumnAliasMap = associationAliasToColumnAliasMap[association.through]

        this.hydratePreloadedThroughColumns({
          association,
          columnToColumnAliasMap: throughAssociationColumnToColumnAliasMap,
          dream,
          singleSqlResult,
        })
      }

      aliasToDreamIdMap[protectAgainstPollutingAssignment(currentAlias)].set(primaryKeyValue, dream)
    }

    const dream = aliasToDreamIdMap[currentAlias].get(primaryKeyValue)

    Object.keys(leftJoinStatements).forEach(nextAlias => {
      const { name: associationName, alias } = extractAssociationMetadataFromAssociationName(nextAlias)

      const association = dreamClass['getAssociationMetadata'](associationName)
      const associatedDream = this.fleshOutJoinLoadExecutionResults({
        currentAlias: alias,
        singleSqlResult,
        aliasToDreamIdMap,
        associationAliasToColumnAliasMap,
        aliasToAssociationsMap,
        aliasToDreamClassesMap,
        leftJoinStatements: leftJoinStatements[nextAlias] as RelaxedJoinStatement,
      })
      const hasMany = association.type === 'HasMany'

      // initialize by trying to access the association, which throws an exception if not yet initialized
      try {
        ;(dream as any)[association.as]
      } catch {
        if (hasMany) (dream as any)[association.as] = []
        else (dream as any)[associationToGetterSetterProp(association)] = null
      }

      if (!associatedDream) return

      if (hasMany) {
        if (!(dream as any)[association.as].includes(associatedDream))
          (dream as any)[association.as].push(associatedDream)
      } else (dream as any)[associationToGetterSetterProp(association)] = associatedDream
    })

    return dream
  }

  private hydratePreloadedThroughColumns({
    association,
    columnToColumnAliasMap,
    dream,
    singleSqlResult,
  }: {
    association: HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>
    columnToColumnAliasMap: Record<string, string>
    dream: Dream
    singleSqlResult: any
  }) {
    if (!association.through) return
    if (!(dream as any).preloadedThroughColumns) return

    let columnNames: string[] = []
    const columnNameToPreloadedThroughColumnNameMap: Record<string, string> = {}

    if (isObject(association.preloadThroughColumns)) {
      const preloadMap = association.preloadThroughColumns as Record<string, string>
      columnNames = Object.keys(preloadMap).map(columnName => {
        columnNameToPreloadedThroughColumnNameMap[columnName] = preloadMap[columnName]
        return columnName
      })
    } else if (Array.isArray(association.preloadThroughColumns)) {
      columnNames = association.preloadThroughColumns.map(columnName => {
        columnNameToPreloadedThroughColumnNameMap[columnName] = columnName
        return columnName
      })
    }

    columnNames.forEach(
      columnName =>
        ((dream as any).preloadedThroughColumns[columnNameToPreloadedThroughColumnNameMap[columnName]] =
          singleSqlResult[columnToColumnAliasMap[columnName]])
    )
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
    const vals = await this.executePluck(...(columnNames as any[]))

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

      records = await this.offset(offset)
        .order(null)
        .order(this.namespacedPrimaryKey as any)
        .limit(batchSize)
        .executePluck(...columnsIncludingPrimaryKey)

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
    if (this.joinLoadActivated) return await this.executeJoinLoad(options)

    const kyselyQuery = this.buildSelect(options)
    const results = await executeDatabaseQuery(kyselyQuery, 'execute')
    const theAll = results.map(r => sqlResultToDreamInstance(this.dreamClass, r)) as DreamInstance[]
    await this.applyPreload(this.preloadStatements as any, this.preloadOnStatements as any, theAll)

    return theAll
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
    return (await this.limit(1).all()).length > 0
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
    return await query.takeOne()
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

    return await query.takeOne()
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
  }: { skipHooks?: boolean; cascade?: boolean } = {}): Promise<number> {
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
    const deletionResult = await executeDatabaseQuery(this.buildDelete(), 'executeTakeFirst')
    return Number(deletionResult?.numDeletedRows || 0)
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
    const kyselyQuery = this.buildUpdate(attributes)
    const res = await executeDatabaseQuery(kyselyQuery, 'execute')
    const resultData = Array.from(res.entries())?.[0]?.[1]

    return Number(resultData?.numUpdatedRows || 0)
  }

  /**
   * @internal
   *
   * Used for applying first and last queries
   *
   * @returns A dream instance or null
   */
  private async takeOne() {
    if (this.joinLoadActivated) {
      let query: Query<DreamInstance, QueryTypeOpts>

      if (
        this.whereStatements.find(
          whereStatement =>
            (whereStatement as any)[this.dreamClass.primaryKey] ||
            (whereStatement as any)[this.namespacedPrimaryKey]
        )
      ) {
        // the query already includes a primary key where statement
        query = this
      } else {
        // otherwise find the primary key and apply it to the query
        const primaryKeyValue = (await this.limit(1).pluck(this.namespacedPrimaryKey as any))[0]
        if (primaryKeyValue === undefined) return null
        query = this.where({ [this.namespacedPrimaryKey]: primaryKeyValue } as any)
      }

      return (await query.executeJoinLoad())[0] || null
    }

    const kyselyQuery = this.limit(1).buildSelect()
    const results = await executeDatabaseQuery(kyselyQuery, 'executeTakeFirst')

    if (results) {
      const theFirst = sqlResultToDreamInstance(this.dreamClass, results) as DreamInstance

      if (theFirst)
        await this.applyPreload(this.preloadStatements as any, this.preloadOnStatements as any, [theFirst])

      return theFirst
    } else return null
  }

  /**
   * @internal
   *
   * Used to hydrate dreams with the provided associations
   */
  private hydrateAssociation(
    dreams: Dream[],
    association:
      | HasManyStatement<any, any, any, any>
      | HasOneStatement<any, any, any, any>
      | BelongsToStatement<any, any, any, any>,
    preloadedDreamsAndWhatTheyPointTo: PreloadedDreamsAndWhatTheyPointTo[]
  ) {
    switch (association.type) {
      case 'HasMany':
        dreams.forEach((dream: any) => {
          dream[association.as] = []
        })
        break
      default:
        dreams.forEach((dream: any) => {
          dream[associationToGetterSetterProp(association)] = null
        })
    }

    // dreams is a Rating
    // Rating belongs to: rateables (Posts / Compositions)
    // loadedAssociations is an array of Posts and Compositions
    // if rating.rateable_id === loadedAssociation.primaryKeyvalue
    //  rating.rateable = loadedAssociation

    preloadedDreamsAndWhatTheyPointTo.forEach(preloadedDreamAndWhatItPointsTo => {
      dreams
        .filter(dream => dream.primaryKeyValue === preloadedDreamAndWhatItPointsTo.pointsToPrimaryKey)
        .forEach((dream: any) => {
          if (association.type === 'HasMany') {
            dream[association.as].push(preloadedDreamAndWhatItPointsTo.dream)
          } else {
            // in a HasOne context, order clauses will be applied in advance,
            // prior to hydration. Considering, we only want to set the first
            // result and ignore other results, so we will use ||= to set.
            dream[association.as] ||= preloadedDreamAndWhatItPointsTo.dream
          }
        })
    })

    if (association.type === 'HasMany') {
      dreams.forEach((dream: any) => Object.freeze(dream[association.as]))
    }
  }

  /**
   * @internal
   *
   * Used to bridge through associations
   */
  private followThroughAssociation(
    dreamClass: typeof Dream,
    association: HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>
  ) {
    const throughAssociation =
      association.through && dreamClass['getAssociationMetadata'](association.through)
    if (!throughAssociation)
      throw new MissingThroughAssociation({
        dreamClass,
        association,
      })

    const throughClass = throughAssociation.modelCB() as typeof Dream
    if (Array.isArray(throughClass))
      throw new CannotAssociateThroughPolymorphic({
        dreamClass,
        association,
      })

    const newAssociation = getSourceAssociation(throughClass, association.source)
    if (!newAssociation)
      throw new MissingThroughAssociationSource({
        dreamClass,
        throughClass,
        association,
      })

    return { throughAssociation, throughClass, newAssociation }
  }

  /**
   * @internal
   *
   * Polymorphic BelongsTo. Since polymorphic associations may point to multiple tables,
   * preload by loading each target class separately.
   *
   * Used to preload polymorphic belongs to associations
   */
  private async preloadPolymorphicBelongsTo(
    this: Query<DreamInstance, QueryTypeOpts>,
    association: BelongsToStatement<any, any, any, string>,
    dreams: Dream[]
  ) {
    if (!association.polymorphic)
      throw new Error(
        `Association ${association.as} points to an array of models but is not designated polymorphic`
      )
    if (association.type !== 'BelongsTo')
      throw new Error(
        `Polymorphic association ${association.as} points to an array of models but is ${association.type as string}. Only BelongsTo associations may point to an array of models.`
      )

    const associatedDreams: Dream[] = []

    for (const associatedModel of association.modelCB() as (typeof Dream)[]) {
      await this.preloadPolymorphicAssociationModel(dreams, association, associatedModel, associatedDreams)
    }

    return associatedDreams
  }

  private async preloadPolymorphicAssociationModel(
    dreams: Dream[],
    association: BelongsToStatement<any, any, any, string>,
    associatedDreamClass: typeof Dream,
    associatedDreams: Dream[]
  ) {
    const relevantAssociatedModels = dreams.filter((dream: any) => {
      return dream[association.foreignKeyTypeField()] === associatedDreamClass['stiBaseClassOrOwnClassName']
    })

    if (relevantAssociatedModels.length) {
      dreams.forEach((dream: any) => {
        dream[associationToGetterSetterProp(association)] = null
      })

      // Load all models of type associated that are associated with any of the already loaded Dream models
      const loadedAssociations = await this.dreamClassQueryWithScopeBypasses(associatedDreamClass, {
        // The association may remove specific default scopes that would otherwise preclude
        // certain instances of the associated class from being found.
        defaultScopesToBypassExceptOnAssociations: association.withoutDefaultScopes,
      })
        .where({
          [associatedDreamClass.primaryKey]: relevantAssociatedModels.map(
            (dream: any) => dream[association.foreignKey()]
          ),
        })
        .all()

      loadedAssociations.forEach((loadedAssociation: Dream) => associatedDreams.push(loadedAssociation))

      //////////////////////////////////////////////////////////////////////////////////////////////
      // Associate each loaded association with each dream based on primary key and foreign key type
      //////////////////////////////////////////////////////////////////////////////////////////////
      for (const loadedAssociation of loadedAssociations) {
        dreams
          .filter((dream: any) => {
            return (
              dream[association.foreignKeyTypeField()] === loadedAssociation['stiBaseClassOrOwnClassName'] &&
              dream[association.foreignKey()] === association.primaryKeyValue(loadedAssociation)
            )
          })
          .forEach((dream: any) => {
            dream[association.as] = loadedAssociation
          })
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
  private async applyOnePreload(
    this: Query<DreamInstance, QueryTypeOpts>,
    associationName: string,
    dreams: Dream | Dream[],
    onStatement: RelaxedPreloadOnStatement<any, any> = {}
  ) {
    if (!Array.isArray(dreams)) dreams = [dreams] as Dream[]

    const dream = dreams.find(dream => dream['getAssociationMetadata'](associationName))!
    if (!dream) return

    const { name, alias } = extractAssociationMetadataFromAssociationName(associationName)

    const association = dream['getAssociationMetadata'](name)
    const dreamClass = dream.constructor as typeof Dream
    const dreamClassToHydrate = association.modelCB() as typeof Dream

    if ((association.polymorphic && association.type === 'BelongsTo') || Array.isArray(dreamClassToHydrate))
      return this.preloadPolymorphicBelongsTo(
        association as BelongsToStatement<any, any, any, string>,
        dreams
      )

    const dreamClassToHydrateColumns = [...dreamClassToHydrate.columns()]
    const throughColumnsToHydrate: any[] = []

    const columnsToPluck = dreamClassToHydrateColumns.map(column =>
      this.namespaceColumn(column.toString(), alias)
    ) as any[]

    const asHasAssociation = association as
      | HasManyStatement<any, any, any, any>
      | HasOneStatement<any, any, any, any>

    if (asHasAssociation.through && asHasAssociation.preloadThroughColumns) {
      if (isObject(asHasAssociation.preloadThroughColumns)) {
        const preloadMap = asHasAssociation.preloadThroughColumns as Record<string, string>
        Object.keys(preloadMap).forEach(preloadThroughColumn => {
          throughColumnsToHydrate.push(preloadMap[preloadThroughColumn])
          columnsToPluck.push(this.namespaceColumn(preloadThroughColumn, asHasAssociation.through))
        })
      } else {
        const preloadArray = asHasAssociation.preloadThroughColumns as string[]
        preloadArray.forEach(preloadThroughColumn => {
          throughColumnsToHydrate.push(preloadThroughColumn)
          columnsToPluck.push(this.namespaceColumn(preloadThroughColumn, asHasAssociation.through))
        })
      }
    }

    columnsToPluck.push(this.namespaceColumn(dreamClass.primaryKey, dreamClass.table))

    const baseClass = dreamClass['stiBaseClassOrOwnClass']['getAssociationMetadata'](associationName)
      ? dreamClass['stiBaseClassOrOwnClass']
      : dreamClass

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
    })

    const hydrationData: any[][] = await associationDataScope
      ._connection(this.connectionOverride)
      .innerJoin(associationName, (onStatement || {}) as JoinOnStatements<any, any, any, any>)
      .pluck(...columnsToPluck)

    const preloadedDreamsAndWhatTheyPointTo: PreloadedDreamsAndWhatTheyPointTo[] = hydrationData.map(
      pluckedData => {
        const attributes = {} as any
        dreamClassToHydrateColumns.forEach(
          (columnName, index) =>
            (attributes[protectAgainstPollutingAssignment(columnName)] = pluckedData[index])
        )

        const hydratedDream = sqlResultToDreamInstance(dreamClassToHydrate, attributes)

        throughColumnsToHydrate.forEach(
          (throughAssociationColumn, index) =>
            ((hydratedDream as any).preloadedThroughColumns[throughAssociationColumn] =
              pluckedData[dreamClassToHydrateColumns.length + index])
        )

        return {
          dream: hydratedDream,
          pointsToPrimaryKey: pluckedData[pluckedData.length - 1],
        }
      }
    )

    this.hydrateAssociation(dreams, association, preloadedDreamsAndWhatTheyPointTo)

    return preloadedDreamsAndWhatTheyPointTo.map(obj => obj.dream)
  }

  /**
   * @internal
   *
   * Used by loadBuider
   */
  private async hydratePreload(this: Query<DreamInstance, QueryTypeOpts>, dream: Dream) {
    await this.applyPreload(this.preloadStatements as any, this.preloadOnStatements as any, dream)
  }

  /**
   * @internal
   *
   * Applies a preload statement
   */
  private async applyPreload(
    this: Query<DreamInstance, QueryTypeOpts>,
    preloadStatement: RelaxedPreloadStatement,
    preloadOnStatements: RelaxedPreloadOnStatement<any, any>,
    dream: Dream | Dream[]
  ) {
    const keys = Object.keys(preloadStatement as any)

    for (const key of keys) {
      const nestedDreams = await this.applyOnePreload(
        key,
        dream,
        this.applyablePreloadOnStatements(preloadOnStatements[key] as RelaxedPreloadOnStatement<any, any>)
      )

      if (nestedDreams) {
        await this.applyPreload((preloadStatement as any)[key], preloadOnStatements[key] as any, nestedDreams)
      }
    }
  }

  /**
   * @internal
   *
   * retrieves on statements that can be applied to a preload
   */
  private applyablePreloadOnStatements(
    preloadOnStatements: RelaxedPreloadOnStatement<any, any> | undefined
  ): RelaxedPreloadOnStatement<any, any> | undefined {
    if (preloadOnStatements === undefined) return undefined

    return Object.keys(preloadOnStatements).reduce(
      (agg, key) => {
        const value = preloadOnStatements[key]
        // filter out plain objects, but not ops and not on/notOn/onAny statements
        // because plain objects are just the next level of nested preload
        if (
          key === 'on' ||
          key === 'notOn' ||
          key === 'onAny' ||
          value === null ||
          value.constructor !== Object
        ) {
          agg[key] = value
        }

        return agg
      },
      {} as RelaxedPreloadOnStatement<any, any>
    )
  }

  private conditionallyApplyDefaultScopes() {
    if (this.bypassAllDefaultScopes || this.bypassAllDefaultScopesExceptOnAssociations) return this

    const thisScopes = this.dreamClass['scopes'].default
    let query: Query<DreamInstance, QueryTypeOpts> = this
    for (const scope of thisScopes) {
      if (
        !shouldBypassDefaultScope(scope.method, {
          defaultScopesToBypass: [
            ...this.defaultScopesToBypass,
            ...this.defaultScopesToBypassExceptOnAssociations,
          ],
        })
      ) {
        query = (this.dreamClass as any)[scope.method](query)
      }
    }

    return query
  }

  /**
   * Each association in the chain is pushed onto `throughAssociations`
   * and `applyOneJoin` is recursively called. The trick is that the
   * through associations don't get written into the SQL; they
   * locate the next association we need to build into the SQL,
   * which is only run by the association that started the `through`
   * chain. The final association at the end of the `through` chain _is_
   * written into the SQL as a full association, but the modifications from
   * the `through` association are only added when the recursion returns
   * back to the association that kicked off the through associations.
   */

  private joinsBridgeThroughAssociations<
    QueryType extends
      | SelectQueryBuilder<any, any, any>
      | UpdateQueryBuilder<any, any, any, any>
      | DeleteQueryBuilder<any, any, any>,
    Schema extends DreamInstance['schema'],
  >({
    query,
    dreamClass,
    association,
    previousAssociationTableOrAlias,
    throughAssociations,
    joinType,
  }: {
    query: QueryType
    dreamClass: typeof Dream
    association:
      | HasOneStatement<any, any, any, any>
      | HasManyStatement<any, any, any, any>
      | BelongsToStatement<any, any, any, any>
    previousAssociationTableOrAlias: TableOrAssociationName<Schema>
    throughAssociations: (HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>)[]
    joinType: JoinTypes
  }): {
    query: QueryType
    dreamClass: typeof Dream
    association:
      | HasOneStatement<any, any, any, any>
      | HasManyStatement<any, any, any, any>
      | BelongsToStatement<any, any, any, any>
    throughClass?: typeof Dream | null
    previousAssociationTableOrAlias: TableOrAssociationName<Schema>
  } {
    if (association.type === 'BelongsTo' || !association.through) {
      return {
        query,
        dreamClass,
        association,
        previousAssociationTableOrAlias,
      }
    } else {
      throughAssociations.push(association)

      // We have entered joinsBridgeThroughAssociations with the
      // CompositionAssetAudits HasOne User association, which
      // is through compositionAsset
      // We now apply the compositionAsset association (a BelongsTo)
      // to the query
      const { query: queryWithThroughAssociationApplied } = this.applyOneJoin({
        query,
        dreamClass,
        previousAssociationTableOrAlias,
        currentAssociationTableOrAlias: association.through as TableOrAssociationName<Schema>,
        throughAssociations,
        joinType,
      })

      // The through association has both a `through` and a `source`. The `source`
      // is the association on the model that has now been joined. In our example,
      // the `source` is the `user` association on the CompositionAsset model
      const { newAssociation, throughAssociation, throughClass } = this.followThroughAssociation(
        dreamClass,
        association
      )

      if ((newAssociation as any).through) {
        // This new association is itself a through association, so we recursively
        // call joinsBridgeThroughAssociations
        return this.joinsBridgeThroughAssociations({
          query: queryWithThroughAssociationApplied,
          dreamClass: throughClass,
          association: newAssociation,
          previousAssociationTableOrAlias: throughAssociation.as as TableOrAssociationName<Schema>,
          throughAssociations,
          joinType,
        })
      } else {
        // This new association is not a through association, so
        // this is the target association we were looking for
        return {
          query: queryWithThroughAssociationApplied,
          dreamClass: association.modelCB(),
          association: newAssociation,
          throughClass,
          previousAssociationTableOrAlias: association.through as TableOrAssociationName<Schema>,
        }
      }
    }
  }

  private applyOneJoin<
    QueryType extends
      | SelectQueryBuilder<any, any, any>
      | UpdateQueryBuilder<any, any, any, any>
      | DeleteQueryBuilder<any, any, any>,
    DB extends DreamInstance['DB'],
    Schema extends DreamInstance['schema'],
  >({
    query,
    dreamClass,
    previousAssociationTableOrAlias,
    currentAssociationTableOrAlias,
    joinOnStatements = {},
    throughAssociations = [],
    joinType,
  }: {
    query: QueryType
    dreamClass: typeof Dream
    previousAssociationTableOrAlias: TableOrAssociationName<Schema>
    currentAssociationTableOrAlias: TableOrAssociationName<Schema>
    joinOnStatements?: RelaxedJoinOnStatement<any, any>
    throughAssociations?: (HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>)[]

    joinType: JoinTypes
  }): {
    query: QueryType
    association:
      | HasOneStatement<any, any, any, any>
      | HasManyStatement<any, any, any, any>
      | BelongsToStatement<any, any, any, any>
    previousAssociationTableOrAlias: TableOrAssociationName<Schema>
    currentAssociationTableOrAlias: TableOrAssociationName<Schema>
  } {
    const { name, alias } = extractAssociationMetadataFromAssociationName(currentAssociationTableOrAlias)
    previousAssociationTableOrAlias = extractAssociationMetadataFromAssociationName(
      previousAssociationTableOrAlias
    ).alias
    currentAssociationTableOrAlias = alias

    let association = dreamClass['getAssociationMetadata'](name)

    if (!association) {
      throw new JoinAttemptedOnMissingAssociation({
        dreamClass,
        associationName: currentAssociationTableOrAlias,
      })
    }

    const results = this.joinsBridgeThroughAssociations({
      query,
      dreamClass,
      association,
      previousAssociationTableOrAlias,
      throughAssociations,
      joinType,
    })

    query = results.query
    dreamClass = results.dreamClass

    association = results.association
    const timeToApplyThroughAssociations =
      throughAssociations.length && throughAssociations[0].source === association.as

    const originalPreviousAssociationTableOrAlias = previousAssociationTableOrAlias
    previousAssociationTableOrAlias = results.previousAssociationTableOrAlias
    const throughClass = results.throughClass

    if (timeToApplyThroughAssociations) {
      /**
       * Each association in the chain is pushed onto `throughAssociations`
       * and `applyOneJoin` is recursively called. The trick is that the
       * through associations don't get written into the SQL; they
       * locate the next association we need to build into the SQL,
       * which is only run by the association that started the `through`
       * chain (thus the
       * `throughAssociations.length && throughAssociations[0].source === association.as`
       * above). The final association at the end of the `through` chain _is_
       * written into the SQL as a full association, but the modifications from
       * the `through` association are only added when the recursion returns
       * back to the association that kicked off the through associations.
       */

      throughAssociations.forEach(
        (throughAssociation: HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>) => {
          if (throughAssociation.type === 'HasMany') {
            if ((query as SelectQueryBuilder<any, any, any>)?.distinctOn && throughAssociation.distinct) {
              query = (query as SelectQueryBuilder<any, any, any>).distinctOn(
                this.distinctColumnNameForAssociation({
                  association: throughAssociation,
                  tableNameOrAlias: currentAssociationTableOrAlias,
                  foreignKey: throughAssociation.primaryKey(),
                }) as string
              ) as QueryType
            }

            if (throughAssociation.order) {
              query = this.applyOrderStatementForAssociation({
                query,
                association: throughAssociation,
                tableNameOrAlias: currentAssociationTableOrAlias,
              })
            }
          }
        }
      )
    }

    if (association.type === 'BelongsTo') {
      if (Array.isArray(association.modelCB()))
        throw new CannotJoinPolymorphicBelongsToError({
          dreamClass,
          association,
          innerJoinStatements: this.innerJoinStatements,
          leftJoinStatements: this.leftJoinStatements,
        })

      const to = (association.modelCB() as typeof Dream).table
      const joinTableExpression =
        currentAssociationTableOrAlias === to
          ? currentAssociationTableOrAlias
          : `${to} as ${currentAssociationTableOrAlias}`

      query = (query as any)[(joinType === 'inner' ? 'innerJoin' : 'leftJoin') as 'innerJoin'](
        joinTableExpression,
        (join: JoinBuilder<any, any>) => {
          join = join.onRef(
            this.namespaceColumn(association.foreignKey(), previousAssociationTableOrAlias),
            '=',
            this.namespaceColumn(association.primaryKey(), currentAssociationTableOrAlias)
          )

          if (timeToApplyThroughAssociations) {
            throughAssociations.forEach(
              (
                throughAssociation: HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>
              ) => {
                join = this.applyAssociationOnStatementsToJoinStatement({
                  join,
                  association: throughAssociation,
                  currentAssociationTableOrAlias,
                  previousAssociationTableOrAlias: originalPreviousAssociationTableOrAlias,
                  joinOnStatements,
                })
              }
            )
          }

          join = this.conditionallyApplyDefaultScopesDependentOnAssociation({
            join,
            tableNameOrAlias: currentAssociationTableOrAlias,
            association,
          })

          join = this.applyJoinOnStatements(
            join,
            joinOnStatements[currentAssociationTableOrAlias] as RelaxedJoinOnStatement<DB, Schema>,
            currentAssociationTableOrAlias
          )

          return join
        }
      )
    } else {
      const to = association.modelCB().table
      const joinTableExpression =
        currentAssociationTableOrAlias === to
          ? currentAssociationTableOrAlias
          : `${to} as ${currentAssociationTableOrAlias}`

      query = (query as any)[(joinType === 'inner' ? 'innerJoin' : 'leftJoin') as 'innerJoin'](
        joinTableExpression,
        (join: JoinBuilder<any, any>) => {
          join = join.onRef(
            this.namespaceColumn(association.primaryKey(), previousAssociationTableOrAlias),
            '=',
            this.namespaceColumn(association.foreignKey(), currentAssociationTableOrAlias)
          )

          if (association.polymorphic) {
            join = join.on((eb: ExpressionBuilder<any, any>) =>
              this.whereStatementToExpressionWrapper(
                eb,
                this.aliasWhereStatement(
                  {
                    [association.foreignKeyTypeField()]: throughClass
                      ? throughClass['stiBaseClassOrOwnClassName']
                      : dreamClass['stiBaseClassOrOwnClassName'],
                  } as any,
                  currentAssociationTableOrAlias
                )
              )
            )
          }

          if (timeToApplyThroughAssociations) {
            throughAssociations.forEach(
              (
                throughAssociation: HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>
              ) => {
                join = this.applyAssociationOnStatementsToJoinStatement({
                  join,
                  association: throughAssociation,
                  currentAssociationTableOrAlias,
                  previousAssociationTableOrAlias: originalPreviousAssociationTableOrAlias,
                  joinOnStatements,
                })
              }
            )
          }

          join = this.applyAssociationOnStatementsToJoinStatement({
            join,
            association,
            currentAssociationTableOrAlias,
            previousAssociationTableOrAlias,
            joinOnStatements,
          })

          join = this.conditionallyApplyDefaultScopesDependentOnAssociation({
            join,
            tableNameOrAlias: currentAssociationTableOrAlias,
            association,
          })

          join = this.applyJoinOnStatements(
            join,
            joinOnStatements[currentAssociationTableOrAlias] as RelaxedJoinOnStatement<DB, Schema>,
            currentAssociationTableOrAlias
          )

          return join
        }
      )

      if (association.type === 'HasMany') {
        if (association.order) {
          query = this.applyOrderStatementForAssociation({
            query,
            tableNameOrAlias: currentAssociationTableOrAlias,
            association,
          })
        }

        if ((query as SelectQueryBuilder<any, any, any>).distinctOn && association.distinct) {
          query = (query as SelectQueryBuilder<any, any, any>).distinctOn(
            this.distinctColumnNameForAssociation({
              association,
              tableNameOrAlias: currentAssociationTableOrAlias,
              foreignKey: association.foreignKey(),
            }) as string
          ) as QueryType
        }
      }
    }

    return {
      query,
      association,
      previousAssociationTableOrAlias,
      currentAssociationTableOrAlias,
    }
  }

  private applyAssociationOnStatementsToJoinStatement({
    join,
    currentAssociationTableOrAlias,
    previousAssociationTableOrAlias,
    association,
    joinOnStatements,
  }: {
    join: JoinBuilder<any, any>
    currentAssociationTableOrAlias: string
    previousAssociationTableOrAlias: string
    association: HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>
    joinOnStatements: RelaxedJoinOnStatement<any, any>
  }) {
    if (association.on) {
      this.throwUnlessAllRequiredWhereClausesProvided(
        association,
        currentAssociationTableOrAlias,
        joinOnStatements
      )

      join = join.on((eb: ExpressionBuilder<any, any>) =>
        this.whereStatementToExpressionWrapper(
          eb,
          this.aliasWhereStatement(
            association.on as WhereStatement<any, any, any>,
            currentAssociationTableOrAlias
          ),
          { disallowSimilarityOperator: false }
        )
      )
    }

    if (association.notOn) {
      join = join.on((eb: ExpressionBuilder<any, any>) =>
        this.whereStatementToExpressionWrapper(
          eb,
          this.aliasWhereStatement(
            association.notOn as WhereStatement<any, any, any>,
            currentAssociationTableOrAlias
          ),
          { negate: true }
        )
      )
    }

    if (association.onAny) {
      join = join.on((eb: ExpressionBuilder<any, any>) =>
        eb.or(
          (association.onAny as WhereStatement<any, any, any>[]).map(whereAnyStatement =>
            this.whereStatementToExpressionWrapper(
              eb,
              this.aliasWhereStatement(whereAnyStatement, currentAssociationTableOrAlias),
              { disallowSimilarityOperator: false }
            )
          )
        )
      )
    }

    if (association.selfOn) {
      join = join.on((eb: ExpressionBuilder<any, any>) =>
        this.whereStatementToExpressionWrapper(
          eb,
          this.rawifiedSelfOnClause({
            associationAlias: association.as,
            selfAlias: previousAssociationTableOrAlias,
            selfOnClause: association.selfOn as any,
          })
        )
      )
    }

    if (association.selfNotOn) {
      join = join.on((eb: ExpressionBuilder<any, any>) =>
        this.whereStatementToExpressionWrapper(
          eb,
          this.rawifiedSelfOnClause({
            associationAlias: association.as,
            selfAlias: previousAssociationTableOrAlias,
            selfOnClause: association.selfNotOn as any,
          }),
          { negate: true }
        )
      )
    }

    return join
  }

  private conditionallyApplyDefaultScopesDependentOnAssociation({
    join,
    tableNameOrAlias,
    association,
  }: {
    join: JoinBuilder<any, any>
    tableNameOrAlias: string
    association:
      | HasOneStatement<any, any, any, any>
      | HasManyStatement<any, any, any, any>
      | BelongsToStatement<any, any, any, any>
  }) {
    let scopesQuery = new Query<DreamInstance, QueryTypeOpts>(this.dreamInstance)
    const associationClass = association.modelCB() as typeof Dream
    const associationScopes = associationClass['scopes'].default

    for (const scope of associationScopes) {
      if (
        !shouldBypassDefaultScope(scope.method, {
          bypassAllDefaultScopes: this.bypassAllDefaultScopes,
          defaultScopesToBypass: [...this.defaultScopesToBypass, ...(association.withoutDefaultScopes || [])],
        })
      ) {
        const tempQuery = (associationClass as any)[scope.method](scopesQuery)
        // The scope method on a Dream model should return a clone of the Query it receives
        // (e.g. by returning `scope.where(...)`), but in case the function doesn't return,
        // or returns the wrong thing, we check before overriding `scopesQuery` with what the
        // method returned.
        if (tempQuery && tempQuery.constructor === scopesQuery.constructor) scopesQuery = tempQuery
      }
    }

    if (scopesQuery.whereStatements.length) {
      join = join.on((eb: ExpressionBuilder<any, any>) =>
        eb.and(
          scopesQuery.whereStatements.flatMap(whereStatement =>
            this.whereStatementToExpressionWrapper(
              eb,
              this.aliasWhereStatement(whereStatement, tableNameOrAlias),
              { disallowSimilarityOperator: false }
            )
          )
        )
      )
    }

    return join
  }

  private distinctColumnNameForAssociation({
    association,
    tableNameOrAlias,
    foreignKey,
  }: {
    association: any
    tableNameOrAlias: string
    foreignKey: string
  }) {
    if (!association.distinct) return null
    if (association.distinct === true) return this.namespaceColumn(foreignKey, tableNameOrAlias)
    return this.namespaceColumn(association.distinct, tableNameOrAlias)
  }

  private recursivelyJoin<
    QueryType extends
      | SelectQueryBuilder<any, any, any>
      | UpdateQueryBuilder<any, any, any, any>
      | DeleteQueryBuilder<any, any, any>,
    Schema extends DreamInstance['schema'],
  >({
    query,
    joinsStatement,
    joinOnStatements,
    dreamClass,
    previousAssociationTableOrAlias,
    joinType,
  }: {
    query: QueryType
    joinsStatement: RelaxedJoinOnStatement<any, any>
    joinOnStatements: RelaxedJoinOnStatement<any, any>
    dreamClass: typeof Dream
    previousAssociationTableOrAlias: TableOrAssociationName<Schema>
    joinType: 'inner' | 'left'
  }): QueryType {
    for (const currentAssociationTableOrAlias of Object.keys(joinsStatement)) {
      const results = this.applyOneJoin({
        query,
        dreamClass,
        previousAssociationTableOrAlias,
        currentAssociationTableOrAlias,
        joinOnStatements,
        joinType,
      })

      query = results.query
      const association = results.association as AssociationStatement

      query = this.recursivelyJoin({
        query,
        joinsStatement: joinsStatement[currentAssociationTableOrAlias] as any,
        joinOnStatements: joinOnStatements[currentAssociationTableOrAlias] as any,
        dreamClass: association.modelCB() as typeof Dream,
        previousAssociationTableOrAlias: currentAssociationTableOrAlias,
        joinType,
      })
    }

    return query
  }

  private throwUnlessAllRequiredWhereClausesProvided(
    association: HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>,
    namespace: string,
    joinOnStatements: RelaxedJoinOnStatement<any, any>
  ) {
    const whereStatement = association.on!
    const columnsRequiringWhereStatements = Object.keys(whereStatement).reduce((agg, column) => {
      if (whereStatement[column] === DreamConst.required) agg.push(column)
      return agg
    }, [] as string[])

    const missingRequiredWhereStatements = columnsRequiringWhereStatements.filter(
      column => (joinOnStatements[namespace] as any)?.on?.[column] === undefined
    )

    if (missingRequiredWhereStatements.length)
      throw new MissingRequiredAssociationOnClause(association, missingRequiredWhereStatements[0])
  }

  private applyOrderStatementForAssociation<
    QueryType extends
      | SelectQueryBuilder<any, any, any>
      | UpdateQueryBuilder<any, any, any, any>
      | DeleteQueryBuilder<any, any, any>,
  >({
    query,
    tableNameOrAlias,
    association,
  }: {
    query: QueryType
    tableNameOrAlias: string
    association: HasManyStatement<any, any, any, any>
  }): QueryType {
    if (!(query as SelectQueryBuilder<any, any, any>).orderBy) return query
    let selectQuery = query as SelectQueryBuilder<any, any, any>
    const orderStatement = association.order

    if (isString(orderStatement)) {
      selectQuery = selectQuery.orderBy(
        this.namespaceColumn(orderStatement as string, tableNameOrAlias),
        'asc'
      )
    } else {
      Object.keys(orderStatement as Record<string, OrderDir>).forEach(column => {
        const direction = (orderStatement as any)[column] as OrderDir
        selectQuery = selectQuery.orderBy(this.namespaceColumn(column, tableNameOrAlias), direction)
      })
    }

    return selectQuery as QueryType
  }

  private inArrayWithNull_or_notInArrayWithoutNull_ExpressionBuilder(
    eb: ExpressionBuilder<any, any>,
    a: any,
    b: KyselyComparisonOperatorExpression,
    c: any[]
  ): ExpressionWrapper<any, any, SqlBool> {
    const isNullStatement = eb(a, 'is', null)
    const compactedC = compact(c)
    if (compactedC.length) return eb.or([eb(a, b, compactedC), isNullStatement])
    // not in an empty array means match everything
    if (b === 'not in') return sql<boolean>`TRUE` as unknown as ExpressionWrapper<any, any, SqlBool>
    return isNullStatement
  }

  private inArrayWithoutNullExpressionBuilder(
    eb: ExpressionBuilder<any, any>,
    a: any,
    b: KyselyComparisonOperatorExpression,
    c: any[]
  ): ExpressionWrapper<any, any, SqlBool> {
    const isNotNullStatement = eb(a, 'is not', null)
    const compactedC = compact(c)
    if (compactedC.length) return eb.and([eb(a, 'in', compactedC), isNotNullStatement])
    // in an empty array means match nothing
    return sql<boolean>`FALSE` as unknown as ExpressionWrapper<any, any, SqlBool>
  }

  private notInArrayWithNullExpressionBuilder(
    eb: ExpressionBuilder<any, any>,
    a: any,
    b: KyselyComparisonOperatorExpression,
    c: any[]
  ): ExpressionWrapper<any, any, SqlBool> {
    const isNullStatement = eb(a, 'is not', null)
    const compactedC = compact(c)

    if (compactedC.length) return eb.and([eb(a, 'not in', compactedC), isNullStatement])
    return isNullStatement
  }

  private whereStatementToExpressionWrapper(
    eb: ExpressionBuilder<any, any>,
    whereStatement: WhereStatement<any, any, any>,
    {
      negate = false,
      disallowSimilarityOperator = true,
    }: {
      negate?: boolean
      disallowSimilarityOperator?: boolean
    } = {}
  ): ExpressionWrapper<any, any, SqlBool> {
    const clauses = compact(
      Object.keys(whereStatement)
        .filter(key => (whereStatement as any)[key] !== DreamConst.required)
        .map(attr => {
          const val = (whereStatement as any)[attr]

          if (
            (val as OpsStatement<any, any>)?.isOpsStatement &&
            (val as OpsStatement<any, any>).shouldBypassWhereStatement
          ) {
            if (disallowSimilarityOperator) throw new Error('Similarity operator may not be used in whereAny')

            // some ops statements are handled specifically in the select portion of the query,
            // and should be ommited from the where clause directly
            return
          }

          const { a, b, c, a2, b2, c2 } = this.dreamWhereStatementToExpressionBuilderParts(attr, val)

          // postgres is unable to handle WHERE IN statements with blank arrays, such as in
          // "WHERE id IN ()", meaning that:
          // 1. If we receive a blank array during an IN comparison,
          //    then we need to simply regurgitate a where statement which
          //    guarantees no records.
          // 2. If we receive a blank array during a NOT IN comparison,
          //    then it is the same as the where statement not being present at all,
          //    resulting in a noop on our end
          //

          if (Array.isArray(c)) {
            if ((b === 'in' && c.includes(null)) || (b === 'not in' && !c.includes(null))) {
              return this.inArrayWithNull_or_notInArrayWithoutNull_ExpressionBuilder(eb, a, b, c)
            } else if (negate && b === 'in' && !c.includes(null)) {
              return this.inArrayWithoutNullExpressionBuilder(eb, a, b, c)
            } else if (b === 'not in' && c.includes(null)) {
              return this.notInArrayWithNullExpressionBuilder(eb, a, b, c)
            }

            const compactedC = compact(c)

            if (b === 'in' && compactedC.length === 0) {
              // in an empty array means match nothing
              return sql<boolean>`FALSE`
            } else if (b === 'not in' && compactedC.length === 0) {
              // not in an empty array means match everything
              return sql<boolean>`TRUE`
            } else {
              return eb(a, b, compactedC)
            }

            //
          } else if (b === '=' && c === null) {
            return eb(a, 'is', null)

            //
          } else if (b === '!=' && c === null) {
            return eb(a, 'is not', null)

            //
          } else if (b === '=' && negate) {
            return eb.and([eb(a, '=', c), eb(a, 'is not', null)])

            //
          } else if (b === '!=' && c !== null) {
            return eb.or([eb(a, '!=', c), eb(a, 'is', null)])

            //
          } else {
            const expression = eb(a, b, c)
            if (b2) return expression.and(eb(a2, b2, c2))
            return expression
          }
        })
    )

    return negate ? eb.not(eb.parens(eb.and(clauses))) : eb.and(clauses)
  }

  private dreamWhereStatementToExpressionBuilderParts(attr: string, val: any) {
    let a: any
    let b: KyselyComparisonOperatorExpression
    let c: any
    let a2: any = null
    let b2: KyselyComparisonOperatorExpression | null = null
    let c2: any = null

    if (val instanceof Function && val !== DreamConst.passthrough) {
      val = val()
    } else if (val === DreamConst.passthrough) {
      const column = attr.split('.').pop()
      if ((this.passthroughOnStatement as any)[column!] === undefined)
        throw new MissingRequiredPassthroughForAssociationOnClause(column!)
      val = (this.passthroughOnStatement as any)[column!]
    }

    if (val === null) {
      a = attr
      b = 'is'
      c = val
    } else if (['SelectQueryBuilder', 'SelectQueryBuilderImpl'].includes(val?.constructor?.name as string)) {
      a = attr
      b = 'in'
      c = val
    } else if (Array.isArray(val)) {
      a = attr
      b = 'in'
      c = val
    } else if (val instanceof CurriedOpsStatement) {
      val = val.toOpsStatement(this.dreamClass, attr)
      a = attr
      b = val.operator
      c = val.value
    } else if (val instanceof OpsStatement) {
      a = attr
      b = val.operator as KyselyComparisonOperatorExpression
      c = val.value
    } else if (val instanceof Range) {
      const rangeStart = val.begin
      const rangeEnd = val.end
      const excludeEnd = val.excludeEnd

      if (rangeStart && rangeEnd) {
        a = attr
        b = '>='
        c = rangeStart
        a2 = attr
        b2 = excludeEnd ? '<' : '<='
        c2 = rangeEnd
      } else if (rangeStart) {
        a = attr
        b = '>='
        c = rangeStart
      } else {
        a = attr
        b = excludeEnd ? '<' : '<='
        c = rangeEnd
      }
    } else {
      a = attr
      b = '='
      c = val
    }

    if (c instanceof DateTime || c instanceof CalendarDate) c = c.toJSDate()
    if (c2 instanceof DateTime || c2 instanceof CalendarDate) c2 = c2.toJSDate()

    if (a && c === undefined) throw new CannotPassUndefinedAsAValueToAWhereClause(this.dreamClass, a)
    if (a2 && c2 === undefined) throw new CannotPassUndefinedAsAValueToAWhereClause(this.dreamClass, a2)

    return { a, b, c, a2, b2, c2 }
  }

  private applyJoinOnStatements<Schema extends DreamInstance['schema']>(
    join: JoinBuilder<any, any>,
    joinOnStatement: JoinOnStatements<any, any, any, any> | null,
    rootTableOrAssociationAlias: TableOrAssociationName<Schema>
  ) {
    if (!joinOnStatement) return join

    join = this._applyJoinOnStatements(join, joinOnStatement.on, rootTableOrAssociationAlias)
    join = this._applyJoinOnStatements(join, joinOnStatement.notOn, rootTableOrAssociationAlias, {
      negate: true,
    })
    join = this._applyJoinOnAnyStatements(join, joinOnStatement.onAny, rootTableOrAssociationAlias)

    return join
  }

  private _applyJoinOnStatements<Schema extends DreamInstance['schema']>(
    join: JoinBuilder<any, any>,
    joinOnStatement: WhereStatement<any, any, any> | undefined,
    rootTableOrAssociationAlias: TableOrAssociationName<Schema>,
    {
      negate = false,
    }: {
      negate?: boolean
    } = {}
  ) {
    if (!joinOnStatement) return join

    return join.on((eb: ExpressionBuilder<any, any>) =>
      this.joinOnStatementToExpressionWrapper(joinOnStatement, rootTableOrAssociationAlias, eb, {
        negate,
        disallowSimilarityOperator: negate,
      })
    )
  }

  private _applyJoinOnAnyStatements<Schema extends DreamInstance['schema']>(
    join: JoinBuilder<any, any>,
    joinOnAnyStatement: WhereStatement<any, any, any>[] | undefined,
    rootTableOrAssociationAlias: TableOrAssociationName<Schema>
  ) {
    if (!joinOnAnyStatement) return join
    if (!joinOnAnyStatement.length) return join

    return join.on((eb: ExpressionBuilder<any, any>) => {
      return eb.or(
        joinOnAnyStatement.map(joinOnStatement =>
          this.joinOnStatementToExpressionWrapper(joinOnStatement, rootTableOrAssociationAlias, eb)
        )
      )
    })
  }

  private joinOnStatementToExpressionWrapper<Schema extends DreamInstance['schema']>(
    joinOnStatement: WhereStatement<any, any, any>,
    rootTableOrAssociationAlias: TableOrAssociationName<Schema>,
    eb: ExpressionBuilder<any, any>,
    {
      negate = false,
      disallowSimilarityOperator = true,
    }: {
      negate?: boolean
      disallowSimilarityOperator?: boolean
    } = {}
  ) {
    return this.whereStatementToExpressionWrapper(
      eb,

      Object.keys(joinOnStatement).reduce((agg: any, key: any) => {
        agg[this.namespaceColumn(key.toString(), rootTableOrAssociationAlias)] = joinOnStatement[key]
        return agg
      }, {}),

      {
        negate,
        disallowSimilarityOperator,
      }
    )
  }

  private buildCommon<
    QueryType extends
      | SelectQueryBuilder<any, any, any>
      | UpdateQueryBuilder<any, any, any, any>
      | DeleteQueryBuilder<any, any, any>,
  >(this: Query<DreamInstance, QueryTypeOpts>, kyselyQuery: QueryType): QueryType {
    this.checkForQueryViolations()

    const query = this.conditionallyApplyDefaultScopes()

    if (!isEmpty(query.innerJoinStatements)) {
      kyselyQuery = query.recursivelyJoin({
        query: kyselyQuery,
        joinsStatement: query.innerJoinStatements,
        joinOnStatements: query.innerJoinOnStatements,
        dreamClass: query.dreamClass,
        previousAssociationTableOrAlias: this.baseSqlAlias,
        joinType: 'inner',
      })
    }

    if (!isEmpty(query.leftJoinStatements)) {
      kyselyQuery = query.recursivelyJoin({
        query: kyselyQuery,
        joinsStatement: query.leftJoinStatements,
        joinOnStatements: query.leftJoinOnStatements,
        dreamClass: query.dreamClass,
        previousAssociationTableOrAlias: this.baseSqlAlias,
        joinType: 'left',
      })
    }

    if (query.whereStatements.length || query.whereNotStatements.length || query.whereAnyStatements.length) {
      kyselyQuery = (kyselyQuery as SelectQueryBuilder<any, any, any>).where(
        (eb: ExpressionBuilder<any, any>) =>
          eb.and([
            ...this.aliasWhereStatements(query.whereStatements, query.baseSqlAlias).map(whereStatement =>
              this.whereStatementToExpressionWrapper(eb, whereStatement, {
                disallowSimilarityOperator: false,
              })
            ),

            ...this.aliasWhereStatements(query.whereNotStatements, query.baseSqlAlias).map(
              whereNotStatement =>
                this.whereStatementToExpressionWrapper(eb, whereNotStatement, { negate: true })
            ),

            ...query.whereAnyStatements.map(whereAnyStatements =>
              eb.or(
                this.aliasWhereStatements(whereAnyStatements, query.baseSqlAlias).map(whereAnyStatement =>
                  this.whereStatementToExpressionWrapper(eb, whereAnyStatement)
                )
              )
            ),
          ])
      ) as QueryType
    }

    return kyselyQuery
  }

  private checkForQueryViolations(this: Query<DreamInstance, QueryTypeOpts>) {
    const invalidWhereNotClauses = this.similarityStatementBuilder().whereNotStatementsWithSimilarityClauses()
    if (invalidWhereNotClauses.length) {
      const { tableName, columnName, opsStatement } = invalidWhereNotClauses[0]
      throw new CannotNegateSimilarityClause(tableName, columnName, opsStatement.value)
    }
  }

  private aliasWhereStatements(whereStatements: Readonly<WhereStatement<any, any, any>[]>, alias: string) {
    return whereStatements.map(whereStatement => this.aliasWhereStatement(whereStatement, alias))
  }

  private aliasWhereStatement(whereStatement: Readonly<WhereStatement<any, any, any>>, alias: string) {
    return Object.keys(whereStatement).reduce((aliasedWhere, key) => {
      aliasedWhere[this.namespaceColumn(key, alias)] = (whereStatement as any)[key]
      return aliasedWhere
    }, {} as any)
  }

  private rawifiedSelfOnClause<DB extends DreamInstance['DB'], Schema extends DreamInstance['schema']>({
    associationAlias,
    selfAlias,
    selfOnClause,
  }: {
    associationAlias: string
    selfAlias: string
    selfOnClause: SelfOnStatement<any, DB, Schema, DreamInstance['table']>
  }) {
    const alphanumericUnderscoreRegexp = /[^a-zA-Z0-9_]/g
    selfAlias = selfAlias.replace(alphanumericUnderscoreRegexp, '')

    return Object.keys(selfOnClause).reduce((acc, key) => {
      const selfColumn = selfOnClause[key]?.replace(alphanumericUnderscoreRegexp, '')
      if (!selfColumn) return acc

      acc[this.namespaceColumn(key, associationAlias)] = sql.raw(
        `"${snakeify(selfAlias)}"."${snakeify(selfColumn)}"`
      )
      return acc
    }, {} as any)
  }

  private buildDelete(this: Query<DreamInstance, QueryTypeOpts>): DeleteQueryBuilder<any, any, any> {
    const kyselyQuery = this.dbFor('delete').deleteFrom(
      this.baseSqlAlias as unknown as AliasedExpression<any, any>
    )

    const results = this.attachLimitAndOrderStatementsToNonSelectQuery(kyselyQuery as any)
    return results.clone.buildCommon(results.kyselyQuery)
  }

  private buildSelect(
    this: Query<DreamInstance, QueryTypeOpts>,
    {
      bypassSelectAll = false,
      bypassOrder = false,
      columns,
    }: {
      bypassSelectAll?: boolean
      bypassOrder?: boolean
      columns?: DreamColumnNames<DreamInstance>[]
    } = {}
  ): SelectQueryBuilder<any, any, any> {
    let kyselyQuery: SelectQueryBuilder<any, any, any>

    if (this.baseSelectQuery) {
      kyselyQuery = (
        this.connectionOverride
          ? this.baseSelectQuery.connection(this.connectionOverride)
          : this.baseSelectQuery
      ).buildSelect({ bypassSelectAll: true })
    } else {
      const from =
        this.baseSqlAlias === this.tableName ? this.tableName : `${this.tableName} as ${this.baseSqlAlias}`

      kyselyQuery = this.dbFor('select').selectFrom(from)
    }

    if (this.distinctColumn) {
      kyselyQuery = kyselyQuery.distinctOn(this.distinctColumn)
    }

    kyselyQuery = this.buildCommon(kyselyQuery)

    kyselyQuery = this.conditionallyAttachSimilarityColumnsToSelect(kyselyQuery, {
      bypassOrder: bypassOrder || !!this.distinctColumn,
    }) as typeof kyselyQuery

    if (this.orderStatements.length && !bypassOrder) {
      this.orderStatements.forEach(orderStatement => {
        kyselyQuery = kyselyQuery.orderBy(
          this.namespaceColumn(orderStatement.column),
          orderByDirection(orderStatement.direction)
        )
      })
    }

    if (this.limitStatement) kyselyQuery = kyselyQuery.limit(this.limitStatement)
    if (this.offsetStatement) kyselyQuery = kyselyQuery.offset(this.offsetStatement)

    if (columns) {
      kyselyQuery = kyselyQuery.select(
        this.columnsWithRequiredLoadColumns(columns).map(column => this.namespaceColumn(column))
      )
    } else if (!bypassSelectAll) {
      kyselyQuery = kyselyQuery.selectAll(this.baseSqlAlias)
    }

    return kyselyQuery
  }

  private columnsWithRequiredLoadColumns(columns: string[]) {
    return uniq(
      compact([this.dreamClass.primaryKey, this.dreamClass['isSTIBase'] ? 'type' : null, ...columns])
    )
  }

  private buildUpdate<DB extends DreamInstance['DB']>(
    attributes: Updateable<DreamInstance['table']>
  ): UpdateQueryBuilder<DB, any, any, object> {
    let kyselyQuery = this.dbFor('update')
      .updateTable(this.tableName as DreamInstance['table'])
      .set(attributes as any)

    kyselyQuery = this.conditionallyAttachSimilarityColumnsToUpdate(kyselyQuery)

    const results = this.attachLimitAndOrderStatementsToNonSelectQuery(kyselyQuery as any)
    return results.clone.buildCommon(results.kyselyQuery)
  }

  private attachLimitAndOrderStatementsToNonSelectQuery<
    T extends Query<DreamInstance, QueryTypeOpts>,
    QueryType extends UpdateQueryBuilder<any, any, any, any> | DeleteQueryBuilder<any, any, any>,
  >(this: T, kyselyQuery: QueryType): { kyselyQuery: QueryType; clone: T } {
    if (this.limitStatement || this.orderStatements.length) {
      kyselyQuery = (kyselyQuery as any).where((eb: ExpressionBuilder<any, any>) => {
        const subquery = this.nestedSelect(this.dreamInstance.primaryKey)

        return eb(this.dreamInstance.primaryKey as any, 'in', subquery)
      }) as typeof kyselyQuery

      return {
        kyselyQuery,
        clone: this.clone<T>({ where: null, whereNot: null, order: null, limit: null }),
      }
    }

    return { kyselyQuery, clone: this }
  }

  private get hasSimilarityClauses() {
    return (this as any).similarityStatementBuilder().hasSimilarityClauses
  }

  private similarityStatementBuilder(this: Query<DreamInstance, QueryTypeOpts>) {
    return new SimilarityBuilder(this.dreamInstance, {
      where: [...this.whereStatements],
      whereNot: [...this.whereNotStatements],
      joinOnStatements: this.innerJoinOnStatements,
      transaction: this.dreamTransaction,
      connection: this.connectionOverride,
    })
  }

  private conditionallyAttachSimilarityColumnsToSelect(
    this: Query<DreamInstance, QueryTypeOpts>,
    kyselyQuery: SelectQueryBuilder<DreamInstance['DB'], any, object>,
    { bypassOrder = false }: { bypassOrder?: boolean } = {}
  ) {
    const similarityBuilder = this.similarityStatementBuilder()
    if (similarityBuilder.hasSimilarityClauses) {
      kyselyQuery = similarityBuilder.select(kyselyQuery, { bypassOrder })
    }

    return kyselyQuery
  }

  private conditionallyAttachSimilarityColumnsToUpdate(
    this: Query<DreamInstance, QueryTypeOpts>,
    kyselyQuery: UpdateQueryBuilder<DreamInstance['DB'], any, any, any>
  ) {
    const similarityBuilder = this.similarityStatementBuilder()
    if (similarityBuilder.hasSimilarityClauses) {
      kyselyQuery = similarityBuilder.update(kyselyQuery)
    }
    return kyselyQuery
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
  baseSqlAlias?: TableOrAssociationName<Schema>
  baseSelectQuery?: Query<any, any> | null
  passthroughOnStatement?: PassthroughOnClause<PassthroughColumns> | null
  where?: readonly WhereStatement<DB, Schema, any>[] | null
  whereNot?: readonly WhereStatement<DB, Schema, any>[] | null
  limit?: LimitStatement | null
  offset?: OffsetStatement | null
  or?: WhereStatement<DB, Schema, any>[][] | null
  order?: OrderQueryStatement<ColumnType>[] | null
  loadFromJoins?: boolean
  preloadStatements?: RelaxedPreloadStatement
  preloadOnStatements?: RelaxedPreloadOnStatement<DB, Schema>
  distinctColumn?: ColumnType | null
  innerJoinDreamClasses?: readonly (typeof Dream)[]
  innerJoinStatements?: RelaxedJoinStatement
  innerJoinOnStatements?: RelaxedJoinOnStatement<DB, Schema>
  leftJoinStatements?: RelaxedJoinStatement
  leftJoinOnStatements?: RelaxedJoinOnStatement<DB, Schema>
  bypassAllDefaultScopes?: boolean
  bypassAllDefaultScopesExceptOnAssociations?: boolean
  defaultScopesToBypass?: AllDefaultScopeNames<DreamInstance>[]
  defaultScopesToBypassExceptOnAssociations?: DefaultScopeName<DreamInstance>[]
  transaction?: DreamTransaction<Dream> | null | undefined
  connection?: DbConnectionType
  shouldReallyDestroy?: boolean
}

function getSourceAssociation(dream: Dream | typeof Dream | undefined, sourceName: string) {
  if (!dream) return
  if (!sourceName) return
  return (
    (dream as Dream)['getAssociationMetadata'](sourceName) ||
    (dream as Dream)['getAssociationMetadata'](pluralize.singular(sourceName))
  )
}

export interface PreloadedDreamsAndWhatTheyPointTo {
  dream: Dream
  pointsToPrimaryKey: IdType
}

export interface FindEachOpts {
  batchSize?: number
}

type JoinTypes = 'inner' | 'left'

export type ExtendQueryType<
  OriginalOpts extends Readonly<QueryTypeOptions>,
  Opts extends Readonly<Partial<QueryTypeOptions>>,
> = Readonly<{
  joinedAssociations: Opts['joinedAssociations'] extends Readonly<JoinedAssociation[]>
    ? Readonly<[...OriginalOpts['joinedAssociations'], ...Opts['joinedAssociations']]>
    : OriginalOpts['joinedAssociations']

  rootTableName: OriginalOpts['rootTableName']
  rootTableAlias: OriginalOpts['rootTableAlias']

  allowPreload: Opts['allowPreload'] extends false ? false : OriginalOpts['allowPreload']
  allowLeftJoinPreload: Opts['allowLeftJoinPreload'] extends false
    ? false
    : OriginalOpts['allowLeftJoinPreload']
}>

export type NamespacedColumnType<
  ColumnName,
  Q extends Query<any, any>,
  DreamInstance extends Dream,
  //
  // begin: inferred types
  JoinedAssociationsArr = Q['queryTypeOpts']['joinedAssociations'],
  AssociationName = ColumnName extends `${infer Name extends string}.${string}` ? Name : never,
  RealColumnName = ColumnName extends `${string}.${infer Col extends string}` ? Col : never,
  JoinedAssociation extends FindInterfaceWithValue<
    JoinedAssociationsArr,
    'alias',
    AssociationName
  > = FindInterfaceWithValue<JoinedAssociationsArr, 'alias', AssociationName>,
  JoinedTable = JoinedAssociation['table'] extends never
    ? DreamInstance['table']
    : JoinedAssociation['table'],
  ReturnType = TableColumnType<DreamInstance['schema'], JoinedTable, RealColumnName>,
> = ReturnType

type NamespacedColumnTypes<ColumnNames, Q extends Query<any, any>, DreamInstance extends Dream> =
  ColumnNames extends Readonly<[infer First, ...infer Rest]>
    ? [
        NamespacedColumnType<First, Q, DreamInstance>,
        ...NamespacedColumnTypes<Readonly<Rest>, Q, DreamInstance>,
      ]
    : []

export type BaseModelColumnTypes<ColumnNames, DreamInstance extends Dream> =
  ColumnNames extends Readonly<[infer First, ...infer Rest]>
    ? [
        TableColumnType<DreamInstance['schema'], DreamInstance['table'], First>,
        ...BaseModelColumnTypes<Readonly<Rest>, DreamInstance>,
      ]
    : []

export type NamespacedOrBaseModelColumnTypes<
  ColumnNames,
  Q extends Query<any, any>,
  DreamInstance extends Dream,
> = Q['queryTypeOpts']['joinedAssociations']['length'] extends 0
  ? BaseModelColumnTypes<ColumnNames, DreamInstance>
  : NamespacedColumnTypes<ColumnNames, Q, DreamInstance>
