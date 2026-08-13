import { DeleteQueryBuilder, SelectQueryBuilder, UpdateQueryBuilder } from 'kysely'
import { SOFT_DELETE_SCOPE_NAME } from '../decorators/class/SoftDelete.js'
import acquireStabilizedSortableBatchLocks from '../decorators/field/sortable/helpers/acquireStabilizedSortableBatchLocks.js'
import { invalidateSortableRowCache } from '../decorators/field/sortable/helpers/sortableRowCache.js'
import DreamApp from '../dream-app/index.js'
import Dream from '../Dream.js'
import AssociationDeclaredWithoutAssociatedDreamClass from '../errors/associations/AssociationDeclaredWithoutAssociatedDreamClass.js'
import CannotCallUndestroyOnANonSoftDeleteModel from '../errors/CannotCallUndestroyOnANonSoftDeleteModel.js'
import CannotPassAdditionalFieldsToPluckEachAfterCallback from '../errors/CannotPassAdditionalFieldsToPluckEachAfterCallback.js'
import BatchingIncompatibleWithLimitOrOffset from '../errors/BatchingIncompatibleWithLimitOrOffset.js'
import InvalidBatchSize from '../errors/InvalidBatchSize.js'
import LeftJoinPreloadIncompatibleWithFindEach from '../errors/LeftJoinPreloadIncompatibleWithFindEach.js'
import RowLockIncompatibleWithDistinct from '../errors/RowLockIncompatibleWithDistinct.js'
import MissingRequiredCallbackFunctionToPluckEach from '../errors/MissingRequiredCallbackFunctionToPluckEach.js'
import MissingRequiredLockOptionForUpdateCallback from '../errors/MissingRequiredLockOptionForUpdateCallback.js'
import NoUpdateAllOnJoins from '../errors/NoUpdateAllOnJoins.js'
import NoUpdateOnAssociationQuery from '../errors/NoUpdateOnAssociationQuery.js'
import CannotPaginateWithLeftJoinPreload from '../errors/pagination/CannotPaginateWithLeftJoinPreload.js'
import CannotPaginateWithLimit from '../errors/pagination/CannotPaginateWithLimit.js'
import CannotPaginateWithOffset from '../errors/pagination/CannotPaginateWithOffset.js'
import RecordNotFound from '../errors/RecordNotFound.js'
import cloneDeepSafe from '../helpers/cloneDeepSafe.js'
import isObject from '../helpers/isObject.js'
import namespaceColumn from '../helpers/namespaceColumn.js'
import protectAgainstPollutingAssignment from '../helpers/protectAgainstPollutingAssignment.js'
import { toSafeObject } from '../helpers/toSafeObject.js'
import ops from '../ops/index.js'
import { HasManyStatement } from '../types/associations/hasMany.js'
import { HasOneStatement } from '../types/associations/hasOne.js'
import {
  AssociationStatement,
  ColumnNamesAccountingForJoinedAssociations,
  InternalWhereStatement,
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
  DreamSerializerKey,
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
  UpdateableProperties,
  ValidatedPluckEachColumnNames,
} from '../types/dream.js'
import {
  CursorPaginatedDreamQueryOptions,
  CursorPaginatedDreamQueryResult,
  DefaultQueryTypeOptions,
  ExtendQueryType,
  FindEachOpts,
  LoadForModifierFn,
  NamespacedOrBaseModelColumnTypes,
  PaginatedDreamQueryOptions,
  PaginatedDreamQueryResult,
  QueryToKyselyDBType,
  QueryToKyselyTableNamesType,
} from '../types/query.js'
import { DreamClassAndAssociationNameTuple } from '../types/recursiveSerialization.js'
import {
  JoinedAssociation,
  JoinedAssociationsTypeFromAssociations,
  QueryTypeOptions,
  VariadicJoinsArgs,
  VariadicLeftJoinLoadArgs,
  VariadicLoadArgs,
} from '../types/variadic.js'
import DreamTransaction from './DreamTransaction.js'
import buildSerializerPreloadPaths from './internal/buildSerializerPreloadPaths.js'
import computedPaginatePage from './internal/computedPaginatePage.js'
import convertDreamClassAndAssociationNameTupleArrayToPreloadArgs from './internal/convertDreamClassAndAssociationNameTupleArrayToPreloadArgs.js'
import { DestroyOptions } from './internal/destroyOptions.js'
import QueryDriverBase from './QueryDriver/Base.js'

/**
 * Cache for serializer preload-path results, keyed on the root class itself and then the serializer
 * key. Keying on the class rather than its global name is what makes the cache self-invalidating:
 * loading a fresh set of model classes into the process yields new class objects, so entries
 * resolved against the previous ones become unreachable and collectable rather than being served
 * under a name that now means something else.
 */
let extractedNestedPathsCache = new WeakMap<
  typeof Dream,
  Map<string, DreamClassAndAssociationNameTuple[][]>
>()

/**
 * @internal
 *
 * Drops every memoized preload path. Only needed when a class object that stays in the process has
 * its `serializers` getter replaced, which the cache cannot detect — specs that install or remove
 * one around an example. Replacing the model classes themselves needs no call, since the cache
 * keys on the class object. See `clearResolvedSerializerAssociationEdgesCache`, which has the same
 * contract and is cleared alongside it.
 */
export function clearSerializerPreloadPathsCache() {
  extractedNestedPathsCache = new WeakMap()
}

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
    // deliberately small: every record in a locked destroy or update batch
    // stays row-locked for the whole batch, so an oversized batch blocks
    // unrelated writers. See the `lock` options on Query#destroy and
    // Query#update.
    LOCKED_DESTROY: 10,
    LOCKED_UPDATE: 10,
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
  private readonly whereStatements: readonly InternalWhereStatement<
    DreamInstance,
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
  private readonly whereNotStatements: readonly InternalWhereStatement<
    DreamInstance,
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
  private readonly whereAnyStatements: readonly InternalWhereStatement<
    DreamInstance,
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
    DreamInstance,
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
    DreamInstance,
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
    DreamInstance,
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
   * specified primary key. Returns null if not found.
   *
   * ```ts
   * await User.query().find(123)
   * // User{id: 123}
   *
   * await User.query().find(null)
   * // null
   *
   * await User.query().find(undefined)
   * // null
   * ```
   *
   * @param primaryKey - The primary key of the record to look up.
   * @returns Either the found record, or else null
   */
  public async find(primaryKey: PrimaryKeyForFind<DreamInstance>): Promise<DreamInstance | null> {
    if (!primaryKey) return null

    return await this.where({
      [this.dreamInstance['_primaryKey']]: primaryKey,
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
  public async findBy(whereStatement: WhereStatement<DreamInstance>): Promise<DreamInstance | null> {
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
  public async findOrFailBy(whereStatement: WhereStatement<DreamInstance>): Promise<DreamInstance> {
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
   * await User.where({ deletedAt: null }).findEach(user => {
   *   DreamApp.log(user)
   * })
   * // User{id: 1}
   * // User{id: 2}
   * ```
   *
   * IMPORTANT: `findEach` always iterates in ascending primary key order.
   * Any `order` applied to the Query is discarded; passing one has no effect
   * on the order records are visited in.
   *
   * This is not a limitation that can be lifted. `findEach` guarantees that
   * every matching record is visited exactly once, and it delivers that by
   * paginating on a keyset: each batch selects the next `batchSize` records
   * with a primary key greater than the last record of the previous batch.
   * That guarantee only holds over a stable, unique key. Ordering by a
   * mutable, non-unique column would mean a record whose sort value changed
   * partway through the iteration could be skipped entirely or visited twice.
   * ({@link Query.cursorPaginate} can honor an arbitrary order precisely
   * because a paginated UI tolerates that anomaly; a full traversal cannot.)
   *
   * If you need records processed in a particular order, load them with a
   * regular ordered query instead of `findEach`.
   *
   * A `limit` or `offset` on the Query cannot compose with the batch windows
   * — each batch re-applies the Query's conditions, so the limit would be
   * silently replaced by `batchSize` and the offset re-applied to every
   * window — so a limit- or offset-carrying Query throws at runtime.
   *
   * @param cb - The callback to call for each found record
   * @param __namedParameters - Options for batch processing
   * @param __namedParameters.batchSize - The batch size you wish to collect records in. If not provided, it will default to 1000
   * @returns void
   * @throws BatchingIncompatibleWithLimitOrOffset if the query carries a `limit` or `offset`
   */
  public async findEach(
    this: Query<DreamInstance, QueryTypeOpts>,
    cb: (instance: DreamInstance) => void | Promise<void>,
    { batchSize = Query.BATCH_SIZES.FIND_EACH }: { batchSize?: number } = {}
  ): Promise<void> {
    if (this.joinLoadActivated) throw new LeftJoinPreloadIncompatibleWithFindEach()
    // a limit or offset cannot compose with the batch windows: the window
    // queries would re-apply it per batch — the limit silently replaced by
    // batchSize, the offset skipping rows inside every window
    if (this.limitStatement || this.offsetStatement) throw new BatchingIncompatibleWithLimitOrOffset()
    let records: any[]
    const query = this.order(null)
      .order(this.namespacedPrimaryKey as any)
      .limit(batchSize as any)
    // the cursor is compared against a sentinel rather than tested for
    // truthiness, since a primary key of 0 is a legitimate cursor value that
    // would otherwise reset the window to the start of the set
    let lastId: any = undefined

    do {
      if (lastId === undefined) records = await query.all()
      else
        records = await query
          .where({ [this.dreamInstance['_primaryKey']]: ops.greaterThan(lastId) } as any)
          .all()

      for (const record of records) {
        await cb(record)
      }

      lastId = records.at(-1)?.primaryKeyValue?.()
    } while (records.length > 0 && records.length === batchSize)
  }

  /**
   * Load each specified association using a single SQL query.
   * See {@link Query.preload} for preloading in separate queries.
   *
   * Note: since leftJoinPreload loads via single query, it has
   * some downsides and that may be avoided using {@link Query.preload}:
   * 1. `limit` and `offset` will be automatically removed
   * 2. `through` associations will bring additional namespaces into the query that can conflict with through associations from other associations, creating an invalid query
   * 3. each nested association will result in an additional record which duplicates data from the outer record. E.g., given `.leftJoinPreload('a', 'b', 'c')`, if each `a` has 10 `b` and each `b` has 10 `c`, then for one `a`, 100 records will be returned, each of which has all of the columns of `a`. `.preload('a', 'b', 'c')` would perform three separate SQL queries, but the data for a single `a` would only be returned once.
   * 4. the individual query becomes more complex the more associations are included
   * 5. associations loading associations loading associations could result in exponential amounts of data; in those cases, `.preload(...).findEach(...)` avoids instantiating massive amounts of data at once
   * 6. unlike base-model reads, `preload`/`load`, and saves — which tolerate
   * schema/image skew (e.g. a rolling deploy dropping a column while
   * containers compiled against the previous schema are still draining) —
   * leftJoinPreload must enumerate every compiled column of every joined
   * model under per-alias names (per-alias `*` is not expressible in a
   * single flat row), so an **unplanned** column drop breaks
   * leftJoinPreload queries for the duration of the rollout window. A
   * **planned** drop is safe when performed via the two-deploy process
   * documented on the `ignoredColumns` getter of Dream: declaring the
   * column ignored removes it from the generated schema, so leftJoinPreload
   * stops naming it a full deploy before the column is actually dropped.
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
    const LastArg extends VariadicLeftJoinLoadArgs<DreamInstance, DB, Schema, TableName, Arr>,
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
   * See {@link Query.leftJoinPreload} for preloading in a single query.
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
      : [...Arr, VariadicLoadArgs<DreamInstance, DB, Schema, TableName, Arr>]
  ): RetQuery {
    const preloadStatements = cloneDeepSafe(this.preloadStatements)

    const preloadOnStatements: RelaxedPreloadOnStatement<DreamInstance, DB, Schema> = cloneDeepSafe(
      this.preloadOnStatements
    )

    this.fleshOutJoinStatements([], preloadStatements, preloadOnStatements, null, [...(args as any)])
    return this.clone({ preloadStatements, preloadOnStatements: preloadOnStatements }) as unknown as RetQuery
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
   * await User.preloadFor('detailed', (associationName, dreamClass) => {
   *   if (dreamClass.typeof(Post) && associationName === 'comments') {
   *     return { and: { published: true } }
   *   }
   * })
   *   .all()
   *
   * // Skip preloading specific associations to handle them manually:
   * await User.preloadFor('summary', (associationName, dreamClass) => {
   *   if (dreamClass.typeof(User) && associationName === 'posts') {
   *     return 'omit' // Handle posts preloading separately with custom logic
   *   }
   * })
   *   .preload('posts', { and: { featured: true } }) // Custom preloading
   *   .all()
   * ```
   *
   * @param serializerKey - The serializer key to use for determining which associations to preload.
   * @param modifierFn - Optional callback function to modify or omit specific associations during preloading. Called for each association with the Dream class and association name. Return an object with `and`, `andAny`, or `andNot` properties to add where conditions, return 'omit' to skip preloading that association (useful when you want to handle it manually), or return undefined to use default preloading
   * @returns A Query with all serialization associations preloaded
   */
  public preloadFor<
    Q extends Query<DreamInstance, any>,
    SerializerKey extends DreamSerializerKey<DreamInstance>,
    RetQuery = Query<
      DreamInstance,
      ExtendQueryType<
        QueryTypeOpts,
        Readonly<{
          allowLeftJoinPreload: false
        }>
      >
    >,
  >(this: Q, serializerKey: SerializerKey, modifierFn?: LoadForModifierFn): RetQuery {
    const cacheKey = serializerKey ?? 'default'

    let pathsBySerializerKey = extractedNestedPathsCache.get(this.dreamClass)
    if (!pathsBySerializerKey) {
      pathsBySerializerKey = new Map()
      extractedNestedPathsCache.set(this.dreamClass, pathsBySerializerKey)
    }

    let preloadArgs = pathsBySerializerKey.get(cacheKey)
    if (!preloadArgs) {
      preloadArgs = buildSerializerPreloadPaths(this.dreamClass, serializerKey)
      pathsBySerializerKey.set(cacheKey, preloadArgs)
    }

    // Rather than calling `preload` once per path (which deep clones the accumulating preload tree
    // on every call, making this quadratic in the number of paths), clone once, flesh out every
    // path against the same accumulators, and clone the Query once at the end. Iteration order is
    // preserved, so a later path's `and` still wins over an earlier path's for a shared prefix.
    const preloadStatements = cloneDeepSafe(this.preloadStatements)
    const preloadOnStatements: RelaxedPreloadOnStatement<
      DreamInstance,
      DreamInstance['DB'],
      DreamInstance['schema']
    > = cloneDeepSafe(this.preloadOnStatements)

    preloadArgs.forEach(dreamClassAndAssociationNameTupleArray => {
      const args = convertDreamClassAndAssociationNameTupleArrayToPreloadArgs(
        dreamClassAndAssociationNameTupleArray,
        modifierFn
      )
      // `modifierFn` returning 'omit' prunes the path from the omitted association down, which can
      // leave nothing to preload; `fleshOutJoinStatements` treats an empty arg list as a no-op.
      this.fleshOutJoinStatements([], preloadStatements, preloadOnStatements, null, args as any)
    })

    return this.clone({ preloadStatements, preloadOnStatements }) as unknown as RetQuery
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
    const LastArg extends VariadicJoinsArgs<DreamInstance, DB, Schema, TableName, Arr>,
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
    const innerJoinStatements = toSafeObject(
      cloneDeepSafe(this.innerJoinStatements) as object
    ) as RelaxedJoinStatement
    const innerJoinAndStatements = toSafeObject(
      cloneDeepSafe(this.innerJoinAndStatements) as object
    ) as RelaxedJoinAndStatement<DreamInstance, DB, Schema>

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
    const LastArg extends VariadicJoinsArgs<DreamInstance, DB, Schema, TableName, Arr>,
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
    const leftJoinStatements = toSafeObject(
      cloneDeepSafe(this.leftJoinStatements) as object
    ) as RelaxedJoinStatement
    const leftJoinAndStatements = toSafeObject(
      cloneDeepSafe(this.leftJoinAndStatements) as object
    ) as RelaxedJoinAndStatement<DreamInstance, DB, Schema>

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
    joinAndStatements: RelaxedJoinAndStatement<DreamInstance, DB, Schema>,
    previousAssociationName: null | string,
    associationStatements: (string | InternalWhereStatement<DreamInstance, DB, Schema, any> | undefined)[],
    previousDreamClass: typeof Dream | null = this.dreamClass
  ) {
    const nextAssociationStatement = associationStatements.shift()

    if (nextAssociationStatement === undefined) {
      // just satisfying typing
    } else if (typeof nextAssociationStatement === 'string') {
      const nextStatement = nextAssociationStatement
      const safeKey = protectAgainstPollutingAssignment(nextStatement)

      // Use prototype-less containers so assigning untrusted keys cannot pollute Object.prototype.
      if (!joinStatements[safeKey]) joinStatements[safeKey] = Object.create(null)
      if (!joinAndStatements[safeKey]) joinAndStatements[safeKey] = Object.create(null)

      const nextDreamClass = this.addAssociatedDreamClassToInnerJoinDreamClasses(
        previousDreamClass,
        nextStatement,
        innerJoinDreamClasses
      )

      const nextJoinsStatements = joinStatements[safeKey]
      const nextJoinsOnStatements = joinAndStatements[safeKey] as RelaxedJoinAndStatement<
        DreamInstance,
        DB,
        Schema
      >

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
        joinStatements[protectAgainstPollutingAssignment(associationStatement)] = Object.create(null)
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
    const baseSelectQuery =
      this.baseSelectQuery && this.baseSelectQuery.clone({ passthroughOnStatement: passthroughOnStatement })
    return this.clone({ passthroughOnStatement: passthroughOnStatement, baseSelectQuery })
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
      DreamInstance,
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
          DreamInstance,
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
      DreamInstance,
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
    whereStatement: InternalWhereStatement<DreamInstance, any, any, any> | null,
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
   * @param arg - Either a string or an object specifying order. If a string, the order is implicitly ascending. If the orderStatement is an object, statements will be provided in the order of the keys set in the object
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
   * A limit is incompatible with `paginate` and `leftJoinPreload`, and with
   * the batched and set-write operations — `findEach`, `pluckEach`,
   * `destroy`, `reallyDestroy`, `undestroy`, and `update` — none of which can
   * honor one: the batched and set-write operations throw
   * `BatchingIncompatibleWithLimitOrOffset` on a limit-carrying Query.
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
   * An offset is incompatible with `paginate` and `leftJoinPreload`, and with
   * the batched and set-write operations — `findEach`, `pluckEach`,
   * `destroy`, `reallyDestroy`, `undestroy`, and `update` — none of which can
   * honor one: the batched and set-write operations throw
   * `BatchingIncompatibleWithLimitOrOffset` on an offset-carrying Query.
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
  >(type: QueryType): ToKyselyReturnType {
    return this.dbDriverInstance().toKysely(type)
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
   * @param dreamTransaction - A DreamTransaction instance (usually collected by calling `ApplicationModel.transaction`)
   * @returns A cloned Query with the transaction applied
   *
   */
  public txn(dreamTransaction: DreamTransaction<Dream> | null) {
    return this.clone({ transaction: dreamTransaction })
  }

  /**
   * Retrieves the number of records matching the Query
   *
   * ```ts
   * await User.query().count()
   * // 42
   *
   * await User.where({ email: ops.ilike('%gmail.com') }).count()
   * // 15
   * ```
   *
   * @returns The number of records matching the Query
   */
  public async count() {
    return await this.dbDriverInstance().count()
  }

  /**
   * Retrieves the number of records in each group, keyed by the
   * value of the provided group column (a SQL `GROUP BY`).
   *
   * ```ts
   * await User.query().countBy('name')
   * // Map(2) { 'fred' => 2, 'zed' => 1 }
   *
   * await User.where({ email: ops.ilike('%gmail.com') }).countBy('name')
   * // Map(1) { 'fred' => 3 }
   * ```
   *
   * Any `where` clauses, base scopes (soft-delete / STI), and joined-association
   * `and` clauses on the Query carry through automatically. A joined-association
   * column may be grouped on by passing its namespaced name (e.g.
   * `'compositionAssets.name'`).
   *
   * Only groups with at least one matching row appear in the Map (inherent to
   * `GROUP BY`); seed absent groups yourself with `map.get(key) ?? 0`. When the
   * group column is nullable, records with a `null` value are grouped under a real
   * `null` key.
   *
   * ```ts
   * await Composition.query().innerJoin('compositionAssets').countBy('compositionAssets.name')
   * // Map(2) { 'primary' => 3, null => 1 }
   * ```
   *
   * @param groupColumn - the column to group by (base or joined-association-namespaced)
   * @returns A Map from each present group value to the number of records in that group
   */
  public async countBy<
    Q extends Query<DreamInstance, QueryTypeOpts>,
    DB extends DreamInstance['DB'],
    GroupColumnName extends ColumnNamesAccountingForJoinedAssociations<
      Q['queryTypeOpts']['joinedAssociations'],
      DB,
      QueryTypeOpts['rootTableName'],
      QueryTypeOpts['rootTableAlias']
    >,
    GroupKey extends NamespacedOrBaseModelColumnTypes<[GroupColumnName], Q, DreamInstance>[0],
  >(groupColumn: GroupColumnName): Promise<Map<GroupKey, number>> {
    return await this.dbDriverInstance().countBy(groupColumn)
  }

  /**
   * Returns new Query with distinct clause applied.
   * If no column is specified, applies distinct to the primary key.
   * Pass true to apply distinct to primary key, false to disable distinct.
   *
   * ```ts
   * await User.query().distinct('name').pluck('name')
   * // Returns unique names
   *
   * await User.query().distinct(true).pluck('id')
   * // Returns unique primary keys
   *
   * await User.query().distinct(false).pluck('name')
   * // Disables distinct, returns all names including duplicates
   * ```
   *
   * @param column - The column name to apply distinct to, `true` to enable distinct on primary key, or `false` to disable a previously applied distinct call
   * @returns A cloned Query with the distinct clause applied
   */
  public distinct(column: TableColumnNames<DreamInstance['DB'], DreamInstance['table']> | boolean = true) {
    if (column === true) {
      return this.clone({
        distinctColumn: this.namespaceColumn(
          this.dreamInstance['_primaryKey']
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
   * Retrieves the max value of the specified column within each group, keyed by
   * the value of the provided group column (a SQL `GROUP BY`).
   *
   * ```ts
   * await CompositionAsset.query().maxBy('name', 'score')
   * // Map(2) { 'primary' => 9, 'secondary' => 4 }
   * ```
   *
   * Any `where` clauses, base scopes (soft-delete / STI), and joined-association
   * `and` clauses on the Query carry through automatically. A joined-association
   * column may be grouped on or aggregated by passing its namespaced name (e.g.
   * `'compositionAssets.name'`).
   *
   * Only groups with at least one matching row appear in the Map (inherent to
   * `GROUP BY`). When the group column is nullable, records with a `null` value
   * are grouped under a real `null` key; a group whose aggregated values are all
   * `null` yields a `null` value.
   *
   * @param groupColumn - the column to group by (base or joined-association-namespaced)
   * @param aggregatedColumn - the column to take the max of within each group
   * @returns A Map from each present group value to the max of the aggregated column in that group
   */
  public async maxBy<
    Q extends Query<DreamInstance, QueryTypeOpts>,
    DB extends DreamInstance['DB'],
    GroupColumnName extends ColumnNamesAccountingForJoinedAssociations<
      Q['queryTypeOpts']['joinedAssociations'],
      DB,
      QueryTypeOpts['rootTableName'],
      QueryTypeOpts['rootTableAlias']
    >,
    AggregatedColumnName extends ColumnNamesAccountingForJoinedAssociations<
      Q['queryTypeOpts']['joinedAssociations'],
      DB,
      QueryTypeOpts['rootTableName'],
      QueryTypeOpts['rootTableAlias']
    >,
    GroupKey extends NamespacedOrBaseModelColumnTypes<[GroupColumnName], Q, DreamInstance>[0],
    AggregatedType extends NamespacedOrBaseModelColumnTypes<[AggregatedColumnName], Q, DreamInstance>[0],
  >(
    groupColumn: GroupColumnName,
    aggregatedColumn: AggregatedColumnName
  ): Promise<Map<GroupKey, AggregatedType>> {
    return await this.dbDriverInstance().maxBy(groupColumn, aggregatedColumn)
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
   * Retrieves the min value of the specified column within each group, keyed by
   * the value of the provided group column (a SQL `GROUP BY`).
   *
   * ```ts
   * await CompositionAsset.query().minBy('name', 'score')
   * // Map(2) { 'primary' => 1, 'secondary' => 4 }
   * ```
   *
   * Any `where` clauses, base scopes (soft-delete / STI), and joined-association
   * `and` clauses on the Query carry through automatically. A joined-association
   * column may be grouped on or aggregated by passing its namespaced name (e.g.
   * `'compositionAssets.name'`).
   *
   * Only groups with at least one matching row appear in the Map (inherent to
   * `GROUP BY`). When the group column is nullable, records with a `null` value
   * are grouped under a real `null` key; a group whose aggregated values are all
   * `null` yields a `null` value.
   *
   * @param groupColumn - the column to group by (base or joined-association-namespaced)
   * @param aggregatedColumn - the column to take the min of within each group
   * @returns A Map from each present group value to the min of the aggregated column in that group
   */
  public async minBy<
    Q extends Query<DreamInstance, QueryTypeOpts>,
    DB extends DreamInstance['DB'],
    GroupColumnName extends ColumnNamesAccountingForJoinedAssociations<
      Q['queryTypeOpts']['joinedAssociations'],
      DB,
      QueryTypeOpts['rootTableName'],
      QueryTypeOpts['rootTableAlias']
    >,
    AggregatedColumnName extends ColumnNamesAccountingForJoinedAssociations<
      Q['queryTypeOpts']['joinedAssociations'],
      DB,
      QueryTypeOpts['rootTableName'],
      QueryTypeOpts['rootTableAlias']
    >,
    GroupKey extends NamespacedOrBaseModelColumnTypes<[GroupColumnName], Q, DreamInstance>[0],
    AggregatedType extends NamespacedOrBaseModelColumnTypes<[AggregatedColumnName], Q, DreamInstance>[0],
  >(
    groupColumn: GroupColumnName,
    aggregatedColumn: AggregatedColumnName
  ): Promise<Map<GroupKey, AggregatedType>> {
    return await this.dbDriverInstance().minBy(groupColumn, aggregatedColumn)
  }

  /**
   * Retrieves the sum value of the specified column
   * for this Query
   *
   * ```ts
   * await Game.query().sum('score')
   * // 1
   * ```
   *
   * @param columnName - a column name on the model
   * @returns the sum of the values of the specified column for this Query
   */
  public async sum<
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
    return await this.dbDriverInstance().sum(columnName)
  }

  /**
   * Retrieves the sum of the specified column within each group, keyed by
   * the value of the provided group column (a SQL `GROUP BY`).
   *
   * ```ts
   * await CompositionAsset.query().sumBy('name', 'score')
   * // Map(2) { 'primary' => 10, 'secondary' => 4 }
   * ```
   *
   * Any `where` clauses, base scopes (soft-delete / STI), and joined-association
   * `and` clauses on the Query carry through automatically. A joined-association
   * column may be grouped on or aggregated by passing its namespaced name (e.g.
   * `'compositionAssets.name'`).
   *
   * Only groups with at least one matching row appear in the Map (inherent to
   * `GROUP BY`). When the group column is nullable, records with a `null` value
   * are grouped under a real `null` key; a group whose aggregated values are all
   * `null` yields a `null` value.
   *
   * @param groupColumn - the column to group by (base or joined-association-namespaced)
   * @param aggregatedColumn - the column to sum within each group
   * @returns A Map from each present group value to the sum of the aggregated column in that group
   */
  public async sumBy<
    Q extends Query<DreamInstance, QueryTypeOpts>,
    DB extends DreamInstance['DB'],
    GroupColumnName extends ColumnNamesAccountingForJoinedAssociations<
      Q['queryTypeOpts']['joinedAssociations'],
      DB,
      QueryTypeOpts['rootTableName'],
      QueryTypeOpts['rootTableAlias']
    >,
    AggregatedColumnName extends ColumnNamesAccountingForJoinedAssociations<
      Q['queryTypeOpts']['joinedAssociations'],
      DB,
      QueryTypeOpts['rootTableName'],
      QueryTypeOpts['rootTableAlias']
    >,
    GroupKey extends NamespacedOrBaseModelColumnTypes<[GroupColumnName], Q, DreamInstance>[0],
    AggregatedType extends NamespacedOrBaseModelColumnTypes<[AggregatedColumnName], Q, DreamInstance>[0],
  >(
    groupColumn: GroupColumnName,
    aggregatedColumn: AggregatedColumnName
  ): Promise<Map<GroupKey, AggregatedType>> {
    return await this.dbDriverInstance().sumBy(groupColumn, aggregatedColumn)
  }

  /**
   * Retrieves the average value of the specified column
   * for this Query
   *
   * ```ts
   * await Game.query().avg('score')
   * // 1
   * ```
   *
   * @param columnName - a column name on the model
   * @returns the average of the values of the specified column for this Query
   */
  public async avg<
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
    return await this.dbDriverInstance().avg(columnName)
  }

  /**
   * Retrieves the average of the specified column within each group, keyed by
   * the value of the provided group column (a SQL `GROUP BY`).
   *
   * ```ts
   * await CompositionAsset.query().avgBy('name', 'score')
   * // Map(2) { 'primary' => 5, 'secondary' => 4 }
   * ```
   *
   * Any `where` clauses, base scopes (soft-delete / STI), and joined-association
   * `and` clauses on the Query carry through automatically. A joined-association
   * column may be grouped on or aggregated by passing its namespaced name (e.g.
   * `'compositionAssets.name'`).
   *
   * Only groups with at least one matching row appear in the Map (inherent to
   * `GROUP BY`). When the group column is nullable, records with a `null` value
   * are grouped under a real `null` key; a group whose aggregated values are all
   * `null` yields a `null` value.
   *
   * @param groupColumn - the column to group by (base or joined-association-namespaced)
   * @param aggregatedColumn - the column to average within each group
   * @returns A Map from each present group value to the average of the aggregated column in that group
   */
  public async avgBy<
    Q extends Query<DreamInstance, QueryTypeOpts>,
    DB extends DreamInstance['DB'],
    GroupColumnName extends ColumnNamesAccountingForJoinedAssociations<
      Q['queryTypeOpts']['joinedAssociations'],
      DB,
      QueryTypeOpts['rootTableName'],
      QueryTypeOpts['rootTableAlias']
    >,
    AggregatedColumnName extends ColumnNamesAccountingForJoinedAssociations<
      Q['queryTypeOpts']['joinedAssociations'],
      DB,
      QueryTypeOpts['rootTableName'],
      QueryTypeOpts['rootTableAlias']
    >,
    GroupKey extends NamespacedOrBaseModelColumnTypes<[GroupColumnName], Q, DreamInstance>[0],
    AggregatedType extends NamespacedOrBaseModelColumnTypes<[AggregatedColumnName], Q, DreamInstance>[0],
  >(
    groupColumn: GroupColumnName,
    aggregatedColumn: AggregatedColumnName
  ): Promise<Map<GroupKey, AggregatedType>> {
    return await this.dbDriverInstance().avgBy(groupColumn, aggregatedColumn)
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
   * A `limit` or `offset` on the Query cannot compose with the batch windows
   * — each window replaces the limit with the batch size and the offset with
   * the running window offset, silently ignoring both — so a limit- or
   * offset-carrying Query throws at runtime.
   *
   * @param args - a list of column names to pluck, followed by a callback function to call for each set of found fields
   * @returns void
   * @throws BatchingIncompatibleWithLimitOrOffset if the query carries a `limit` or `offset`
   */
  public pluckEach<Q extends Query<DreamInstance, QueryTypeOpts>, const ColumnNames extends unknown[]>(
    this: Q,
    ...args: PluckEachArgs<
      ValidatedPluckEachColumnNames<
        ColumnNames,
        ColumnNamesAccountingForJoinedAssociations<
          Q['queryTypeOpts']['joinedAssociations'],
          DreamInstance['DB'],
          QueryTypeOpts['rootTableName'],
          QueryTypeOpts['rootTableAlias']
        >
      >,
      NamespacedOrBaseModelColumnTypes<
        ValidatedPluckEachColumnNames<
          ColumnNames,
          ColumnNamesAccountingForJoinedAssociations<
            Q['queryTypeOpts']['joinedAssociations'],
            DreamInstance['DB'],
            QueryTypeOpts['rootTableName'],
            QueryTypeOpts['rootTableAlias']
          >
        >,
        Q,
        DreamInstance
      >
    >
  ): Promise<void>
  public pluckEach<
    Q extends Query<DreamInstance, QueryTypeOpts>,
    const ColumnNames extends ColumnNamesAccountingForJoinedAssociations<
      Q['queryTypeOpts']['joinedAssociations'],
      DreamInstance['DB'],
      QueryTypeOpts['rootTableName'],
      QueryTypeOpts['rootTableAlias']
    >[],
  >(
    this: Q,
    ...args: PluckEachArgs<ColumnNames, NamespacedOrBaseModelColumnTypes<ColumnNames, Q, DreamInstance>>
  ): Promise<void>
  public async pluckEach(...args: unknown[]): Promise<void> {
    const providedCbIndex = args.findIndex(v => typeof v === 'function')
    const providedCb = args[providedCbIndex] as (...plucked: any[]) => void | Promise<void>
    const providedOpts = args[providedCbIndex + 1] as FindEachOpts

    if (!providedCb) throw new MissingRequiredCallbackFunctionToPluckEach('pluckEach', args)
    if (providedOpts !== undefined && !providedOpts?.batchSize)
      throw new CannotPassAdditionalFieldsToPluckEachAfterCallback('pluckEach', args)
    // a limit or offset cannot compose with the batch windows: the window
    // queries would replace the limit with batchSize and the offset with the
    // running window offset, silently ignoring both
    if (this.limitStatement || this.offsetStatement) throw new BatchingIncompatibleWithLimitOrOffset()

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
   * // [User{id: 1}, User{id: 2}, ...] (ordered by id)
   *
   * // With specific columns (always includes primary key)
   * await User.query().all({ columns: ['name'] })
   * // Users will have both 'id' and 'name' properties
   *
   * // With custom ordering
   * await User.order('email').all()
   * // [User{email: 'a@a.com'}, User{email: 'b@b.com'}, ...]
   * ```
   *
   * @param options - Query options
   * @param options.columns - Array of column names to select. The primary key is always included automatically.
   * @returns an array of dreams
   */
  public async all(
    options: {
      columns?: DreamColumnNames<DreamInstance>[]
    } = {}
  ) {
    return await this.dbDriverInstance().takeAll(options)
  }

  public static dbDriverClass<T extends Dream>(connectionName: string): typeof QueryDriverBase<T> {
    const dreamApp = DreamApp.getOrFail()
    return dreamApp.dbConnectionQueryDriverClass(connectionName)
  }

  public dbDriverInstance(query: Query<DreamInstance, any> = this): QueryDriverBase<DreamInstance> {
    const driverClass = Query.dbDriverClass<DreamInstance>(this.connectionName)
    return new driverClass(query)
  }

  public get connectionName() {
    return this.dreamInstance.connectionName || 'default'
  }

  /**
   * @internal
   *
   * Resolves the effective page size for a pagination request: applies the
   * configured default when no page size is requested, and clamps the result to
   * the configured maximum (`paginationMaxPageSize`, default 200) so that a
   * forwarded, attacker-controlled `pageSize` cannot force a full-table load.
   */
  private clampedPaginationPageSize(requestedPageSize: number | undefined): number {
    const dreamApp = DreamApp.getOrFail()
    const pageSize = Math.max(0, requestedPageSize ?? 0) || dreamApp.paginationPageSize
    return Math.min(pageSize, dreamApp.paginationMaxPageSize)
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
   * @param opts - Pagination options
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
    const options = opts as PaginatedDreamQueryOptions
    if (this.limitStatement) throw new CannotPaginateWithLimit()
    if (this.offsetStatement) throw new CannotPaginateWithOffset()
    if (this.joinLoadActivated) throw new CannotPaginateWithLeftJoinPreload()

    const page = computedPaginatePage(options.page)
    const recordCount = await this.count()
    const pageSize = this.clampedPaginationPageSize(options.pageSize)
    const pageCount = Math.ceil(recordCount / pageSize)

    const query = this.orderStatements.length
      ? this
      : this.order({ [this.namespacedPrimaryKey as any]: 'desc' } as any)

    const results = await query
      .limit(pageSize as any)
      .offset(((page - 1) * pageSize) as any)
      .all()

    return {
      recordCount,
      pageCount,
      currentPage: page,
      results,
    }
  }

  /**
   * @deprecated Use {@link cursorPaginate} instead.
   *
   * Paginates the results of your query using cursor-based pagination,
   * accepting a pageSize and cursor argument. This method
   * provides better performance for large datasets by using cursor-based
   * pagination instead of offset-based pagination.
   *
   * Default order is ascending primary key. If an order has already been
   * set on the query, and it includes the primary key (e.g.: `id: 'asc'`),
   * then the implicit primary key ordering will be omitted.
   *
   * ```ts
   * // First page (using undefined to start from beginning)
   * const firstPage = await User.order('email').scrollPaginate({ pageSize: 100, cursor: undefined })
   * firstPage.results
   * // [ { User{id: 1}, User{id: 2}, ...}]
   *
   * firstPage.cursor
   * // "100" (or null if no more pages)
   *
   * // Next page using cursor from previous result
   * const nextPage = await User.order('email').scrollPaginate({
   *   pageSize: 100,
   *   cursor: firstPage.cursor
   * })
   * ```
   *
   * @param opts - scroll pagination options
   * @param opts.pageSize - the number of results per page (optional)
   * @param opts.cursor - identifier of where to start the next page; undefined to start from the beginning; null when no more pages
   * @returns results.cursor - identifier for the next page, or null if no more pages
   * @returns results.results - An array of records for the current page
   */
  public async scrollPaginate<
    Q extends Query<DreamInstance, any>,
    Incompatible extends Q['queryTypeOpts'] extends Readonly<{ allowPaginate: false }> ? true : false,
  >(
    this: Q,
    opts: Incompatible extends true
      ? 'scrollPaginate is incompatible with limit, offset, and leftJoinPreload'[]
      : CursorPaginatedDreamQueryOptions
  ): Promise<CursorPaginatedDreamQueryResult<DreamInstance>> {
    const orderIncludesPrimaryKey = this.orderStatements.some(
      orderStatement =>
        orderStatement.column === this.dreamClass.primaryKey ||
        orderStatement.column === this.namespacedPrimaryKey
    )

    const query = orderIncludesPrimaryKey
      ? this
      : this.order({ [this.namespacedPrimaryKey as any]: 'asc' } as any)

    return await query.cursorPaginate(opts)
  }

  /**
   * Paginates the results of your query using cursor-based pagination,
   * accepting a pageSize and cursor argument. This method
   * provides better performance for large datasets by using cursor-based
   * pagination instead of offset-based pagination.
   *
   * Default order is descending primary key. If an order has already been
   * set on the query, and it includes the primary key (e.g.: `id: 'asc'`),
   * then the implicit primary key ordering will be omitted.
   *
   * ```ts
   * // First page (using undefined to start from beginning)
   * const firstPage = await User.order('email').cursorPaginate({ pageSize: 100, cursor: undefined })
   * firstPage.results
   * // [ { User{id: 777}, User{id: 776}, ...}]
   *
   * firstPage.cursor
   * // "100" (or null if no more pages)
   *
   * // Next page using cursor from previous result
   * const nextPage = await User.order('email').cursorPaginate({
   *   pageSize: 100,
   *   cursor: firstPage.cursor
   * })
   * ```
   *
   * @param opts - cursor pagination options
   * @param opts.pageSize - the number of results per page (optional)
   * @param opts.cursor - identifier of where to start the next page; undefined to start from the beginning; null when no more pages
   * @returns results.cursor - identifier for the next page, or null if no more pages
   * @returns results.results - An array of records for the current page
   */
  public async cursorPaginate<
    Q extends Query<DreamInstance, any>,
    Incompatible extends Q['queryTypeOpts'] extends Readonly<{ allowPaginate: false }> ? true : false,
  >(
    this: Q,
    opts: Incompatible extends true
      ? 'scrollPaginate is incompatible with limit, offset, and leftJoinPreload'[]
      : CursorPaginatedDreamQueryOptions
  ): Promise<CursorPaginatedDreamQueryResult<DreamInstance>> {
    const options = opts as CursorPaginatedDreamQueryOptions
    const pageSize = this.clampedPaginationPageSize(options.pageSize)
    if (options === null) return { cursor: null, results: [] }
    if (this.limitStatement) throw new CannotPaginateWithLimit()
    if (this.offsetStatement) throw new CannotPaginateWithOffset()
    if (this.joinLoadActivated) throw new CannotPaginateWithLeftJoinPreload()

    const orderIncludesPrimaryKey = this.orderStatements.some(
      orderStatement =>
        orderStatement.column === this.dreamClass.primaryKey ||
        orderStatement.column === this.namespacedPrimaryKey
    )

    let query = orderIncludesPrimaryKey
      ? this
      : this.order({ [this.namespacedPrimaryKey as any]: 'desc' } as any)

    if (options.cursor) {
      const orderStatements = query.orderStatements

      if (orderStatements.length === 1) {
        /**
         * Since we add a primary key above if it wasn't already included, we know
         * that if there is only one order statement, then it must be ordering on
         * the primary key
         */
        const orderStatement = orderStatements[0]!

        switch (orderStatement.direction) {
          case 'asc':
            query = query.where({
              [orderStatement.column]: ops.greaterThan(options.cursor),
            } as any) as typeof query
            break
          case 'desc':
            query = query.where({
              [orderStatement.column]: ops.lessThan(options.cursor),
            } as any) as typeof query
            break
        }
      } else {
        const endOfPreviousPageComparisonValues = (
          await query
            .removeDefaultScopeExceptOnAssociations(SOFT_DELETE_SCOPE_NAME as DefaultScopeName<DreamInstance>)
            .where({ [this.namespacedPrimaryKey]: options.cursor } as any)

            .limit(1)
            .order(null)
            .pluck(...orderStatements.map(orderStatement => orderStatement.column))
        )[0]

        if (endOfPreviousPageComparisonValues) {
          const whereAnyMaybeEqualArray: any[] = []

          for (let index = 0; index < endOfPreviousPageComparisonValues.length; index++) {
            /**
             * This nested loop enables us to give priority to the left-most order clause,
             * then the left-most and next left-most, etc., replicating what ordering on
             * multiple clauses does:
             *
             *  const results = await Pet.query()
             *    .leftJoin('user')
             *    // The primary key is implicitly added if not explicitly present, so these two
             *    // order clauses appear in the query with an additional primary key clause.
             *    // This supports pagination when the earlier order clauses match multiple records.
             *    .order({ 'pets.name': 'asc', 'user.id': 'asc' })
             *    .cursorPaginate({ pageSize: 2, cursor: undefined })
             *
             * Results in:
             *
             * SELECT
             * 	"pets".*
             * FROM
             * 	"pets"
             * 	LEFT JOIN "users" AS "user" ON "pets"."user_id" = "user"."id"
             * 		AND "user"."deleted_at" IS NULL
             * WHERE ("pets"."deleted_at" IS NULL
             * 	AND (
             *    "pets"."name" > $1
             * 		OR (
             *    "pets"."name" = $2 AND "user"."id" > $3
             * 		) OR (
             *    "pets"."name" = $4 AND "user"."id" = $5 AND "pets"."id" < $6
             *   )))
             * ORDER BY
             * 	"pets"."name" ASC nulls FIRST,
             * 	"user"."id" ASC nulls FIRST,
             * 	"pets"."id" DESC nulls LAST
             * LIMIT $7
             */
            const whereAnyMaybeEqual: any = {}
            whereAnyMaybeEqualArray.push(whereAnyMaybeEqual)

            for (let nestedIndex = 0; nestedIndex <= index; nestedIndex++) {
              const valueToCompare = endOfPreviousPageComparisonValues[nestedIndex]
              const orderStatement = orderStatements[nestedIndex]!

              if (nestedIndex < index) {
                whereAnyMaybeEqual[orderStatement.column] = valueToCompare
              } else if (nestedIndex === index) {
                switch (orderStatement.direction) {
                  case 'asc':
                    whereAnyMaybeEqual[orderStatement.column] = ops.greaterThan(valueToCompare)
                    break
                  case 'desc':
                    whereAnyMaybeEqual[orderStatement.column] = ops.lessThan(valueToCompare)
                    break
                }
              }
            }
          }

          query = query.whereAny(whereAnyMaybeEqualArray) as typeof query
        }
      }
    }

    const results = await query.limit(pageSize as any).all()

    return {
      cursor: (results.length === pageSize && results.at(-1)?.primaryKeyValue().toString()) || null,
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
   * Returns true if a record exists for the given Query, false otherwise.
   *
   * ```ts
   * await User.query().exists()
   * // false
   *
   * await User.create({ email: 'how@yadoin' })
   *
   * await User.query().exists()
   * // true
   *
   * await User.where({ email: 'nonexistent@example.com' }).exists()
   * // false
   * ```
   *
   * @returns boolean - true if any records match the query, false otherwise
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
   * // User{id: 1} (first by primary key)
   *
   * await User.order('email').first()
   * // User with lowest email alphabetically
   * ```
   *
   * @returns First record in the database, or null if no record exists
   */
  public async first() {
    const query = this.orderStatements.length
      ? this
      : this.order({ [this.namespacedPrimaryKey as any]: 'asc' } as any)
    const dbDriverClass = Query.dbDriverClass<DreamInstance>(this.connectionName)
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
   * await User.query().firstOrFail()
   * // User{id: 1}
   * ```
   *
   * @returns First record in the database
   * @throws RecordNotFound if no record exists
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
   * // User{id: 99} (last by primary key)
   *
   * await User.order('email').last()
   * // User with highest email alphabetically
   * ```
   *
   * @returns Last record in the database, or null if no record exists
   */
  public async last() {
    const query = this.orderStatements.length
      ? this.invertOrder()
      : this.order({ [this.namespacedPrimaryKey]: 'desc' } as any)

    const dbDriverClass = Query.dbDriverClass<DreamInstance>(this.connectionName)
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
   * @returns Last record in the database
   * @throws RecordNotFound if no record exists
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
   * ## Guarded (compare-and-set) destroy
   *
   * By default, `destroy` reads the matching records and then destroys each of
   * them, so a concurrent writer can change a record in between — the record is
   * destroyed even though it no longer matches the Query that selected it.
   * Passing `lock: true` closes that window, making `destroy` a compare-and-set
   * the way `update(..., { skipHooks: true })` already is:
   *
   * ```ts
   * const destroyed = await Order.where({ status: 'pending' }).destroy({ lock: true })
   * // 0 — someone else moved every one of them out of 'pending' first
   * ```
   *
   * With `lock: true`, records are processed in batches, and each batch runs in
   * its own transaction which first re-selects that batch's records with an
   * exclusive row lock and then destroys them before committing. Because the
   * database re-checks the Query's conditions after acquiring each row lock,
   * a record a concurrent transaction has already moved out of the Query drops
   * out of the locked read and is never destroyed. The returned count is the
   * number of records actually claimed, so a caller can detect that it lost a
   * race by comparing the count against what it expected.
   *
   * Things to know before relying on it:
   *
   * - **The guarantee is per batch, not set-wide.** A run spanning more than one
   *   batch can win a race in batch 1 and lose one in batch 2; nothing holds the
   *   whole matched set still for the duration of the run. Sharing one
   *   transaction across every batch — by threading a transaction onto the Query
   *   itself, `Order.query().txn(txn).where({ ... }).destroy({ lock: true })` —
   *   buys two things: the destroys become all-or-nothing (a rollback undoes the
   *   whole run), and the row locks taken by every batch are held until you
   *   commit. It does **not** extend the compare-and-set to the part of the set
   *   the run has not reached yet: under READ COMMITTED each statement takes a
   *   fresh snapshot, so a record moved out of the Query between batch 1 and
   *   batch 2 still drops out of batch 2's locked read. A genuinely set-wide
   *   guarantee needs REPEATABLE READ / SERIALIZABLE, or a single locking
   *   statement over the whole set.
   * - **Only a transaction carried by the Query is shared.** Merely wrapping the
   *   call in `Model.transaction(...)` does not thread that transaction onto the
   *   Query — `Dream.transaction` establishes no ambient transaction, it only
   *   hands a `txn` to your callback — so each batch would open its own
   *   transaction on a different pooled connection. Worse, if the surrounding
   *   transaction has already written to any of the matched rows, each batch's
   *   locked read blocks on locks the surrounding transaction holds while that
   *   transaction awaits the destroy: a cycle across two connections, which
   *   Postgres's deadlock detector cannot see, so it hangs rather than aborting.
   *   Always pass the transaction with `.txn(txn)`.
   * - **Behavior above READ COMMITTED differs.** The drop-out-of-the-result
   *   behavior described above is READ COMMITTED (Postgres's default). Under
   *   REPEATABLE READ or SERIALIZABLE, the same race raises a serialization
   *   failure instead of silently returning a lower count. Both are safe; only
   *   one of them is quiet.
   * - **`batchSize` defaults to 10 here**, not `findEach`'s 1000, and the
   *   default is deliberately small. Every row in a batch stays locked for the
   *   whole batch, including the time spent running each record's hooks and
   *   `dependent: 'destroy'` cascade, so an oversized batch blocks unrelated
   *   writers touching those rows and surfaces as timeouts somewhere else in the
   *   application, which is very hard to trace back to this destroy. Too small a
   *   batch, by contrast, only slows down this call, which you can see and fix.
   *   Lower it further for models with deep `dependent: 'destroy'` cascades or
   *   expensive destroy hooks.
   * - **A batch waits, without bound, for whoever holds the row.** The locked
   *   read is a plain `FOR UPDATE`: if another transaction already holds a lock
   *   on one of the batch's rows, this call blocks until that transaction ends,
   *   holding its own transaction and its pooled connection open the whole
   *   time. Dream sets no `lock_timeout` or `statement_timeout` on a row-lock
   *   wait — the one it does set, around a sortable model's scope-lock
   *   acquisition, is restored before the rows are claimed — so a long-running
   *   writer on the other side stalls the run indefinitely and, at scale, ties
   *   up connections. If that is a risk in your application, set a
   *   `lock_timeout` on the connection so a stuck batch fails instead of
   *   hanging.
   * - **A `limit` or `offset` on the Query is incompatible with `destroy` on
   *   every path.** The batches — locked and unlocked alike — re-apply the
   *   Query's conditions to each window, where a limit or offset would skip
   *   or truncate rows inside every window instead of bounding the run as a
   *   whole, so `destroy` throws rather than silently corrupting the
   *   windows.
   * - **If you are destroying a large set and do not need compare-and-set, do
   *   not pass `lock`.** Plain `destroy()` (hooks and cascade, no locking) or
   *   {@link Query.delete | delete} (a single statement, no hooks or cascade)
   *   are the right tools for bulk removal.
   *
   * @param options - Options for destroying the instance
   * @param options.skipHooks - If true, skips applying model hooks during the destroy operation. Defaults to false
   * @param options.cascade - If false, skips destroying associations marked `dependent: 'destroy'`. Defaults to true
   * @param options.lock - If true, each batch is re-selected with an exclusive row lock inside its own transaction before being destroyed, making the destroy a compare-and-set. Defaults to false
   * @param options.batchSize - The number of records to process per batch. Must be a positive integer. Defaults to 10 when `lock` is true, and to 1000 otherwise
   * @param options.bypassAllDefaultScopes - If true, bypasses all default scopes when cascade destroying. Defaults to false
   * @param options.defaultScopesToBypass - An array of default scope names to bypass when cascade destroying. Defaults to an empty array
   * @returns The number of records that were removed
   * @throws InvalidBatchSize if `batchSize` is not a positive integer
   * @throws BatchingIncompatibleWithLimitOrOffset if the query carries a `limit` or `offset`
   */
  public async destroy({
    skipHooks,
    cascade,
    lock,
    batchSize,
  }: {
    skipHooks?: boolean | undefined
    cascade?: boolean | undefined
    lock?: boolean | undefined
    batchSize?: number | undefined
  } = {}): Promise<number> {
    let counter = 0

    // resolve the default before validating: `??` would let an explicit 0
    // through, and `limit(0)` means "no limit", which would turn a batched
    // destroy into a single unbounded pass (and, with `lock`, a lock over the
    // entire matched set)
    const resolvedBatchSize =
      batchSize ?? (lock ? Query.BATCH_SIZES.LOCKED_DESTROY : Query.BATCH_SIZES.FIND_EACH)
    if (!Number.isInteger(resolvedBatchSize) || resolvedBatchSize < 1) throw new InvalidBatchSize(batchSize)

    const options = {
      bypassAllDefaultScopes: this.bypassAllDefaultScopes,
      defaultScopesToBypass: this.defaultScopesToBypass,
      skipHooks,
      cascade,
    }

    if (lock) {
      return await this.lockedDestroy(options, resolvedBatchSize)
    }

    await this.findEach(
      async result => {
        const subquery = this.dreamTransaction
          ? (result.txn(this.dreamTransaction) as unknown as DreamInstance)
          : result

        if (this.shouldReallyDestroy) {
          await subquery.reallyDestroy(options)
        } else {
          await subquery.destroy(options)
        }
        counter++
      },
      {
        batchSize: resolvedBatchSize,
      }
    )

    return counter
  }

  /**
   * @internal
   *
   * The compare-and-set implementation behind `destroy({ lock: true })`,
   * driven by {@link Query.lockedBatches}, which owns the keyset cursor, the
   * pluck/claim two-step, and the transaction dispatch.
   *
   * Each claimed record is destroyed via the ordinary per-instance path, and
   * every claimed record counts. (One thing the count does not account for,
   * because it never has: a `beforeDestroy` hook that sets `_preventDeletion`
   * leaves the record in place but still counts.)
   */
  private async lockedDestroy(options: DestroyOptions<DreamInstance>, batchSize: number): Promise<number> {
    if (this.joinLoadActivated) throw new LeftJoinPreloadIncompatibleWithFindEach()

    return await this.lockedBatches(batchSize, async (claimed, txn) => {
      for (const record of claimed) {
        const inTransaction = record.txn(txn) as unknown as DreamInstance

        if (this.shouldReallyDestroy) {
          await inTransaction.reallyDestroy(options)
        } else {
          await inTransaction.destroy(options)
        }
      }

      return claimed.length
    })
  }

  /**
   * @internal
   *
   * The shared batch driver behind `destroy({ lock: true })` and
   * `update(..., { lock: true })`: the keyset cursor, the pluck/claim
   * two-step, and the transaction dispatch live here, so the locked
   * operations cannot drift apart.
   *
   * Each batch is handled in two steps inside one transaction:
   *
   * 1. an unlocked pluck of the next `batchSize` primary keys, in ascending
   *    primary key order, which establishes the batch's window (its keyset
   *    cursor) and tells us how many records were *attempted*. Only the keys
   *    are read: hydrating and preloading these records would duplicate the
   *    work step 2 does over the same rows; then
   * 2. a locked re-read restricted to exactly those primary keys, which
   *    re-applies every condition on the Query while acquiring an exclusive
   *    row lock on each row it returns. Records a concurrent transaction has
   *    moved out of the Query since step 1 do not come back, and are the
   *    records this run lost the race for.
   *
   * The claimed records are handed to `perBatch` inside the batch's
   * transaction; its return value — how many of the claimed records were
   * processed — accumulates into the returned count.
   *
   * The two-step shape is what keeps iteration correct. If the locked read
   * both claimed rows and advanced the cursor, a batch whose records all lost
   * the race would come back empty and end the run early, silently skipping
   * every record after it. Advancing the cursor from step 1 instead means
   * losing a race skips only the records that were lost.
   *
   * When the Query already carries a transaction, that transaction is used for
   * every batch rather than opening one per batch, so the caller's transaction
   * boundary wins and the locks are held until the caller commits.
   *
   * On a sortable model, the advisory scope keys this batch needs are acquired
   * before the claim (see `acquireStabilizedSortableBatchLocks`), which removes
   * the row-lock/advisory-lock inversion for the rows the batch itself claims.
   * Two things stay outside that guarantee and are fallbacks rather than
   * guarantees, with Postgres's `40P01` as the residual failure in both:
   *
   * - the ordering is **per batch**. A multi-batch run inside a caller-owned
   *   transaction keeps batch N-1's row locks while batch N preflights. The
   *   same shape accumulates *advisory* locks: they are released only when the
   *   transaction ends, so every batch's scope keys are still held when the
   *   next one preflights. That accumulation is bounded — the preflight counts
   *   the keys the transaction already holds along with the ones the batch
   *   would add, and refuses with `SortableBatchRequiresTooManyScopeLocks`
   *   rather than letting a long run over a high-cardinality sort scope exhaust
   *   `max_locks_per_transaction` for the whole cluster — so a run long enough
   *   raises instead of completing. Letting Dream open a transaction per batch
   *   releases the keys as it goes and gives each batch the whole budget.
   * - the preflight covers **the claimed rows' own scopes only**. A
   *   `dependent: 'destroy'` cascade under `destroy({ lock: true })` destroys
   *   child records of other tables, and a sortable child takes its own table's
   *   advisory key inside `perBatch` — after this transaction is already
   *   holding the root rows' row locks. Walking
   *   `dependentDestroyAssociationNames()` to fold those keys into the sorted
   *   pass is deliberately not done: the cascade's shape is only knowable per
   *   record, and the deadlock it leaves is detected and retryable. The keys
   *   the preflight *did* take are held across the whole batch, cascade
   *   included — a per-record destroy holds its scope lock across one delete
   *   and one compaction, while here the hold spans batch size × cascade depth.
   *   A smaller `batchSize` shortens it (the default is 10).
   */
  private async lockedBatches(
    batchSize: number,
    perBatch: (claimed: DreamInstance[], txn: DreamTransaction<Dream>) => Promise<number>,
    sortableIncomingAttributes?: Record<string, unknown>
  ): Promise<number> {
    // the driver seam refuses this combination too, but catching it here means
    // failing before any transaction is opened or any row is touched
    if (this.distinctColumn) throw new RowLockIncompatibleWithDistinct()
    // a limit or offset cannot compose with the batch windows: the window
    // queries would re-apply it per batch — the offset skipping rows in the
    // candidate pluck and discarding already-claimed rows from the locked
    // re-read, the limit silently replaced by batchSize
    if (this.limitStatement || this.offsetStatement) throw new BatchingIncompatibleWithLimitOrOffset()

    const primaryKey = this.dreamInstance['_primaryKey']
    const orderedQuery = this.order(null)
      .order(this.namespacedPrimaryKey as any)
      .limit(batchSize as any)

    let counter = 0
    // the cursor is compared against a sentinel rather than tested for
    // truthiness, since a primary key of 0 is a legitimate cursor value that
    // would otherwise reset the window to the start of the set
    let lastId: any = undefined
    let attemptedCount = 0

    do {
      const batchQuery =
        lastId === undefined
          ? orderedQuery
          : orderedQuery.where({ [primaryKey]: ops.greaterThan(lastId) } as any)

      const processBatch = async (txn: DreamTransaction<Dream>) => {
        const candidateIds: any[] = await batchQuery.txn(txn).pluck(this.namespacedPrimaryKey as any)
        if (!candidateIds.length) return { attempted: 0, processed: 0, lastId }

        // On a sortable model, every advisory scope lock this batch will need is
        // taken here, sorted, before a single row is claimed. Claiming first and
        // locking per record inside `perBatch` is the lock-order inversion that
        // deadlocks against an ordinary concurrent writer of the same scope,
        // which holds the advisory lock while waiting for the row.
        //
        // The ordering this establishes is per batch. A multi-batch run inside a
        // caller-owned transaction keeps batch N-1's row locks while batch N
        // preflights, and is a documented fallback rather than a guarantee.
        await acquireStabilizedSortableBatchLocks(
          this.dreamInstance,
          txn,
          candidateIds,
          sortableIncomingAttributes
        )

        const claimed = await this.dbDriverInstance(
          batchQuery.txn(txn).where({ [primaryKey]: candidateIds } as any)
        ).takeAll({ lock: true })

        const processed = await perBatch(claimed, txn)

        // The preflight stashed the rows it read so this batch's per-record
        // sortable work could consume them instead of re-reading each one. They
        // describe this batch's candidates as they were before it ran, so they
        // are worth nothing to whatever the enclosing transaction does next —
        // and a caller-owned transaction outlives the batch.
        invalidateSortableRowCache(txn)

        return {
          attempted: candidateIds.length,
          processed,
          lastId: candidateIds.at(-1),
        }
      }

      const results = this.dreamTransaction
        ? await processBatch(this.dreamTransaction)
        : await this.dreamClass.transaction(async txn => await processBatch(txn))

      counter += results.processed
      attemptedCount = results.attempted
      lastId = results.lastId
    } while (attemptedCount > 0 && attemptedCount === batchSize)

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
   * decorator, use {@link Query.destroy} instead.
   *
   * ```ts
   * await User.where({ email: ops.ilike('%burpcollaborator%') }).reallyDestroy()
   * // 12
   * ```
   *
   * A `limit` or `offset` on the Query is incompatible with `reallyDestroy`,
   * exactly as it is with {@link Query.destroy}: a limit- or offset-carrying
   * Query throws at runtime.
   *
   * @param options - Options for destroying the instance
   * @param options.skipHooks - If true, skips applying model hooks during the destroy operation. Defaults to false
   * @param options.cascade - If false, skips destroying associations marked `dependent: 'destroy'`. Defaults to true
   * @param options.lock - If true, each batch is re-selected with an exclusive row lock inside its own transaction before being destroyed, making the destroy a compare-and-set. See {@link Query.destroy} for the full semantics. Defaults to false
   * @param options.batchSize - The number of records to process per batch. Must be a positive integer. Defaults to 10 when `lock` is true, and to 1000 otherwise
   * @param options.bypassAllDefaultScopes - If true, bypasses all default scopes when cascade destroying. Defaults to false
   * @param options.defaultScopesToBypass - An array of default scope names to bypass when cascade destroying. Defaults to an empty array
   * @returns The number of records that were removed
   * @throws InvalidBatchSize if `batchSize` is not a positive integer
   * @throws BatchingIncompatibleWithLimitOrOffset if the query carries a `limit` or `offset`
   */
  public async reallyDestroy({
    skipHooks,
    cascade,
    lock,
    batchSize,
  }: { skipHooks?: boolean; cascade?: boolean; lock?: boolean; batchSize?: number } = {}): Promise<number> {
    return await this.clone({ shouldReallyDestroy: true }).destroy({ skipHooks, cascade, lock, batchSize })
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
   * A `limit` or `offset` on the Query cannot compose with the batch windows
   * `undestroy` iterates in — each batch re-applies the Query's conditions,
   * so the limit would be silently replaced by the batch size and the offset
   * re-applied to every window — so a limit- or offset-carrying Query throws
   * at runtime.
   *
   * @param options - Options for undestroying the instance
   * @param options.skipHooks - If true, skips applying model hooks during the undestroy operation. Defaults to false
   * @param options.cascade - If false, skips undestroying associations marked `dependent: 'destroy'`. Defaults to true
   * @param options.bypassAllDefaultScopes - If true, bypasses all default scopes when cascade undestroying. Defaults to false
   * @param options.defaultScopesToBypass - An array of default scope names to bypass when cascade undestroying (soft delete is always bypassed). Defaults to an empty array
   * @returns The number of records that were removed
   * @throws BatchingIncompatibleWithLimitOrOffset if the query carries a `limit` or `offset`
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
   * use {@link Query.destroy} instead.
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
   * await User.where({ email: ops.ilike('%burpcollaborator%') }).update({ email: null })
   * // 12
   * ```
   *
   * Instead of an attributes object, the first argument may be a callback
   * that derives each record's attributes from the record itself. The
   * callback (sync or async) receives each matching record and returns the
   * attributes to write for it, or `undefined` to skip it — a skipped record
   * gets no write, runs no hooks, and is not counted (a `null` return, from
   * untyped callers, is treated the same). Only the returned attributes are
   * written: the callback receives a clone of the record, so mutations made
   * directly on the received record are discarded rather than riding along
   * with the write. With a callback, the options object and its `lock` key
   * are mandatory, and `lock` is a full boolean, so every call site says out
   * loud whether the callback runs under row locks:
   *
   * ```ts
   * await User.query().update(
   *   user => (user.email.endsWith('@example.com') ? { name: 'example user' } : undefined),
   *   { lock: false }
   * )
   * ```
   *
   * Under `lock: false`, the callback runs once per matching record —
   * batched reads (`batchSize` defaults to 1000 here), no locks, no claim
   * step, no compare-and-set guarantee — the right shape for a derived
   * backfill where racing writers are not a concern. (On a `@ReplicaSafe`
   * model, these unlocked batch reads may come from a lagging replica,
   * feeding stale column values into the callback; use `lock: true` to
   * derive from the freshest committed state — its transactional reads pin
   * the primary.) Under `lock: true`, the callback runs once per claimed
   * record, under that record's row lock, inside the batch's transaction,
   * receiving a clone of the freshly locked read; Dream applies the returned
   * attributes to the record it holds and writes before the batch commits,
   * so there is no transaction handle for the caller to forget. (The record
   * the callback receives is not bound to the batch's transaction — see the
   * callback bullet below before touching the database from inside a
   * callback.) That makes the callback form the tool
   * for serializing writers on state a `WHERE` clause cannot express — for
   * example an `@Encrypted` column, whose ciphertext changes on every write
   * and whose plaintext has no column to compare against in the database:
   *
   * ```ts
   * const rotated = await User.where({ id: userId }).update(
   *   user => (user.secret === expectedSecret ? { secret: newSecret } : undefined),
   *   { lock: true }
   * )
   * // 1 — or 0, if a competing writer got there first (the callback saw a
   * // different secret and skipped the record)
   * ```
   *
   * With a callback, the returned count is the number of records the
   * callback returned attributes for: skipped records are not counted, and
   * under `lock: true` records that lost the race never reach the callback
   * at all. (As with the attributes form, a write that turns out to be a
   * no-op still counts — the count means "the callback chose to write", not
   * "SQL was emitted".)
   *
   * The `lock` option turns the update into a guarded (compare-and-set)
   * update: each record is written only if it still matches the Query at the
   * moment an exclusive row lock on it is acquired. Use it when the Query's
   * conditions are the thing being changed and a concurrent writer racing this
   * call must not have its write clobbered:
   *
   * ```ts
   * const updated = await Order.where({ status: 'pending' })
   *   .update({ status: 'processing' }, { lock: true })
   * // 0 — someone else moved every one of them out of 'pending' first
   * ```
   *
   * With `lock: true`, records are processed in batches, and each batch runs
   * in its own transaction which first re-selects that batch's records with an
   * exclusive row lock and then updates them before committing. Because the
   * database re-checks the Query's conditions after acquiring each row lock, a
   * record a concurrent transaction has already moved out of the Query drops
   * out of the locked read and is never updated. The returned count is the
   * number of records claimed and submitted for writing, so a caller can
   * detect that it lost a race by comparing the count against what it
   * expected. (A claimed record whose write turns out to be a no-op — the
   * attributes already match, or a hook cleared every dirty attribute — still
   * counts; the count is not a guarantee that SQL was emitted per counted
   * record.)
   *
   * Things to know before relying on it:
   *
   * - **The guarantee is per batch, not set-wide.** A run spanning more than
   *   one batch can win a race in batch 1 and lose one in batch 2; nothing
   *   holds the whole matched set still for the duration of the run. Sharing
   *   one transaction across every batch — by threading a transaction onto the
   *   Query itself, `Order.query().txn(txn).where({ ... }).update({ ... },
   *   { lock: true })` — buys two things: the updates become all-or-nothing (a
   *   rollback undoes the whole run), and the row locks taken by every batch
   *   are held until you commit. It does **not** extend the compare-and-set to
   *   the part of the set the run has not reached yet: under READ COMMITTED
   *   each statement takes a fresh snapshot, so a record moved out of the
   *   Query between batch 1 and batch 2 still drops out of batch 2's locked
   *   read. A genuinely set-wide guarantee needs REPEATABLE READ /
   *   SERIALIZABLE, or a single locking statement over the whole set.
   * - **Only a transaction carried by the Query is shared.** Merely wrapping
   *   the call in `Model.transaction(...)` does not thread that transaction
   *   onto the Query — `Dream.transaction` establishes no ambient transaction,
   *   it only hands a `txn` to your callback — so each batch would open its
   *   own transaction on a different pooled connection. Worse, if the
   *   surrounding transaction has already written to any of the matched rows,
   *   each batch's locked read blocks on locks the surrounding transaction
   *   holds while that transaction awaits the update: a cycle across two
   *   connections, which Postgres's deadlock detector cannot see, so it hangs
   *   rather than aborting. Always pass the transaction with `.txn(txn)`.
   * - **Behavior above READ COMMITTED differs.** The drop-out-of-the-result
   *   behavior described above is READ COMMITTED (Postgres's default). Under
   *   REPEATABLE READ or SERIALIZABLE, the same race raises a serialization
   *   failure instead of silently returning a lower count. Both are safe; only
   *   one of them is quiet.
   * - **`batchSize` defaults to 10 here**, not `findEach`'s 1000, and the
   *   default is deliberately small. Every row in a batch stays locked for the
   *   whole batch, including the time spent running each record's hooks — and,
   *   on the callback form, the time spent running the Query's `preload`
   *   queries, which are fetched inside the lock window (the attributes form
   *   strips preloads, which it never consumes) — so an oversized batch blocks
   *   unrelated writers touching those rows and surfaces as timeouts somewhere
   *   else in the application, which is very hard to trace back to this
   *   update. Too small a batch, by contrast, only slows down this call, which
   *   you can see and fix. Lower it further for models with expensive update
   *   hooks.
   * - **The callback must not write to the database.** The record handed to
   *   the callback is not bound to the batch's transaction: a write through it
   *   (e.g. `await record.update(...)`) goes out on a different pooled
   *   connection and blocks on the batch's own row locks while the batch
   *   transaction waits on the callback — a cycle across two connections that
   *   the database's deadlock detector cannot see, so with no `lock_timeout`
   *   the run hangs indefinitely and pins both connections. Reads through the
   *   record (`reload`, `associationQuery`, ...) likewise run on a separate
   *   connection and snapshot. Derive the attributes and return them; Dream
   *   performs the write inside the batch's transaction.
   * - **`lock: false` can throw mid-run when racing a deleter.** On the
   *   unlocked paths, a matched record that a concurrent transaction destroys
   *   between a batch's read and that record's write aborts the run with an
   *   error: earlier batches stay committed, and no count is returned. Use
   *   `lock: true` when deleters may race the update — claimed rows are held
   *   under their locks until written.
   * - **A `limit` or `offset` on the Query is incompatible with `update` on
   *   every path.** The batched paths re-apply the Query's conditions to each
   *   batch window, where a limit or offset would skip or truncate rows
   *   inside every window instead of bounding the run as a whole, and the
   *   single-statement `skipHooks` attributes form cannot express either in
   *   its SQL UPDATE. Every form throws rather than silently corrupting the
   *   windows or ignoring the caller's scope.
   * - **A batch waits, without bound, for whoever holds the row.** The locked
   *   read is a plain `FOR UPDATE`: if another transaction already holds a
   *   lock on one of the batch's rows, this call blocks until that transaction
   *   ends, holding its own transaction and its pooled connection open the
   *   whole time. Dream sets no `lock_timeout` or `statement_timeout` on a
   *   row-lock wait — the one it does set, around a sortable model's scope-lock
   *   acquisition, is restored before the rows are claimed — so a long-running
   *   writer on the other side stalls the run indefinitely and, at scale, ties
   *   up connections. If that is a risk in your application, set a
   *   `lock_timeout` on the connection so a stuck batch fails instead of
   *   hanging.
   * - **`skipHooks` composes with `lock`, but stays on the per-instance
   *   path.** With an attributes object and no `lock`, `skipHooks: true`
   *   issues a single `UPDATE ... WHERE` statement that writes raw columns.
   *   With `lock: true`, `skipHooks: true` skips the model hooks on each
   *   claimed record but still writes through the instance, so custom setters
   *   — including the setters encrypted attributes encrypt through — run as
   *   they would for a plain instance update. (Virtual attributes whose
   *   processing lives in a hook are still skipped, exactly as in an instance
   *   update with `skipHooks`.) A callback never takes the single-statement
   *   path: `skipHooks` beside a callback only skips the hooks on each
   *   per-record write, under `lock: true` and `lock: false` alike.
   * - **If you are updating a large set and do not need compare-and-set, do
   *   not pass `lock`.** Plain `update(attributes)` (hooks, no locking) or
   *   `update(attributes, { skipHooks: true })` (a single statement, no hooks)
   *   are the right tools for bulk updates.
   *
   * @param attributesOrCb - The attributes used to update the records, or a callback receiving each record and returning the attributes to write for it (or `undefined` to skip that record). Passing a callback makes `options` and its `lock` key mandatory
   * @param options - Options for updating the instance
   * @param options.skipHooks - If true, skips applying model hooks. Defaults to false
   * @param options.lock - If true, each batch is re-selected with an exclusive row lock inside its own transaction before being updated, making the update a compare-and-set. Defaults to false for the attributes form; with a callback there is no default — an explicit boolean is required. One typing asymmetry to know: with an attributes object, an explicit `lock: false` keeps the raw single-statement (`DreamTableSchema`) typing that `skipHooks` uses, so virtual/encrypted attributes type-check only when the options object is omitted entirely or `lock` is `true`
   * @param options.batchSize - The number of records to process per batch. Must be a positive integer. Defaults to 10 when `lock` is true, and to 1000 for the unlocked callback form
   * @returns The number of records that were updated
   * @throws InvalidBatchSize if `batchSize` is not a positive integer
   * @throws MissingRequiredLockOptionForUpdateCallback if a callback is passed without an options object carrying a boolean `lock`
   * @throws BatchingIncompatibleWithLimitOrOffset if the query carries a `limit` or `offset`
   */
  public async update(
    cb: (
      record: DreamInstance
    ) =>
      | UpdateableProperties<DreamInstance>
      | undefined
      | Promise<UpdateableProperties<DreamInstance> | undefined>,
    options: { lock: boolean; batchSize?: number; skipHooks?: boolean }
  ): Promise<number>
  public async update(
    attributes: UpdateableProperties<DreamInstance>,
    options: { lock: true; batchSize?: number; skipHooks?: boolean }
  ): Promise<number>
  public async update(
    attributes: DreamTableSchema<DreamInstance>,
    options?: { skipHooks?: boolean; lock?: false }
  ): Promise<number>
  public async update(attributes: UpdateableProperties<DreamInstance>): Promise<number>
  public async update(
    attributesOrCb:
      | UpdateableProperties<DreamInstance>
      | DreamTableSchema<DreamInstance>
      | ((
          record: DreamInstance
        ) =>
          | UpdateableProperties<DreamInstance>
          | undefined
          | Promise<UpdateableProperties<DreamInstance> | undefined>),
    { skipHooks, lock, batchSize }: { skipHooks?: boolean; lock?: boolean; batchSize?: number } = {}
  ): Promise<number> {
    if (this.baseSelectQuery) throw new NoUpdateOnAssociationQuery()
    if (Object.keys(this.innerJoinStatements).length) throw new NoUpdateAllOnJoins()
    if (Object.keys(this.leftJoinStatements).length) throw new NoUpdateAllOnJoins()

    const cb = typeof attributesOrCb === 'function' ? attributesOrCb : undefined
    // the overloads already demand an options object with a boolean `lock`
    // whenever a callback is passed; this backstops callers outside the type
    // system, so a callback can never silently take (or skip) row locks the
    // call site did not spell out
    if (cb && typeof lock !== 'boolean') throw new MissingRequiredLockOptionForUpdateCallback()

    // resolve the default before validating: `??` would let an explicit 0
    // through, and `limit(0)` means "no limit", which would turn a batched
    // update into a single unbounded pass (and, with `lock`, a lock over the
    // entire matched set)
    const resolvedBatchSize =
      batchSize ?? (lock ? Query.BATCH_SIZES.LOCKED_UPDATE : Query.BATCH_SIZES.FIND_EACH)
    if (!Number.isInteger(resolvedBatchSize) || resolvedBatchSize < 1) throw new InvalidBatchSize(batchSize)

    // a limit or offset cannot compose with any update path: the batched
    // paths (findEach and lockedBatches, which also guard) would re-apply it
    // to every batch window, silently skipping or truncating rows within each
    // window rather than bounding the run, and the single-statement skipHooks
    // path's SQL UPDATE cannot express it, so it would be silently ignored
    if (this.limitStatement || this.offsetStatement) throw new BatchingIncompatibleWithLimitOrOffset()

    if (lock) {
      // the attributes form never consumes the records it claims, so its
      // preloads would be pure wasted queries run while every row in the
      // batch is exclusively locked; the callback form keeps them, since the
      // callback may consume the preloaded associations
      const baseQuery = cb ? this : this.clone({ preloadStatements: {}, preloadOnStatements: {} })

      return await baseQuery.lockedUpdate(
        cb
          ? // the callback receives a clone of the claimed record, so that only
            // the attributes it *returns* are written: the per-instance write is
            // dirty-state-based, and mutations made directly on the record
            // Dream holds would otherwise ride along with the save
            (record: DreamInstance) => cb(record['clone']())
          : () => attributesOrCb as UpdateableProperties<DreamInstance>,
        { skipHooks },
        resolvedBatchSize,
        // only the attributes form knows what it is going to write before the
        // claim; the callback form computes it inside the batch, after the row
        // locks are taken, and is a documented preflight fallback
        cb ? undefined : (attributesOrCb as Record<string, unknown>)
      )
    }

    if (!cb && skipHooks)
      return await this.updateWithoutCallingModelHooks(attributesOrCb as DreamTableSchema<DreamInstance>)

    let counter = 0

    await this.findEach(
      async result => {
        // as on the locked path, the callback receives a clone, so only the
        // attributes it returns are written
        const attributes = cb
          ? await cb(result['clone']())
          : (attributesOrCb as UpdateableProperties<DreamInstance>)
        // null is not part of the callback's advertised contract, but it is
        // the natural untyped-JS skip idiom; treat it as a skip rather than
        // letting it crash the per-instance write mid-run
        if (attributes == null) return

        const subquery = this.dreamTransaction
          ? (result.txn(this.dreamTransaction) as unknown as DreamInstance)
          : result

        await subquery.update(attributes as any, skipHooks ? { skipHooks } : undefined)
        counter++
      },
      {
        batchSize: resolvedBatchSize,
      }
    )

    return counter
  }

  /**
   * @internal
   *
   * The compare-and-set implementation behind `update(attributes, { lock: true })`,
   * driven by {@link Query.lockedBatches}, which owns the keyset cursor, the
   * pluck/claim two-step, and the transaction dispatch.
   *
   * Each claimed record is handed to `cb`, which returns the attributes to
   * write for it, or a nullish value to skip it. The attributes form is the
   * constant-callback case (a callback ignoring the record and always
   * returning the same attributes), which is how the two forms share this
   * implementation. (`update` hands the user's own callback a clone of each
   * claimed record, so only the returned attributes reach the write below —
   * see the dispatch in {@link Query.update}.)
   *
   * The count is the number of claimed records the callback returned
   * attributes for: records attempted but not claimed (lost races) never
   * reach the callback, and claimed records the callback skipped are not
   * counted. For the attributes form the callback is total, so the count
   * degenerates to records claimed and submitted for writing. (A record whose
   * write turns out to be a no-op still counts: the instance path returns
   * without issuing SQL when nothing is dirty.)
   *
   * Each claimed record is written via the ordinary per-instance update, so
   * hooks (unless `skipHooks`), custom setters, and virtual/encrypted
   * attribute preprocessing behave exactly as in a plain instance update.
   *
   * No join-load guard is needed here: update's own joins guards have already
   * thrown on every join-load query (leftJoinPreload always carries left-join
   * statements).
   */
  private async lockedUpdate(
    cb: (
      record: DreamInstance
    ) =>
      | UpdateableProperties<DreamInstance>
      | undefined
      | Promise<UpdateableProperties<DreamInstance> | undefined>,
    { skipHooks }: { skipHooks?: boolean | undefined },
    batchSize: number,
    sortableIncomingAttributes?: Record<string, unknown>
  ): Promise<number> {
    return await this.lockedBatches(
      batchSize,
      async (claimed, txn) => {
        let written = 0

        for (const record of claimed) {
          const attributes = await cb(record)
          // null is not part of the callback's advertised contract, but it is
          // the natural untyped-JS skip idiom; treat it as a skip rather than
          // letting it crash the per-instance write mid-batch
          if (attributes == null) continue

          const inTransaction = record.txn(txn) as unknown as DreamInstance
          await inTransaction.update(attributes as any, skipHooks ? { skipHooks } : undefined)
          written++
        }

        return written
      },
      sortableIncomingAttributes
    )
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
  where?: readonly InternalWhereStatement<DreamInstance, DB, Schema, any>[] | null | undefined
  whereNot?: readonly InternalWhereStatement<DreamInstance, DB, Schema, any>[] | null | undefined
  limit?: LimitStatement | null | undefined
  offset?: OffsetStatement | null | undefined
  or?: InternalWhereStatement<DreamInstance, DB, Schema, any>[][] | null | undefined
  order?: OrderQueryStatement<ColumnType>[] | null | undefined
  loadFromJoins?: boolean | undefined
  preloadStatements?: RelaxedPreloadStatement | undefined
  preloadOnStatements?: RelaxedPreloadOnStatement<DreamInstance, DB, Schema> | undefined
  distinctColumn?: ColumnType | null | undefined
  innerJoinDreamClasses?: readonly (typeof Dream)[] | undefined
  innerJoinStatements?: RelaxedJoinStatement | undefined
  innerJoinAndStatements?: RelaxedJoinAndStatement<DreamInstance, DB, Schema> | undefined
  leftJoinStatements?: RelaxedJoinStatement | undefined
  leftJoinAndStatements?: RelaxedJoinAndStatement<DreamInstance, DB, Schema> | undefined
  bypassAllDefaultScopes?: boolean | undefined
  bypassAllDefaultScopesExceptOnAssociations?: boolean | undefined
  defaultScopesToBypass?: AllDefaultScopeNames<DreamInstance>[] | undefined
  defaultScopesToBypassExceptOnAssociations?: DefaultScopeName<DreamInstance>[] | undefined
  transaction?: DreamTransaction<Dream> | null | undefined
  connection?: DbConnectionType | undefined
  shouldReallyDestroy?: boolean | undefined
}
