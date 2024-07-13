import {
  AliasedExpression,
  ComparisonOperator,
  DeleteQueryBuilder,
  ExpressionBuilder,
  ExpressionWrapper,
  ComparisonOperatorExpression as KyselyComparisonOperatorExpression,
  RawBuilder,
  SelectQueryBuilder,
  UpdateQueryBuilder,
  Updateable,
  sql,
} from 'kysely'
import { ExtractTableAlias } from 'kysely/dist/cjs/parser/table-parser'
import isEmpty from 'lodash.isempty'
import { DateTime } from 'luxon'
import { singular } from 'pluralize'
import ConnectedToDB from '../db/ConnectedToDB'
import { AssociationTableNames } from '../db/reflections'
import { DbConnectionType } from '../db/types'
import associationToGetterSetterProp from '../decorators/associations/associationToGetterSetterProp'
import { BelongsToStatement } from '../decorators/associations/belongs-to'
import { HasManyStatement } from '../decorators/associations/has-many'
import { HasOneStatement } from '../decorators/associations/has-one'
import {
  AssociationStatement,
  LimitStatement,
  OffsetStatement,
  OrderQueryStatement,
  PassthroughWhere,
  WhereSelfStatement,
  WhereStatement,
} from '../decorators/associations/shared'
import Dream from '../dream'
import CannotAssociateThroughPolymorphic from '../exceptions/associations/cannot-associate-through-polymorphic'
import CannotJoinPolymorphicBelongsToError from '../exceptions/associations/cannot-join-polymorphic-belongs-to-error'
import JoinAttemptedOnMissingAssociation from '../exceptions/associations/join-attempted-with-missing-association'
import MissingRequiredAssociationWhereClause from '../exceptions/associations/missing-required-association-where-clause'
import MissingRequiredPassthroughForAssociationWhereClause from '../exceptions/associations/missing-required-passthrough-for-association-where-clause'
import MissingThroughAssociation from '../exceptions/associations/missing-through-association'
import MissingThroughAssociationSource from '../exceptions/associations/missing-through-association-source'
import CannotCallUndestroyOnANonSoftDeleteModel from '../exceptions/cannot-call-undestroy-on-a-non-soft-delete-model'
import CannotNegateSimilarityClause from '../exceptions/cannot-negate-similarity-clause'
import CannotPassAdditionalFieldsToPluckEachAfterCallback from '../exceptions/cannot-pass-additional-fields-to-pluck-each-after-callback-function'
import MissingRequiredCallbackFunctionToPluckEach from '../exceptions/missing-required-callback-function-to-pluck-each'
import NoUpdateAllOnAssociationQuery from '../exceptions/no-updateall-on-association-query'
import NoUpdateAllOnJoins from '../exceptions/no-updateall-on-joins'
import RecordNotFound from '../exceptions/record-not-found'
import CalendarDate from '../helpers/CalendarDate'
import { allNestedObjectKeys } from '../helpers/allNestedObjectKeys'
import cloneDeepSafe from '../helpers/cloneDeepSafe'
import compact from '../helpers/compact'
import { marshalDBValue } from '../helpers/marshalDBValue'
import protectAgainstPollutingAssignment from '../helpers/protectAgainstPollutingAssignment'
import { Range } from '../helpers/range'
import snakeify from '../helpers/snakeify'
import { isObject, isString } from '../helpers/typechecks'
import ops from '../ops'
import CurriedOpsStatement from '../ops/curried-ops-statement'
import OpsStatement from '../ops/ops-statement'
import LoadIntoModels from './internal/associations/load-into-models'
import executeDatabaseQuery from './internal/executeDatabaseQuery'
import { extractValueFromJoinsPluckResponse } from './internal/extractValueFromJoinsPluckResponse'
import orderByDirection from './internal/orderByDirection'
import shouldBypassDefaultScope from './internal/shouldBypassDefaultScope'
import SimilarityBuilder from './internal/similarity/SimilarityBuilder'
import sqlResultToDreamInstance from './internal/sqlResultToDreamInstance'
import DreamTransaction from './transaction'
import {
  DefaultScopeName,
  DreamAttributes,
  DreamColumn,
  DreamColumnNames,
  DreamConst,
  DreamTableSchema,
  FinalVariadicTableName,
  OrderDir,
  RelaxedJoinsStatement,
  RelaxedJoinsWhereStatement,
  RelaxedPreloadStatement,
  RelaxedPreloadWhereStatement,
  TableColumnNames,
  TableColumnType,
  TableOrAssociationName,
  VariadicCountThroughArgs,
  VariadicJoinsArgs,
  VariadicLoadArgs,
  VariadicMinMaxThroughArgs,
  VariadicPluckEachThroughArgs,
  VariadicPluckThroughArgs,
} from './types'

const OPERATION_NEGATION_MAP: Partial<{ [Property in ComparisonOperator]: ComparisonOperator }> = {
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
} as const

export default class Query<DreamInstance extends Dream> extends ConnectedToDB<DreamInstance> {
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
   *
   * stores the dream transaction applied to the
   * current Query instance
   */
  public dreamTransaction: DreamTransaction<Dream> | null = null

  /**
   * @internal
   *
   * stores the passthrough where statements applied to the
   * current Query instance
   */
  private readonly passthroughWhereStatement: PassthroughWhere<
    DreamInstance['dreamconf']['passthroughColumns']
  > = Object.freeze({})

  /**
   * @internal
   *
   * stores the where statements applied to the
   * current Query instance
   */
  private readonly whereStatements: readonly WhereStatement<
    DreamInstance['dreamconf']['DB'],
    DreamInstance['dreamconf']['schema'],
    any
  >[] = Object.freeze([])

  /**
   * @internal
   *
   * stores the where not statements applied to the
   * current Query instance
   */
  private readonly whereNotStatements: readonly WhereStatement<
    DreamInstance['dreamconf']['DB'],
    DreamInstance['dreamconf']['schema'],
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
  private readonly orStatements: readonly WhereStatement<
    DreamInstance['dreamconf']['DB'],
    DreamInstance['dreamconf']['schema'],
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
   * stores the preload statements applied to the
   * current Query instance
   */
  private readonly preloadStatements: RelaxedPreloadStatement = Object.freeze({})

  /**
   * @internal
   *
   * stores the preload where statements applied to the
   * current Query instance
   */
  private readonly preloadWhereStatements: RelaxedPreloadWhereStatement<
    DreamInstance['dreamconf']['DB'],
    DreamInstance['dreamconf']['schema']
  > = Object.freeze({})

  /**
   * @internal
   *
   * stores the joins statements applied to the
   * current Query instance
   */
  private readonly joinsStatements: RelaxedJoinsStatement = Object.freeze({})

  /**
   * @internal
   *
   * stores the joins where statements applied to the
   * current Query instance
   */
  private readonly joinsWhereStatements: RelaxedJoinsWhereStatement<
    DreamInstance['dreamconf']['DB'],
    DreamInstance['dreamconf']['schema']
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
  private readonly bypassSpecificDefaultScopes: string[] = []

  /**
   * @internal
   *
   * Specific default scopes to bypass, but not associations
   */
  private readonly bypassSpecificDefaultScopesExceptOnAssociations: string[] = []

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
  private baseSqlAlias: TableOrAssociationName<DreamInstance['dreamconf']['schema']>

  /**
   * @internal
   *
   * Used for unscoping Query instances. In most cases, this will be null,
   * but when calling `removeAllDefaultScopes`, a removeAllDefaultScopes Query is stored as
   * baseSelectQuery.
   */
  private baseSelectQuery: Query<any> | null

  constructor(
    dreamInstance: DreamInstance,
    opts: QueryOpts<DreamInstance, DreamColumnNames<DreamInstance>> = {}
  ) {
    super(dreamInstance, opts)
    this.passthroughWhereStatement = Object.freeze(opts.passthroughWhereStatement || {})
    this.whereStatements = Object.freeze(opts.where || [])
    this.whereNotStatements = Object.freeze(opts.whereNot || [])
    this.orStatements = Object.freeze(opts.or || [])
    this.orderStatements = Object.freeze(opts.order || [])
    this.preloadStatements = Object.freeze(opts.preloadStatements || {})
    this.preloadWhereStatements = Object.freeze(opts.preloadWhereStatements || {})
    this.joinsStatements = Object.freeze(opts.joinsStatements || {})
    this.joinsWhereStatements = Object.freeze(opts.joinsWhereStatements || {})
    this.baseSqlAlias = opts.baseSqlAlias || this.dreamInstance['table']
    this.baseSelectQuery = opts.baseSelectQuery || null
    this.limitStatement = opts.limit || null
    this.offsetStatement = opts.offset || null
    this.bypassAllDefaultScopes = opts.bypassAllDefaultScopes || false
    this.bypassAllDefaultScopesExceptOnAssociations = opts.bypassAllDefaultScopesExceptOnAssociations || false
    this.bypassSpecificDefaultScopes = opts.bypassSpecificDefaultScopes || []
    this.bypassSpecificDefaultScopesExceptOnAssociations =
      opts.bypassSpecificDefaultScopesExceptOnAssociations || []
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
  private queryForDreamClassWithScopeBypasses<T extends typeof Dream>(
    this: Query<DreamInstance>,
    dreamClass: T,
    {
      bypassAllDefaultScopesExceptOnAssociations = false,
      bypassSpecificDefaultScopesExceptOnAssociations = [],
    }: {
      bypassAllDefaultScopesExceptOnAssociations?: boolean
      bypassSpecificDefaultScopesExceptOnAssociations?: string[]
    } = {}
  ): Query<InstanceType<T>> {
    const associationQuery = dreamClass.query().clone({
      passthroughWhereStatement: this.passthroughWhereStatement,
      bypassAllDefaultScopes: this.bypassAllDefaultScopes,
      bypassAllDefaultScopesExceptOnAssociations,
      bypassSpecificDefaultScopes: this.bypassSpecificDefaultScopes,
      bypassSpecificDefaultScopesExceptOnAssociations,
    })

    return this.dreamTransaction ? associationQuery.txn(this.dreamTransaction) : associationQuery
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
  public clone(opts: QueryOpts<DreamInstance> = {}): Query<DreamInstance> {
    return new Query<DreamInstance>(this.dreamInstance, {
      baseSqlAlias: opts.baseSqlAlias || this.baseSqlAlias,
      baseSelectQuery: opts.baseSelectQuery || this.baseSelectQuery,
      passthroughWhereStatement: Object.freeze({
        ...this.passthroughWhereStatement,
        ...(opts.passthroughWhereStatement || {}),
      }),

      where: opts.where === null ? [] : Object.freeze([...this.whereStatements, ...(opts.where || [])]),
      whereNot:
        opts.whereNot === null ? [] : Object.freeze([...this.whereNotStatements, ...(opts.whereNot || [])]),
      limit: opts.limit === null ? null : opts.limit !== undefined ? opts.limit : this.limitStatement || null,
      offset:
        opts.limit === null || opts.offset === null
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

      bypassAllDefaultScopes:
        opts.bypassAllDefaultScopes !== undefined ? opts.bypassAllDefaultScopes : this.bypassAllDefaultScopes,
      bypassAllDefaultScopesExceptOnAssociations:
        opts.bypassAllDefaultScopesExceptOnAssociations !== undefined
          ? opts.bypassAllDefaultScopesExceptOnAssociations
          : this.bypassAllDefaultScopesExceptOnAssociations,
      bypassSpecificDefaultScopes:
        opts.bypassSpecificDefaultScopes !== undefined
          ? opts.bypassSpecificDefaultScopes
          : this.bypassSpecificDefaultScopes,

      bypassSpecificDefaultScopesExceptOnAssociations:
        opts.bypassSpecificDefaultScopesExceptOnAssociations !== undefined
          ? opts.bypassSpecificDefaultScopesExceptOnAssociations
          : this.bypassSpecificDefaultScopesExceptOnAssociations,

      transaction: opts.transaction || this.dreamTransaction,
      connection: opts.connection,
      shouldReallyDestroy:
        opts.shouldReallyDestroy !== undefined ? opts.shouldReallyDestroy : this.shouldReallyDestroy,
    })
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
  public async find<
    Schema extends DreamInstance['dreamconf']['schema'],
    TableName extends keyof Schema = DreamInstance['table'] & keyof Schema,
  >(
    primaryKey: Schema[TableName]['columns'][DreamInstance['primaryKey'] &
      keyof Schema[TableName]['columns']]['coercedType']
  ): Promise<DreamInstance | null> {
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
   * @param primaryKey - The primaryKey of the record to look up
   * @returns The found record
   */
  public async findOrFail<
    Schema extends DreamInstance['dreamconf']['schema'],
    TableName extends keyof Schema = DreamInstance['table'] & keyof Schema,
  >(
    primaryKey: Schema[TableName]['columns'][DreamInstance['primaryKey'] &
      keyof Schema[TableName]['columns']]['coercedType']
  ): Promise<DreamInstance> {
    const record = await this.find(primaryKey)
    if (!record) throw new RecordNotFound(this.constructor.name)
    return record
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
  public async findBy<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
  >(whereStatement: WhereStatement<DB, Schema, DreamInstance['table']>): Promise<DreamInstance | null> {
    return await this.where(whereStatement).first()
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
  public async findOrFailBy<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
  >(whereStatement: WhereStatement<DB, Schema, DreamInstance['table']>): Promise<DreamInstance> {
    const record = await this.findBy(whereStatement)
    if (!record) throw new RecordNotFound(this.dreamInstance.constructor.name)
    return record
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
  public async findEach(
    this: Query<DreamInstance>,
    cb: (instance: DreamInstance) => void | Promise<void>,
    { batchSize = Query.BATCH_SIZES.FIND_EACH }: { batchSize?: number } = {}
  ): Promise<void> {
    let records: any[]
    const query = this.order(null).order(this.dreamClass.primaryKey).limit(batchSize)
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
   *   @HasMany(() => LocalizedText)
   *   public localizedTexts: LocalizedText[]
   * }
   *
   * class Post extends ApplicationModel {
   *   @HasMany(() => LocalizedText)
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
  public async loadInto<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
    TableName extends DreamInstance['table'],
    const Arr extends readonly unknown[],
  >(dreams: Dream[], ...args: [...Arr, VariadicLoadArgs<DB, Schema, TableName, Arr>]) {
    const query = this.preload(...(args as any))
    await new LoadIntoModels<DreamInstance>(
      query.preloadStatements,
      query.passthroughWhereStatement
    ).loadInto(dreams)
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
  public preload<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
    TableName extends DreamInstance['table'],
    const Arr extends readonly unknown[],
  >(...args: [...Arr, VariadicLoadArgs<DB, Schema, TableName, Arr>]) {
    const preloadStatements = cloneDeepSafe(this.preloadStatements)

    const preloadWhereStatements: RelaxedPreloadWhereStatement<DB, Schema> = cloneDeepSafe(
      this.preloadWhereStatements
    )

    this.fleshOutJoinsStatements(preloadStatements, preloadWhereStatements, null, [...(args as any)])
    return this.clone({ preloadStatements, preloadWhereStatements })
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
  public joins<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
    TableName extends DreamInstance['table'],
    const Arr extends readonly unknown[],
  >(...args: [...Arr, VariadicJoinsArgs<DB, Schema, TableName, Arr>]) {
    const joinsStatements = cloneDeepSafe(this.joinsStatements)

    const joinsWhereStatements: RelaxedJoinsWhereStatement<DB, Schema> = cloneDeepSafe(
      this.joinsWhereStatements
    )
    this.fleshOutJoinsStatements(joinsStatements, joinsWhereStatements, null, [...(args as any)])
    return this.clone({ joinsStatements, joinsWhereStatements })
  }

  /**
   * @internal
   *
   * Applies a join statement for an association
   *
   */
  private fleshOutJoinsStatements<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
  >(
    joinsStatements: RelaxedPreloadStatement,
    joinsWhereStatements: RelaxedJoinsWhereStatement<DB, Schema>,
    previousAssociationName: null | string,
    associationStatements: (string | WhereStatement<DB, Schema, any> | undefined)[]
  ) {
    const nextAssociationStatement = associationStatements.shift()

    if (nextAssociationStatement === undefined) {
      // just satisfying typing
    } else if (isString(nextAssociationStatement)) {
      const nextStatement = nextAssociationStatement as string

      if (!joinsStatements[nextStatement])
        joinsStatements[protectAgainstPollutingAssignment(nextStatement)] = {}
      if (!joinsWhereStatements[nextStatement])
        joinsWhereStatements[protectAgainstPollutingAssignment(nextStatement)] = {}
      const nextJoinsStatements = joinsStatements[nextStatement]
      const nextJoinsWhereStatements = joinsWhereStatements[nextStatement] as RelaxedJoinsWhereStatement<
        DB,
        Schema
      >

      this.fleshOutJoinsStatements(
        nextJoinsStatements as any,
        nextJoinsWhereStatements,
        nextStatement,
        associationStatements
      )
    } else if (Array.isArray(nextAssociationStatement)) {
      // this supports the final argument of load/preload statements
      const nextStatement = nextAssociationStatement

      nextStatement.forEach(associationStatement => {
        joinsStatements[protectAgainstPollutingAssignment(associationStatement)] = {}
      })
    } else if (isObject(nextAssociationStatement) && previousAssociationName) {
      const clonedNextAssociationStatement = cloneDeepSafe(nextAssociationStatement)

      const keys = Object.keys(clonedNextAssociationStatement)

      keys.forEach((key: string) => {
        joinsWhereStatements[protectAgainstPollutingAssignment(key)] = clonedNextAssociationStatement[key]
      })

      this.fleshOutJoinsStatements(
        joinsStatements,
        joinsWhereStatements,
        previousAssociationName,
        associationStatements
      )
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
  public async pluckThrough<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
    TableName extends DreamInstance['table'],
    const Arr extends readonly unknown[],
  >(...args: [...Arr, VariadicPluckThroughArgs<DB, Schema, TableName, Arr>]): Promise<any[]> {
    const joinsStatements = cloneDeepSafe(this.joinsStatements)

    const joinsWhereStatements: RelaxedJoinsWhereStatement<DB, Schema> = cloneDeepSafe(
      this.joinsWhereStatements
    )
    const pluckStatement = [
      this.fleshOutPluckThroughStatements(joinsStatements, joinsWhereStatements, null, [...args]),
    ].flat() as any[]

    const vals = await this.clone({ joinsStatements, joinsWhereStatements }).pluckWithoutMarshalling(
      ...pluckStatement
    )

    const associationNamesToDreamClasses = this.pluckThroughArgumentsToDreamClassesMap([...args])

    const mapFn = (val: any, index: number) => {
      return extractValueFromJoinsPluckResponse(
        val,
        index,
        pluckStatement,
        this.dreamClass,
        associationNamesToDreamClasses
      )
    }

    const response = this.pluckValuesToPluckResponse(pluckStatement, vals, mapFn, {
      excludeFirstValue: false,
    })
    return response
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
  public async pluckEachThrough<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
    TableName extends DreamInstance['table'],
    const Arr extends readonly unknown[],
  >(...args: [...Arr, VariadicPluckEachThroughArgs<DB, Schema, TableName, Arr>]): Promise<void> {
    const allOpts = [...args]
    const providedCbIndex = allOpts.findIndex(v => typeof v === 'function')
    const providedCb = allOpts[providedCbIndex] as (a: any) => Promise<void>
    const providedOpts = allOpts[providedCbIndex + 1] as FindEachOpts

    if (!providedCb)
      throw new MissingRequiredCallbackFunctionToPluckEach('pluckEachThrough', compact(allOpts))
    if (providedOpts !== undefined && !providedOpts?.batchSize)
      throw new CannotPassAdditionalFieldsToPluckEachAfterCallback('pluckEachThrough', compact(allOpts))

    const batchSize = providedOpts?.batchSize || Query.BATCH_SIZES.PLUCK_EACH_THROUGH

    const joinsStatements = cloneDeepSafe(this.joinsStatements)

    const joinsWhereStatements: RelaxedJoinsWhereStatement<DB, Schema> = cloneDeepSafe(
      this.joinsWhereStatements
    )

    const fieldArgs = [...args] as any[]
    const onlyColumns: any[] = fieldArgs.filter((_, index) => index < providedCbIndex)

    const pluckStatement = [
      this.fleshOutPluckThroughStatements(joinsStatements, joinsWhereStatements, null, onlyColumns),
    ].flat() as string[]

    const associationNamesToDreamClasses = this.pluckThroughArgumentsToDreamClassesMap([...fieldArgs])
    const finalAssociationName = this.pluckThroughArgumentsToTargetAssociationName([...fieldArgs])
    const finalDreamClass = associationNamesToDreamClasses[finalAssociationName]
    const finalPrimaryKey = `${finalAssociationName}.${finalDreamClass.primaryKey}`

    const pluckStatementIncludesPrimaryKey =
      pluckStatement.includes(finalPrimaryKey) || pluckStatement.includes(finalDreamClass.primaryKey)

    const columnsIncludingPrimaryKey: DreamColumnNames<DreamInstance>[] = pluckStatementIncludesPrimaryKey
      ? pluckStatement
      : [finalPrimaryKey, ...pluckStatement]

    const baseQuery = this.clone({ joinsStatements, joinsWhereStatements })
    const mapFn = (val: any, index: number) => {
      return extractValueFromJoinsPluckResponse(
        val,
        index,
        pluckStatement,
        this.dreamClass,
        associationNamesToDreamClasses
      )
    }

    let offset = 0
    let results: any[]
    do {
      results = await baseQuery
        .order(null)
        .order(finalPrimaryKey)
        .offset(offset)
        .limit(batchSize)
        .pluckWithoutMarshalling(...columnsIncludingPrimaryKey)
      const plucked = this.pluckValuesToPluckResponse(pluckStatement, results, mapFn, {
        excludeFirstValue: !pluckStatementIncludesPrimaryKey,
      })

      for (const data of plucked) {
        await providedCb(data)
      }

      offset += batchSize
    } while (results.length > 0 && results.length === batchSize)
  }

  /**
   * @internal
   *
   * Returns the last association name in the pluck throguh args
   */
  private pluckThroughArgumentsToAssociationNames(associationStatements: any[]): string[] {
    const joinsStatements = {}
    this.fleshOutPluckThroughStatements(joinsStatements, {}, null, associationStatements)
    return allNestedObjectKeys(joinsStatements)
  }

  /**
   * @internal
   *
   * Returns the last association name in the pluck throguh args
   */
  private pluckThroughArgumentsToTargetAssociationName(
    // associationStatements: (
    //   | string
    //   | WhereStatement<DB, SyncedAssociations, any>
    //   | `${any}.${any}`
    //   | `${any}.${any}`[]
    //   | undefined
    // )[]
    // Complex type isn't gaining us anything and is making it difficult to use this private method
    associationStatements: any[]
  ): string {
    const associations = this.pluckThroughArgumentsToAssociationNames(associationStatements)
    return associations[associations.length - 1]
  }
  /**
   * @internal
   *
   * Builds an association map for use when
   * applying pluckThrough statements
   *
   */
  private pluckThroughArgumentsToDreamClassesMap(
    // associationStatements: (
    //   | string
    //   | WhereStatement<DB, SyncedAssociations, any>
    //   | `${any}.${any}`
    //   | `${any}.${any}`[]
    //   | undefined
    // )[]
    // Complex type isn't gaining us anything and is making it difficult to use this private method
    associationStatements: any[]
  ): { [key: string]: typeof Dream } {
    const associations = this.pluckThroughArgumentsToAssociationNames(associationStatements)
    return this.associationsToDreamClassesMap(associations)
  }

  /**
   * @internal
   *
   * Builds an association map for use when
   * applying pluckThrough statements
   *
   */
  private associationsToDreamClassesMap(associationNames: string[]) {
    const associationsToDreamClassesMap: { [key: string]: typeof Dream } = {}

    associationNames.reduce((dreamClass: typeof Dream, associationName: string) => {
      const association = dreamClass['getAssociationMetadata'](associationName)
      const through = (association as any).through

      if (through) {
        const throughAssociation = dreamClass['getAssociationMetadata'](through)
        const throughAssociationDreamClass = throughAssociation.modelCB() as typeof Dream
        associationsToDreamClassesMap[through] = throughAssociationDreamClass
      }

      const nextDreamClass = association.modelCB() as typeof Dream
      associationsToDreamClassesMap[associationName] = nextDreamClass
      return nextDreamClass
    }, this.dreamClass)

    return associationsToDreamClassesMap
  }

  /**
   * @internal
   *
   * Applies pluckThrough statements
   *
   */
  private fleshOutPluckThroughStatements<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
  >(
    joinsStatements: RelaxedPreloadStatement,
    joinsWhereStatements: RelaxedJoinsWhereStatement<DB, Schema>,
    previousAssociationName: null | string,
    // associationStatements: (
    //   | string
    //   | WhereStatement<DB, SyncedAssociations, any>
    //   | `${any}.${any}`
    //   | `${any}.${any}`[]
    //   | undefined
    // )[]
    // Complex type isn't gaining us anything and is making it difficult to use this private method
    associationStatements: any[]
  ): `${any}.${any}` | `${any}.${any}`[] | undefined {
    const nextAssociationStatement = associationStatements.shift()

    if (nextAssociationStatement === undefined) {
      // just satisfying typing
    } else if (Array.isArray(nextAssociationStatement)) {
      return nextAssociationStatement
    } else if (isString(nextAssociationStatement) && (nextAssociationStatement as string).includes('.')) {
      return nextAssociationStatement as `${any}.${any}`
    } else if (isString(nextAssociationStatement)) {
      const nextStatement = nextAssociationStatement as string

      if (!joinsStatements[nextStatement])
        joinsStatements[protectAgainstPollutingAssignment(nextStatement)] = {}
      if (!joinsWhereStatements[nextStatement])
        joinsWhereStatements[protectAgainstPollutingAssignment(nextStatement)] = {}
      const nextJoinsStatements = joinsStatements[nextStatement]
      const nextJoinsWhereStatements = joinsWhereStatements[nextStatement] as RelaxedJoinsWhereStatement<
        DB,
        Schema
      >

      return this.fleshOutPluckThroughStatements(
        nextJoinsStatements as any,
        nextJoinsWhereStatements,
        nextStatement,
        associationStatements
      )
    } else if (isObject(nextAssociationStatement) && previousAssociationName) {
      const clonedNextAssociationStatement = cloneDeepSafe(nextAssociationStatement)

      const keys = Object.keys(clonedNextAssociationStatement)

      keys.forEach((key: string) => {
        joinsWhereStatements[protectAgainstPollutingAssignment(key)] = clonedNextAssociationStatement[key]
      })

      return this.fleshOutPluckThroughStatements(
        joinsStatements,
        joinsWhereStatements,
        previousAssociationName,
        associationStatements
      )
    }
  }

  /**
   * @internal
   *
   * Changes the base sql alias
   *
   */
  private setBaseSQLAlias<Schema extends DreamInstance['dreamconf']['schema']>(
    baseSqlAlias: TableOrAssociationName<Schema>
  ) {
    return this.clone({ baseSqlAlias })
  }

  /**
   * @internal
   *
   * Changes the base select Query
   *
   */
  private setBaseSelectQuery(baseSelectQuery: Query<any>) {
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
  public removeAllDefaultScopes(): Query<DreamInstance> {
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
  protected removeAllDefaultScopesExceptOnAssociations(): Query<DreamInstance> {
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
  public removeDefaultScope(scopeName: DefaultScopeName<DreamInstance>): Query<DreamInstance> {
    return this.clone({
      bypassSpecificDefaultScopes: [...this.bypassSpecificDefaultScopes, scopeName],
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
  ): Query<DreamInstance> {
    return this.clone({
      bypassSpecificDefaultScopes: [...this.bypassSpecificDefaultScopesExceptOnAssociations, scopeName],
      baseSelectQuery: this.baseSelectQuery?.removeDefaultScope(scopeName),
    })
  }

  /**
   * Sends data through for use as passthrough data
   * for the associations that require it.
   *
   * ```ts
   * class Post {
   *   @HasMany(() => LocalizedText)
   *   public localizedTexts: LocalizedText[]
   *
   *   @HasOne(() => LocalizedText, {
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
  public passthrough(
    passthroughWhereStatement: PassthroughWhere<DreamInstance['dreamconf']['passthroughColumns']>
  ) {
    return this.clone({ passthroughWhereStatement })
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
  public where<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
  >(whereStatement: WhereStatement<DB, Schema, DreamInstance['table']> | null): Query<DreamInstance> {
    return this._where(whereStatement, 'where')
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
  public whereAny<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
  >(whereStatements: WhereStatement<DB, Schema, DreamInstance['table']>[]): Query<DreamInstance> {
    return this.clone({
      or: [whereStatements.map(obj => ({ ...obj }))],
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
  public whereNot<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
  >(whereStatement: WhereStatement<DB, Schema, DreamInstance['table']>): Query<DreamInstance> {
    return this._where(whereStatement, 'whereNot')
  }

  /**
   * @internal
   *
   * Applies a where clause
   */
  private _where<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
  >(
    whereStatement: WhereStatement<DB, Schema, DreamInstance['table']> | null,
    typeOfWhere: 'where' | 'whereNot'
  ): Query<DreamInstance> {
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
    this: Query<DreamInstance>,
    selection: SimpleFieldType | PluckThroughFieldType
  ) {
    const query = this.buildSelect({ bypassSelectAll: true, bypassOrder: true }) as SelectQueryBuilder<
      any,
      any,
      any
    >

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
  public order(
    arg: DreamColumnNames<DreamInstance> | Partial<Record<DreamColumnNames<DreamInstance>, OrderDir>> | null
  ): Query<DreamInstance> {
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
  public limit(limit: number | null) {
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
  public offset(offset: number | null) {
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
      ? SelectQueryBuilder<DreamInstance['dreamconf']['DB'], DreamInstance['table'], any>
      : QueryType extends 'delete'
        ? DeleteQueryBuilder<DreamInstance['dreamconf']['DB'], DreamInstance['table'], any>
        : QueryType extends 'update'
          ? UpdateQueryBuilder<
              DreamInstance['dreamconf']['DB'],
              DreamInstance['table'],
              DreamInstance['table'],
              any
            >
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
  public distinct(
    column: TableColumnNames<DreamInstance['dreamconf']['DB'], DreamInstance['table']> | boolean = true
  ) {
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
  private namespaceColumn(column: string) {
    if (column.includes('.')) return column
    return `${this.baseSqlAlias}.${column}`
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
  public async max<ColumnName extends DreamColumnNames<DreamInstance>>(
    columnName: ColumnName
  ): Promise<DreamColumn<DreamInstance, ColumnName & keyof DreamAttributes<DreamInstance>> | null> {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { max } = this.dbFor('select').fn
    let kyselyQuery = this.buildSelect({ bypassSelectAll: true, bypassOrder: true })

    kyselyQuery = kyselyQuery.select(max(columnName as any) as any)

    const data = await executeDatabaseQuery(kyselyQuery, 'executeTakeFirstOrThrow')

    return marshalDBValue(this.dreamClass, columnName as any, data.max)
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
  public async min<ColumnName extends DreamColumnNames<DreamInstance>>(
    columnName: ColumnName
  ): Promise<DreamColumn<DreamInstance, ColumnName & keyof DreamAttributes<DreamInstance>> | null> {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { min } = this.dbFor('select').fn
    let kyselyQuery = this.buildSelect({ bypassSelectAll: true, bypassOrder: true })

    kyselyQuery = kyselyQuery.select(min(columnName as any) as any)
    const data = await executeDatabaseQuery(kyselyQuery, 'executeTakeFirstOrThrow')

    return marshalDBValue(this.dreamClass, columnName as any, data.min)
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
  public async minThrough<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
    TableName extends DreamInstance['table'],
    const Arr extends readonly unknown[],
    FinalColumnWithAlias extends VariadicMinMaxThroughArgs<DB, Schema, TableName, Arr>,
    FinalColumn extends FinalColumnWithAlias extends Readonly<`${string}.${infer R extends Readonly<string>}`>
      ? R
      : never,
    FinalTableName extends FinalVariadicTableName<DB, Schema, TableName, Arr>,
    FinalColumnType extends TableColumnType<Schema, FinalTableName, FinalColumn>,
  >(...args: [...Arr, FinalColumnWithAlias]): Promise<FinalColumnType> {
    return await this.minMaxThrough('min', args)
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
  public async maxThrough<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
    TableName extends DreamInstance['table'],
    const Arr extends readonly unknown[],
    FinalColumnWithAlias extends VariadicMinMaxThroughArgs<DB, Schema, TableName, Arr>,
    FinalColumn extends FinalColumnWithAlias extends Readonly<`${string}.${infer R extends Readonly<string>}`>
      ? R
      : never,
    FinalTableName extends FinalVariadicTableName<DB, Schema, TableName, Arr>,
    FinalColumnType extends TableColumnType<Schema, FinalTableName, FinalColumn>,
  >(...args: [...Arr, FinalColumnWithAlias]): Promise<FinalColumnType> {
    return await this.minMaxThrough('max', args)
  }

  public async minMaxThrough<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
  >(minOrMax: 'min' | 'max', args: unknown[]) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { min, max } = this.dbFor('select').fn
    const joinsStatements = cloneDeepSafe(this.joinsStatements)

    const joinsWhereStatements: RelaxedJoinsWhereStatement<DB, Schema> = cloneDeepSafe(
      this.joinsWhereStatements
    )
    const pluckStatement = [
      this.fleshOutPluckThroughStatements(joinsStatements, joinsWhereStatements, null, [...args]),
    ].flat() as any[]
    const columnName = pluckStatement[0]

    let kyselyQuery = this.clone({ joinsStatements, joinsWhereStatements }).buildSelect({
      bypassSelectAll: true,
      bypassOrder: true,
    })

    switch (minOrMax) {
      case 'min':
        kyselyQuery = kyselyQuery.select(min(columnName) as any)
        break
      case 'max':
        kyselyQuery = kyselyQuery.select(max(columnName) as any)
        break
    }

    const data = await executeDatabaseQuery(kyselyQuery, 'executeTakeFirstOrThrow')
    return marshalDBValue(this.dreamClass, columnName, data[minOrMax])
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
  public async countThrough<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
    TableName extends DreamInstance['table'],
    const Arr extends readonly unknown[],
  >(...args: [...Arr, VariadicCountThroughArgs<DB, Schema, TableName, Arr>]): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { count } = this.dbFor('select').fn
    const joinsStatements = cloneDeepSafe(this.joinsStatements)

    const joinsWhereStatements: RelaxedJoinsWhereStatement<DB, Schema> = cloneDeepSafe(
      this.joinsWhereStatements
    )

    this.fleshOutPluckThroughStatements(joinsStatements, joinsWhereStatements, null, [...args])

    const distinctColumn = this.distinctColumn
    const query = this.clone({ joinsStatements, joinsWhereStatements, distinctColumn: null })
    let kyselyQuery = query.buildSelect({
      bypassSelectAll: true,
      bypassOrder: true,
    })

    const countClause = distinctColumn
      ? count(sql`DISTINCT ${distinctColumn}`)
      : count(query.namespaceColumn(query.dreamInstance.primaryKey))

    kyselyQuery = kyselyQuery.select(countClause.as('tablecount'))

    const data = await executeDatabaseQuery(kyselyQuery, 'executeTakeFirstOrThrow')

    return parseInt(data.tablecount.toString())
  }

  /**
   * @internal
   *
   * Runs the query and extracts plucked values
   *
   * @returns An array of plucked values
   */
  private async pluckWithoutMarshalling(...fields: DreamColumnNames<DreamInstance>[]): Promise<any[]> {
    let kyselyQuery = this.buildSelect({ bypassSelectAll: true })
    const aliases: string[] = []

    fields.forEach((field: string, index: number) => {
      const alias = `dr${index}`
      aliases.push(alias)
      kyselyQuery = kyselyQuery.select(`${this.namespaceColumn(field)} as ${alias}` as any)
    })

    return (await executeDatabaseQuery(kyselyQuery, 'execute')).map(singleResult =>
      aliases.map(alias => singleResult[alias])
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
   * @param fields - The column or array of columns to pluck
   * @returns An array of pluck results
   */
  public async pluck<TableName extends DreamInstance['table']>(
    ...fields: (DreamColumnNames<DreamInstance> | `${TableName}.${DreamColumnNames<DreamInstance>}`)[]
  ): Promise<any[]> {
    const vals = await this.pluckWithoutMarshalling(...fields)

    const mapFn = (val: any, index: number) => marshalDBValue(this.dreamClass, fields[index] as any, val)
    return this.pluckValuesToPluckResponse(fields, vals, mapFn, {
      excludeFirstValue: false,
    })
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
  public async pluckEach<
    TableName extends DreamInstance['table'],
    CB extends (plucked: any) => void | Promise<void>,
  >(
    ...fields: (
      | DreamColumnNames<DreamInstance>
      | `${TableName}.${DreamColumnNames<DreamInstance>}`
      | CB
      | FindEachOpts
    )[]
  ): Promise<void> {
    const providedCbIndex = fields.findIndex(v => typeof v === 'function')
    const providedCb = fields[providedCbIndex] as CB
    const providedOpts = fields[providedCbIndex + 1] as FindEachOpts

    if (!providedCb) throw new MissingRequiredCallbackFunctionToPluckEach('pluckEach', fields)
    if (providedOpts !== undefined && !providedOpts?.batchSize)
      throw new CannotPassAdditionalFieldsToPluckEachAfterCallback('pluckEach', fields)

    const onlyColumns = fields.filter(
      (_, index) => index < providedCbIndex
    ) as DreamColumnNames<DreamInstance>[]

    const batchSize = providedOpts?.batchSize || Query.BATCH_SIZES.PLUCK_EACH_THROUGH

    const mapFn = (val: any, index: number) => marshalDBValue(this.dreamClass, fields[index] as any, val)

    let offset = 0
    let records: any[]
    do {
      const onlyIncludesPrimaryKey = onlyColumns.includes(this.dreamClass.primaryKey)
      const columnsIncludingPrimaryKey: DreamColumnNames<DreamInstance>[] = onlyIncludesPrimaryKey
        ? onlyColumns
        : [this.dreamClass.primaryKey, ...onlyColumns]

      records = await this.offset(offset)
        .order(null)
        .order(this.dreamClass.primaryKey)
        .limit(batchSize)
        .pluckWithoutMarshalling(...columnsIncludingPrimaryKey)

      const vals = this.pluckValuesToPluckResponse(onlyColumns, records, mapFn, {
        excludeFirstValue: !onlyIncludesPrimaryKey,
      })
      for (const val of vals) {
        await providedCb(val)
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
  public async all() {
    const kyselyQuery = this.buildSelect()

    const results = await executeDatabaseQuery(kyselyQuery, 'execute')

    const theAll = results.map(r => sqlResultToDreamInstance(this.dreamClass, r)) as DreamInstance[]

    await this.applyPreload(this.preloadStatements as any, this.preloadWhereStatements as any, theAll)

    return theAll
  }

  /**
   * @internal
   *
   * Retrieves a Query with the requested connection.
   *
   * @param connection - The connection you wish to access
   * @returns A Query with the requested connection
   */
  protected connection(connection: DbConnectionType): Query<DreamInstance> {
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
      : this.order({ [this.dreamInstance.primaryKey as any]: 'asc' } as any)
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
    if (!record) throw new RecordNotFound(this.dreamInstance.constructor.name)
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
      : this.order({ [this.dreamInstance.primaryKey as any]: 'desc' } as any)

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
    if (!record) throw new RecordNotFound(this.dreamInstance.constructor.name)
    return record
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
  public async destroy({
    skipHooks,
    cascade,
  }: { skipHooks?: boolean; cascade?: boolean } = {}): Promise<number> {
    let counter = 0

    if (this.dreamTransaction) {
      await this.txn(this.dreamTransaction).findEach(async result => {
        if (this.shouldReallyDestroy) {
          await result.txn(this.dreamTransaction!).reallyDestroy({ skipHooks, cascade })
        } else {
          await result.txn(this.dreamTransaction!).destroy({ skipHooks, cascade })
        }
        counter++
      })
    } else {
      await this.findEach(async result => {
        if (this.shouldReallyDestroy) {
          await result.reallyDestroy({ skipHooks, cascade })
        } else {
          await result.destroy({ skipHooks, cascade })
        }
        counter++
      })
    }

    return counter
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
   * await User.where({ email: ops.ilike('%burpcollaborator%')}).undestroy()
   * // 12
   * ```
   *
   * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @param opts.cascade - if false, will skip applying cascade undeletes on "dependent: 'destroy'" associations. Defaults to true
   * @returns The number of records that were removed
   */
  public async undestroy({
    cascade,
    skipHooks,
  }: { cascade?: boolean; skipHooks?: boolean } = {}): Promise<number> {
    if (!this.dreamClass['softDelete']) throw new CannotCallUndestroyOnANonSoftDeleteModel(this.dreamClass)
    let counter = 0

    if (this.dreamTransaction) {
      await this.txn(this.dreamTransaction)
        .removeDefaultScope('dream:SoftDelete')
        .findEach(async result => {
          await result.txn(this.dreamTransaction!).undestroy({ skipHooks, cascade })
          counter++
        })
    } else {
      await this.removeDefaultScope('dream:SoftDelete').findEach(async result => {
        await result.undestroy({ skipHooks, cascade })
        counter++
      })
    }

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
   * @returns The number of records that were updated
   */
  public async delete() {
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
   * @param opts.skipHooks - if true, will skip applying model hooks. Defaults to false
   * @returns The number of records that were updated
   */
  public async update(
    attributes: DreamTableSchema<DreamInstance>,
    { skipHooks }: { skipHooks?: boolean } = {}
  ) {
    if (this.baseSelectQuery) throw new NoUpdateAllOnAssociationQuery()
    if (Object.keys(this.joinsStatements).length) throw new NoUpdateAllOnJoins()

    if (skipHooks) return await this.updateWithoutCallingModelHooks(attributes)

    let counter = 0

    if (this.dreamTransaction) {
      await this.txn(this.dreamTransaction).findEach(async result => {
        await result.txn(this.dreamTransaction!).update(attributes as any)
        counter++
      })
    } else {
      await this.findEach(async result => {
        await result.update(attributes as any)
        counter++
      })
    }

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
   * Applies pluck values to a provided callback function
   *
   * @returns An array of pluck values
   */
  private pluckValuesToPluckResponse(
    fields: any[],
    vals: any[],
    mapFn: (value: any, index: number) => any,
    { excludeFirstValue }: { excludeFirstValue: boolean }
  ) {
    if (excludeFirstValue) vals = vals.map(valueArr => valueArr.slice(1))

    if (fields.length > 1) {
      return vals.map(arr => arr.map(mapFn))
    } else {
      return vals.flat().map(val => mapFn(val, 0))
    }
  }

  /**
   * @internal
   *
   * Used for applying first and last queries
   *
   * @returns A dream instance or null
   */
  private async takeOne() {
    const kyselyQuery = this.buildSelect()
    const results = await executeDatabaseQuery(kyselyQuery, 'executeTakeFirst')

    if (results) {
      const theFirst = sqlResultToDreamInstance(this.dreamClass, results) as DreamInstance

      if (theFirst)
        await this.applyPreload(this.preloadStatements as any, this.preloadWhereStatements as any, [theFirst])

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

  // Polymorphic BelongsTo. Preload by loading each target class separately.
  /**
   * @internal
   *
   * Used to preload polymorphic belongs to associations
   */
  private async preloadPolymorphicBelongsTo(
    this: Query<DreamInstance>,
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

    let associatedDreams: Dream[] = []

    for (const associatedModel of association.modelCB() as (typeof Dream)[]) {
      const relevantAssociatedModels = dreams.filter((dream: any) => {
        return dream[association.foreignKeyTypeField()] === associatedModel['stiBaseClassOrOwnClass'].name
      })

      if (relevantAssociatedModels.length) {
        dreams.forEach((dream: any) => {
          dream[associationToGetterSetterProp(association)] = null
        })

        const loadedAssociations = await this.queryForDreamClassWithScopeBypasses(associatedModel, {
          bypassSpecificDefaultScopesExceptOnAssociations: association.withoutDefaultScopes,
        })
          .where({
            [associatedModel.primaryKey]: relevantAssociatedModels.map(
              (dream: any) => dream[association.foreignKey()]
            ),
          })
          .all()

        associatedDreams = [...associatedDreams, ...loadedAssociations]

        // dreams is a Rating
        // Rating belongs to: rateables (Posts / Compositions)
        // loadedAssociations is an array of Posts and Compositions
        // if rating.rateable_id === loadedAssociation.primaryKeyvalue
        //  rating.rateable = loadedAssociation
        for (const loadedAssociation of loadedAssociations) {
          dreams
            .filter((dream: any) => {
              if (association.polymorphic) {
                return (
                  dream[association.foreignKeyTypeField()] ===
                    loadedAssociation['stiBaseClassOrOwnClass'].name &&
                  dream[association.foreignKey()] === association.primaryKeyValue(loadedAssociation)
                )
              } else {
                return dream[association.foreignKey()] === association.primaryKeyValue(loadedAssociation)
              }
            })
            .forEach((dream: any) => {
              dream[association.as] = loadedAssociation
            })
        }
      }
    }

    return associatedDreams
  }

  /**
   * @internal
   *
   * Applies a preload statement
   */
  private async applyOnePreload(
    this: Query<DreamInstance>,
    associationName: string,
    dreams: Dream | Dream[],
    whereStatement: RelaxedPreloadWhereStatement<any, any> = {}
  ) {
    if (!Array.isArray(dreams)) dreams = [dreams] as Dream[]

    const dream = dreams.find(dream => dream['getAssociationMetadata'](associationName))!
    if (!dream) return

    const association = dream['getAssociationMetadata'](associationName)
    const dreamClass = dream.constructor as typeof Dream
    const dreamClassToHydrate = association.modelCB() as typeof Dream

    if ((association.polymorphic && association.type === 'BelongsTo') || Array.isArray(dreamClassToHydrate))
      return this.preloadPolymorphicBelongsTo(
        association as BelongsToStatement<any, any, any, string>,
        dreams
      )

    const dreamClassToHydrateColumns = [...dreamClassToHydrate.columns()]
    const throughColumnsToHydrate: any[] = []

    const columnsToPluck = dreamClassToHydrateColumns.map(
      column => `${associationName}.${column.toString()}`
    ) as any[]

    const asHasAssociation = association as
      | HasManyStatement<any, any, any, any>
      | HasOneStatement<any, any, any, any>

    if (asHasAssociation.through && asHasAssociation.preloadThroughColumns) {
      if (isObject(asHasAssociation.preloadThroughColumns)) {
        const preloadMap = asHasAssociation.preloadThroughColumns as Record<string, string>
        Object.keys(preloadMap).forEach(preloadThroughColumn => {
          throughColumnsToHydrate.push(preloadMap[preloadThroughColumn])
          columnsToPluck.push(`${asHasAssociation.through}.${preloadThroughColumn}`)
        })
      } else {
        const preloadArray = asHasAssociation.preloadThroughColumns as string[]
        preloadArray.forEach(preloadThroughColumn => {
          throughColumnsToHydrate.push(preloadThroughColumn)
          columnsToPluck.push(`${asHasAssociation.through}.${preloadThroughColumn}`)
        })
      }
    }

    columnsToPluck.push(`${dreamClass.table}.${dreamClass.primaryKey}`)

    const baseClass = dreamClass['stiBaseClassOrOwnClass']['getAssociationMetadata'](associationName)
      ? dreamClass['stiBaseClassOrOwnClass']
      : dreamClass

    const scope = this.queryForDreamClassWithScopeBypasses(baseClass, {
      bypassAllDefaultScopesExceptOnAssociations: true,
    }).where({
      [dreamClass.primaryKey]: dreams.map(obj => obj.primaryKeyValue),
    })

    const hydrationData: any[][] = whereStatement
      ? await scope.pluckThrough(
          associationName,
          whereStatement as WhereStatement<any, any, any>,
          columnsToPluck
        )
      : await scope.pluckThrough(associationName, columnsToPluck)

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
   * Applies a preload statement
   */
  private async hydratePreload(this: Query<DreamInstance>, dream: Dream) {
    await this.applyPreload(this.preloadStatements as any, this.preloadWhereStatements as any, dream)
  }

  /**
   * @internal
   *
   * Applies a preload statement
   */
  private async applyPreload(
    this: Query<DreamInstance>,
    preloadStatement: RelaxedPreloadStatement,
    preloadWhereStatements: RelaxedPreloadWhereStatement<any, any>,
    dream: Dream | Dream[]
  ) {
    const keys = Object.keys(preloadStatement as any)

    for (const key of keys) {
      const nestedDreams = await this.applyOnePreload(
        key,
        dream,
        this.applyableWhereStatements(preloadWhereStatements[key] as RelaxedPreloadWhereStatement<any, any>)
      )

      if (nestedDreams) {
        await this.applyPreload(
          (preloadStatement as any)[key],
          preloadWhereStatements[key] as any,
          nestedDreams
        )
      }
    }
  }

  /**
   * @internal
   *
   * retrieves where statements that can be applied
   */
  private applyableWhereStatements(
    preloadWhereStatements: RelaxedPreloadWhereStatement<any, any> | undefined
  ): RelaxedPreloadWhereStatement<any, any> | undefined {
    if (preloadWhereStatements === undefined) return undefined

    return Object.keys(preloadWhereStatements).reduce(
      (agg, key) => {
        const value = preloadWhereStatements[key]
        if (value === null || value.constructor !== Object) agg[key] = value

        return agg
      },
      {} as RelaxedPreloadWhereStatement<any, any>
    )
  }

  private conditionallyApplyDefaultScopes(): Query<DreamInstance> {
    if (this.bypassAllDefaultScopes || this.bypassAllDefaultScopesExceptOnAssociations) return this

    const thisScopes = this.dreamClass['scopes'].default
    let query: Query<DreamInstance> = this
    for (const scope of thisScopes) {
      if (
        !shouldBypassDefaultScope(scope.method, {
          defaultScopesToBypass: [
            ...this.bypassSpecificDefaultScopes,
            ...this.bypassSpecificDefaultScopesExceptOnAssociations,
          ],
        })
      ) {
        query = (this.dreamClass as any)[scope.method](query)
      }
    }

    return query
  }

  // Through associations don't get written into the SQL; they
  // locate the next association we need to build into the SQL
  // AND the source to reference on the other side
  private joinsBridgeThroughAssociations<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
  >({
    query,
    dreamClass,
    association,
    previousAssociationTableOrAlias,
  }: {
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, DreamInstance['table']>, object>
    dreamClass: typeof Dream
    association:
      | HasOneStatement<any, any, any, any>
      | HasManyStatement<any, any, any, any>
      | BelongsToStatement<any, any, any, any>
    previousAssociationTableOrAlias: TableOrAssociationName<Schema>
  }): {
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, DreamInstance['table']>, object>
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
        originalAssociation: association,
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
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
  >({
    query,
    dreamClass,
    previousAssociationTableOrAlias,
    currentAssociationTableOrAlias,
    originalAssociation,
    joinsWhereStatements = {},
  }: {
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, DreamInstance['table']>, object>
    dreamClass: typeof Dream
    previousAssociationTableOrAlias: TableOrAssociationName<Schema>
    currentAssociationTableOrAlias: TableOrAssociationName<Schema>
    originalAssociation?: HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>
    joinsWhereStatements?: RelaxedJoinsWhereStatement<DB, Schema>
  }): {
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, DreamInstance['table']>, object>
    association: any
    previousAssociationTableOrAlias: TableOrAssociationName<Schema>
    currentAssociationTableOrAlias: TableOrAssociationName<Schema>
  } {
    // Given:
    // dreamClass: Post
    // previousAssociationTableOrAlias: posts
    // currentAssociationTableOrAlias: commenters
    // Post has many Commenters through Comments
    // whereJoinsStatement: { commenters: { id: <some commenter id> } }
    // association = Post.associationMap[commenters]
    // which gives association = {
    //   through: 'comments',
    //   as: 'commenters',
    //   modelCB: () => Commenter,
    // }
    //
    // We want joinsBridgeThroughAssociations to add to the query:
    // INNER JOINS comments ON posts.id = comments.post_id
    // and update dreamClass to be

    let association = dreamClass['getAssociationMetadata'](currentAssociationTableOrAlias)
    if (!association)
      throw new JoinAttemptedOnMissingAssociation({
        dreamClass,
        associationName: currentAssociationTableOrAlias,
      })

    const results = this.joinsBridgeThroughAssociations({
      query,
      dreamClass,
      association,
      previousAssociationTableOrAlias,
    })

    query = results.query
    dreamClass = results.dreamClass
    association = results.association
    previousAssociationTableOrAlias = results.previousAssociationTableOrAlias
    const throughClass = results.throughClass

    if (originalAssociation?.through) {
      if (originalAssociation.distinct) {
        query = query.distinctOn(
          this.distinctColumnNameForAssociation({
            association: originalAssociation,
            tableNameOrAlias: originalAssociation.as,
            foreignKey: originalAssociation.primaryKey(),
          }) as any
        )
      }

      if (originalAssociation.where) {
        query = this.applyWhereStatements(
          query,
          this.aliasWhereStatements([originalAssociation.where], originalAssociation.as)
        )

        this.throwUnlessAllRequiredWhereClausesProvided(originalAssociation, originalAssociation.as, {})
      }

      if (originalAssociation.whereNot) {
        query = this.applyWhereStatements(
          query,
          this.aliasWhereStatements([originalAssociation.whereNot], originalAssociation.as),
          { negate: true }
        )
      }

      if (originalAssociation.selfWhere) {
        query = this.applyWhereStatements(
          query,
          this.rawifiedSelfWhereClause({
            associationAlias: originalAssociation.as,
            selfAlias: previousAssociationTableOrAlias,
            selfWhereClause: originalAssociation.selfWhere,
          })
        )
      }

      if (originalAssociation.selfWhereNot) {
        query = this.applyWhereStatements(
          query,
          this.rawifiedSelfWhereClause({
            associationAlias: originalAssociation.as,
            selfAlias: previousAssociationTableOrAlias,
            selfWhereClause: originalAssociation.selfWhereNot,
          }),
          { negate: true }
        )
      }

      if (originalAssociation.order) {
        query = this.applyOrderStatementForAssociation({
          query,
          tableNameOrAlias: originalAssociation.as,
          association: originalAssociation,
        })
      }
    }

    if (association.type === 'BelongsTo') {
      if (Array.isArray(association.modelCB()))
        throw new CannotJoinPolymorphicBelongsToError({
          dreamClass,
          association,
          joinsStatements: this.joinsStatements,
        })

      const to = (association.modelCB() as typeof Dream).table
      const joinTableExpression =
        currentAssociationTableOrAlias === to
          ? currentAssociationTableOrAlias
          : `${to} as ${currentAssociationTableOrAlias}`

      query = query.innerJoin(
        joinTableExpression,
        `${previousAssociationTableOrAlias}.${association.foreignKey()}`,
        `${currentAssociationTableOrAlias}.${association.primaryKey()}`
      ) as typeof query
    } else {
      const to = association.modelCB().table
      const joinTableExpression =
        currentAssociationTableOrAlias === to
          ? currentAssociationTableOrAlias
          : `${to} as ${currentAssociationTableOrAlias}`

      query = query.innerJoin(
        joinTableExpression,
        `${previousAssociationTableOrAlias}.${association.primaryKey()}`,
        `${currentAssociationTableOrAlias}.${association.foreignKey()}`
      ) as typeof query

      if (association.polymorphic) {
        query = this.applyWhereStatements(
          query,
          this.aliasWhereStatements(
            [
              {
                [association.foreignKeyTypeField()]: throughClass
                  ? throughClass['stiBaseClassOrOwnClass'].name
                  : dreamClass['stiBaseClassOrOwnClass'].name,
              } as any,
            ],
            currentAssociationTableOrAlias
          )
        )
      }

      if (association.where) {
        query = this.applyWhereStatements(
          query,
          this.aliasWhereStatements(
            [association.where as WhereStatement<DB, Schema, DreamInstance['table']>],
            currentAssociationTableOrAlias
          )
        )
        this.throwUnlessAllRequiredWhereClausesProvided(
          association,
          currentAssociationTableOrAlias,
          joinsWhereStatements
        )
      }

      if (association.whereNot) {
        query = this.applyWhereStatements(
          query,
          this.aliasWhereStatements(
            [association.whereNot as WhereStatement<DB, Schema, DreamInstance['table']>],
            currentAssociationTableOrAlias
          ),
          { negate: true }
        )
      }

      if (association.selfWhere) {
        query = this.applyWhereStatements(
          query,
          this.rawifiedSelfWhereClause({
            associationAlias: currentAssociationTableOrAlias,
            selfAlias: previousAssociationTableOrAlias,
            selfWhereClause: association.selfWhere,
          })
        )
      }

      if (association.selfWhereNot) {
        query = this.applyWhereStatements(
          query,
          this.rawifiedSelfWhereClause({
            associationAlias: currentAssociationTableOrAlias,
            selfAlias: previousAssociationTableOrAlias,
            selfWhereClause: association.selfWhereNot,
          }),
          { negate: true }
        )
      }

      if (association.order) {
        query = this.applyOrderStatementForAssociation({
          query,
          tableNameOrAlias: currentAssociationTableOrAlias,
          association,
        })
      }

      if (association.distinct) {
        query = query.distinctOn(
          this.distinctColumnNameForAssociation({
            association,
            tableNameOrAlias: currentAssociationTableOrAlias,
            foreignKey: association.foreignKey(),
          }) as any
        )
      }
    }

    ///////////////////////
    // apply default scopes
    ///////////////////////
    let scopesQuery = new Query<DreamInstance>(this.dreamInstance)
    const associationClass = association.modelCB() as any
    const associationScopes = associationClass.scopes.default

    for (const scope of associationScopes) {
      if (
        !shouldBypassDefaultScope(scope.method, {
          bypassAllDefaultScopes: this.bypassAllDefaultScopes,
          defaultScopesToBypass: [
            ...this.bypassSpecificDefaultScopes,
            ...(association.withoutDefaultScopes || []),
          ],
        })
      ) {
        const tempQuery = associationClass[scope.method](scopesQuery)
        if (tempQuery && tempQuery.constructor === this.constructor) scopesQuery = tempQuery
      }
    }

    if (scopesQuery.whereStatements.length) {
      query = this.applyWhereStatements(
        query,
        this.aliasWhereStatements(scopesQuery.whereStatements, currentAssociationTableOrAlias)
      )
    }
    ///////////////////////
    // end: apply default scopes
    ///////////////////////

    return {
      query,
      association,
      previousAssociationTableOrAlias,
      currentAssociationTableOrAlias,
    }
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
    if (association.distinct === true) return `${tableNameOrAlias}.${foreignKey}`
    return `${tableNameOrAlias}.${association.distinct}`
  }

  private recursivelyJoin<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
  >({
    query,
    joinsStatement,
    joinsWhereStatements,
    dreamClass,
    previousAssociationTableOrAlias,
  }: {
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, DreamInstance['table']>, object>
    joinsStatement: RelaxedJoinsWhereStatement<DB, Schema>
    joinsWhereStatements: RelaxedJoinsWhereStatement<DB, Schema>
    dreamClass: typeof Dream
    previousAssociationTableOrAlias: TableOrAssociationName<Schema>
  }): SelectQueryBuilder<DB, ExtractTableAlias<DB, DreamInstance['table']>, object> {
    for (const currentAssociationTableOrAlias of Object.keys(joinsStatement)) {
      const results = this.applyOneJoin({
        query,
        dreamClass,
        previousAssociationTableOrAlias,
        currentAssociationTableOrAlias,
        joinsWhereStatements,
      })

      query = results.query
      const association = results.association as AssociationStatement

      query = this.recursivelyJoin({
        query,
        joinsStatement: joinsStatement[currentAssociationTableOrAlias] as any,
        joinsWhereStatements: joinsWhereStatements[currentAssociationTableOrAlias] as any,

        dreamClass: association.modelCB() as typeof Dream,
        previousAssociationTableOrAlias: currentAssociationTableOrAlias,
      })
    }

    return query
  }

  private throwUnlessAllRequiredWhereClausesProvided(
    association: HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>,
    namespace: string,
    joinsWhereStatements: RelaxedJoinsWhereStatement<any, any>
  ) {
    const whereStatement = association.where!
    const columnsRequiringWhereStatements = Object.keys(whereStatement).reduce((agg, column) => {
      if (whereStatement[column] === DreamConst.required) agg.push(column)
      return agg
    }, [] as string[])

    const missingRequiredWhereStatements = columnsRequiringWhereStatements.filter(
      column => (joinsWhereStatements[namespace] as any)?.[column] === undefined
    )

    if (missingRequiredWhereStatements.length)
      throw new MissingRequiredAssociationWhereClause(association, missingRequiredWhereStatements[0])
  }

  private applyWhereStatements<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
    WS extends WhereStatement<DB, Schema, DreamInstance['table']>,
  >(
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, DreamInstance['table']>, object>,
    whereStatements: WS | WS[],
    {
      negate = false,
    }: {
      negate?: boolean
    } = {}
  ) {
    ;([whereStatements].flat() as WS[]).forEach(statement => {
      query = this.applySingleWhereStatement(query, statement, { negate })
    })

    return query
  }

  private applyOrderStatementForAssociation<DB extends DreamInstance['dreamconf']['DB']>({
    query,
    tableNameOrAlias,
    association,
  }: {
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, DreamInstance['table']>, object>
    tableNameOrAlias: string
    association: HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>
  }) {
    const orderStatement = association.order

    if (isString(orderStatement)) {
      query = query.orderBy(`${tableNameOrAlias}.${orderStatement as string}`, 'asc')
    } else {
      Object.keys(orderStatement as Record<string, OrderDir>).forEach(column => {
        const direction = (orderStatement as any)[column] as OrderDir
        query = query.orderBy(`${tableNameOrAlias}.${column}`, direction)
      })
    }

    if (association.type === 'HasOne') {
      query = query.limit(1)
    }

    return query
  }

  private applySingleWhereStatement<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
  >(
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, DreamInstance['table']>, object>,
    whereStatement: WhereStatement<DB, Schema, DreamInstance['table']>,
    {
      negate = false,
    }: {
      negate?: boolean
    } = {}
  ) {
    Object.keys(whereStatement)
      .filter(
        key =>
          (whereStatement as any)[key] !== undefined && (whereStatement as any)[key] !== DreamConst.required
      )
      .forEach(attr => {
        const val = (whereStatement as any)[attr]

        if (
          (val as OpsStatement<any, any>)?.isOpsStatement &&
          (val as OpsStatement<any, any>).shouldBypassWhereStatement
        ) {
          // some ops statements are handled specifically in the select portion of the query,
          // and should be ommited from the where clause directly
          return
        }

        const { a, b, c, a2, b2, c2 } = this.dreamWhereStatementToExpressionBuilderParts(attr, val)

        // postgres is unable to handle WHERE IN statements with blank arrays, such as in
        // "WHERE id IN ()", meaning that:
        // 1. If we receive a blank array during a IN comparison,
        //    then we need to simply regurgitate a where statement which
        //    guarantees no records.
        // 2. If we receive a blank array during a NOT IN comparison,
        //    then it is the same as the where statement not being present at all,
        //    resulting in a noop on our end
        if (b === 'in' && Array.isArray(c) && c.length === 0) {
          query = negate ? query.where(sql<boolean>`TRUE`) : query.where(sql<boolean>`FALSE`)
        } else if (b === 'not in' && Array.isArray(c) && c.length === 0) {
          query = negate ? query.where(sql<boolean>`FALSE`) : query.where(sql<boolean>`TRUE`)
        } else if (negate) {
          const negatedB = OPERATION_NEGATION_MAP[b as keyof typeof OPERATION_NEGATION_MAP]
          if (!negatedB) throw new Error(`no negation available for comparison operator ${b as string}`)
          query = query.where(a, negatedB, c)

          if (b2) {
            const negatedB2 = OPERATION_NEGATION_MAP[b2 as keyof typeof OPERATION_NEGATION_MAP]
            if (!negatedB2) throw new Error(`no negation available for comparison operator ${b2}`)
            query.where(a2, negatedB2, c2)
          }
        } else {
          query = query.where(a, b, c)
          if (b2) query = query.where(a2, b2, c2)
        }
      })

    return query
  }

  private whereStatementsToExpressionWrappers<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
  >(
    eb: ExpressionBuilder<any, any>,
    whereStatement: WhereStatement<DB, Schema, DreamInstance['table']>,
    {
      negate = false,
    }: {
      negate?: boolean
    } = {}
  ): ExpressionWrapper<any, any, any>[] {
    return compact(
      Object.keys(whereStatement)
        .filter(key => (whereStatement as any)[key] !== undefined)
        .flatMap(
          (
            attr
          ):
            | ExpressionWrapper<any, any, any>
            | ExpressionWrapper<any, any, any>[]
            | RawBuilder<any>
            | undefined => {
            const val = (whereStatement as any)[attr]

            if (
              (val as OpsStatement<any, any>)?.isOpsStatement &&
              (val as OpsStatement<any, any>).shouldBypassWhereStatement
            ) {
              // some ops statements are handled specifically in the select portion of the query,
              // and should be ommited from the where clause directly
              return
            }

            const { a, b, c, a2, b2, c2 } = this.dreamWhereStatementToExpressionBuilderParts(attr, val)

            // postgres is unable to handle WHERE IN statements with blank arrays, such as in
            // "WHERE id IN ()", meaning that:
            // 1. If we receive a blank array during a IN comparison,
            //    then we need to simply regurgitate a where statement which
            //    guarantees no records.
            // 2. If we receive a blank array during a NOT IN comparison,
            //    then it is the same as the where statement not being present at all,
            //    resulting in a noop on our end
            if (b === 'in' && Array.isArray(c) && c.length === 0) {
              return negate ? sql<boolean>`TRUE` : sql<boolean>`FALSE`
            } else if (b === 'not in' && Array.isArray(c) && c.length === 0) {
              return negate ? sql<boolean>`FALSE` : sql<boolean>`TRUE`
            } else if (negate) {
              const negatedB = OPERATION_NEGATION_MAP[b as keyof typeof OPERATION_NEGATION_MAP]
              if (!negatedB) throw new Error(`no negation available for comparison operator ${b as string}`)
              const whereExpression = [eb(a, negatedB, c)]

              if (b2) {
                const negatedB2 = OPERATION_NEGATION_MAP[b2 as keyof typeof OPERATION_NEGATION_MAP]
                if (!negatedB2)
                  throw new Error(`no negation available for comparison operator ${b2 as string}`)
                whereExpression.push(eb(a2, negatedB2, c2))
              }

              return whereExpression
            } else {
              const whereExpression = [eb(a, b, c)]
              if (b2) whereExpression.push(eb(a2, b2, c2))
              return whereExpression
            }
          }
        )
    )
  }

  private orStatementsToExpressionWrappers<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
  >(
    eb: ExpressionBuilder<any, any>,
    orStatement: WhereStatement<DB, Schema, DreamInstance['table']>
  ): ExpressionBuilder<any, any> | ExpressionWrapper<any, any, any> {
    return Object.keys(orStatement)
      .filter(key => (orStatement as any)[key] !== undefined)
      .reduce(
        (
          expressionBuilderOrWrap: ExpressionBuilder<any, any> | ExpressionWrapper<any, any, any> | null,
          attr: any
        ): ExpressionBuilder<any, any> | ExpressionWrapper<any, any, any> => {
          const val = (orStatement as any)[attr]

          if (
            (val as OpsStatement<any, any>)?.isOpsStatement &&
            (val as OpsStatement<any, any>).shouldBypassWhereStatement
          ) {
            throw new Error('Similarity operator may not be used in whereAny')
          }

          const { a, b, c, a2, b2, c2 } = this.dreamWhereStatementToExpressionBuilderParts(attr, val)

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
              return sql<boolean>`FALSE` as any
            } else {
              return (expressionBuilderOrWrap as ExpressionWrapper<any, any, any>).and(
                sql<boolean>`FALSE`
              ) as any
            }
          } else if (b === 'not in' && Array.isArray(c) && c.length === 0) {
            if (expressionBuilderOrWrap === null) {
              return sql<boolean>`TRUE` as any
            } else {
              return (expressionBuilderOrWrap as ExpressionWrapper<any, any, any>).and(
                sql<boolean>`TRUE`
              ) as any
            }
          } else {
            if (expressionBuilderOrWrap === null) {
              expressionBuilderOrWrap = eb(a, b, c)
            } else {
              expressionBuilderOrWrap = (expressionBuilderOrWrap as any).and(eb(a, b, c))
            }

            if (b2) expressionBuilderOrWrap = (expressionBuilderOrWrap as any).and(eb(a2, b2, c2))
            return expressionBuilderOrWrap as any
          }
        },
        null
      ) as ExpressionBuilder<any, any> | ExpressionWrapper<any, any, any>
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
      if ((this.passthroughWhereStatement as any)[column!] === undefined)
        throw new MissingRequiredPassthroughForAssociationWhereClause(column!)
      val = (this.passthroughWhereStatement as any)[column!]
    }

    if (val === null) {
      a = attr
      b = 'is'
      c = val
    } else if (['SelectQueryBuilder', 'SelectQueryBuilderImpl'].includes(val.constructor.name as string)) {
      a = attr
      b = 'in'
      c = val
    } else if (Array.isArray(val)) {
      a = attr
      b = 'in'

      // postgres explicitly ignores null values within an IN query, but we want to be
      // explicit about the fact that we do not support null values in an array, so
      // we compact the value.
      c = compact(val)
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

    return { a, b, c, a2, b2, c2 }
  }

  private recursivelyApplyJoinWhereStatement<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
    PreviousTableName extends AssociationTableNames<DreamInstance['dreamconf']['DB'], Schema> & keyof Schema,
  >(
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, DreamInstance['table']>, object>,
    whereJoinsStatement: RelaxedJoinsWhereStatement<DB, Schema>,
    previousAssociationTableOrAlias: TableOrAssociationName<Schema>
  ) {
    for (const key of Object.keys(whereJoinsStatement) as (
      | keyof Schema[PreviousTableName]['associations']
      | keyof Updateable<DB[PreviousTableName]>
    )[]) {
      const columnValue = (whereJoinsStatement as Updateable<DB[PreviousTableName]>)[
        key as keyof Updateable<DB[PreviousTableName]>
      ]

      if (columnValue!.constructor !== Object) {
        query = (this as any).applyWhereStatements(query, {
          [`${previousAssociationTableOrAlias}.${String(key)}`]: columnValue,
        })
      } else {
        const currentAssociationTableOrAlias = key as TableOrAssociationName<Schema>

        query = this.recursivelyApplyJoinWhereStatement(
          query,
          whereJoinsStatement[currentAssociationTableOrAlias] as any,
          currentAssociationTableOrAlias
        )
      }
    }

    return query
  }

  private buildCommon(this: Query<DreamInstance>, kyselyQuery: any) {
    this.checkForQueryViolations()

    const query = this.conditionallyApplyDefaultScopes()

    if (!isEmpty(query.joinsStatements)) {
      kyselyQuery = query.recursivelyJoin({
        query: kyselyQuery,
        joinsStatement: query.joinsStatements,
        joinsWhereStatements: query.joinsWhereStatements,
        dreamClass: query.dreamClass,
        previousAssociationTableOrAlias: this.baseSqlAlias,
      })
    }

    if (query.whereStatements.length || query.whereNotStatements.length || query.orStatements.length) {
      kyselyQuery = kyselyQuery.where((eb: ExpressionBuilder<any, any>) => {
        const whereStatement = query
          .aliasWhereStatements(query.whereStatements, query.baseSqlAlias)
          .flatMap(statement => this.whereStatementsToExpressionWrappers(eb, statement))

        const whereNotStatement = query
          .aliasWhereStatements(query.whereNotStatements, query.baseSqlAlias)
          .flatMap(statement => this.whereStatementsToExpressionWrappers(eb, statement, { negate: true }))

        const orEbs: ExpressionWrapper<any, any, any>[] = []

        if (query.orStatements.length) {
          query.orStatements.forEach(orStatement => {
            const aliasedOrStatementExpressionWrapper = query
              .aliasWhereStatements(orStatement, query.baseSqlAlias)
              .map(aliasedOrStatement => this.orStatementsToExpressionWrappers(eb, aliasedOrStatement))
            orEbs.push(eb.or(aliasedOrStatementExpressionWrapper))
          })
        }

        return eb.and(compact([...whereStatement, ...whereNotStatement, ...orEbs]))
      })
    }

    if (!isEmpty(query.joinsWhereStatements)) {
      kyselyQuery = query.recursivelyApplyJoinWhereStatement(
        kyselyQuery,
        query.joinsWhereStatements,
        query.baseSqlAlias
      )
    }

    return kyselyQuery
  }

  private checkForQueryViolations(this: Query<DreamInstance>) {
    const invalidWhereNotClauses = this.similarityStatementBuilder().whereNotStatementsWithSimilarityClauses()
    if (invalidWhereNotClauses.length) {
      const { tableName, columnName, opsStatement } = invalidWhereNotClauses[0]
      throw new CannotNegateSimilarityClause(tableName, columnName, opsStatement.value)
    }
  }

  private aliasWhereStatements(whereStatements: Readonly<WhereStatement<any, any, any>[]>, alias: string) {
    return whereStatements.map(whereStatement => {
      return Object.keys(whereStatement).reduce((aliasedWhere, key) => {
        aliasedWhere[`${alias}.${key}`] = (whereStatement as any)[key]
        return aliasedWhere
      }, {} as any)
    })
  }

  private rawifiedSelfWhereClause<
    DB extends DreamInstance['dreamconf']['DB'],
    Schema extends DreamInstance['dreamconf']['schema'],
  >({
    associationAlias,
    selfAlias,
    selfWhereClause,
  }: {
    associationAlias: string
    selfAlias: string
    selfWhereClause: WhereSelfStatement<any, DB, Schema, DreamInstance['table']>
  }) {
    const alphanumericUnderscoreRegexp = /[^a-zA-Z0-9_]/g
    selfAlias = selfAlias.replace(alphanumericUnderscoreRegexp, '')

    return Object.keys(selfWhereClause).reduce((acc, key) => {
      const selfColumn = selfWhereClause[key]?.replace(alphanumericUnderscoreRegexp, '')
      if (!selfColumn) return acc

      acc[`${associationAlias}.${key}`] = sql.raw(`"${snakeify(selfAlias)}"."${snakeify(selfColumn)}"`)
      return acc
    }, {} as any)
  }

  private buildDelete<DB extends DreamInstance['dreamconf']['DB']>(
    this: Query<DreamInstance>
  ): DeleteQueryBuilder<DB, ExtractTableAlias<DB, DreamInstance['table']>, object> {
    const kyselyQuery = this.dbFor('delete').deleteFrom(
      this.baseSqlAlias as unknown as AliasedExpression<any, any>
    )

    const results = this.attachLimitAndOrderStatementsToNonSelectQuery(kyselyQuery as any)
    return results.clone.buildCommon(results.kyselyQuery)
  }

  private buildSelect<DB extends DreamInstance['dreamconf']['DB']>(
    this: Query<DreamInstance>,
    {
      bypassSelectAll = false,
      bypassOrder = false,
    }: {
      bypassSelectAll?: boolean
      bypassOrder?: boolean
    } = {}
  ): SelectQueryBuilder<DB, ExtractTableAlias<DB, DreamInstance['table']>, object> {
    let kyselyQuery: SelectQueryBuilder<DB, any, object>

    if (this.baseSelectQuery) {
      kyselyQuery = this.baseSelectQuery.buildSelect({ bypassSelectAll: true })
    } else {
      const from =
        this.baseSqlAlias === this.dreamClass.table
          ? this.dreamClass.table
          : `${this.dreamClass.table} as ${this.baseSqlAlias}`

      kyselyQuery = this.dbFor('select').selectFrom(from as any)
    }

    if (this.distinctColumn) {
      kyselyQuery = kyselyQuery.distinctOn(this.distinctColumn as any)
    }

    kyselyQuery = this.buildCommon(kyselyQuery)

    kyselyQuery = this.conditionallyAttachSimilarityColumnsToSelect(kyselyQuery as any, {
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

    if (!bypassSelectAll) {
      kyselyQuery = kyselyQuery.selectAll(this.baseSqlAlias as ExtractTableAlias<DB, DreamInstance['table']>)
    }

    return kyselyQuery
  }

  private buildUpdate<DB extends DreamInstance['dreamconf']['DB']>(
    attributes: Updateable<DreamInstance['table']>
  ): UpdateQueryBuilder<DB, ExtractTableAlias<DB, DreamInstance['table']>, any, object> {
    let kyselyQuery = this.dbFor('update')
      .updateTable(this.dreamClass.table as DreamInstance['table'])
      .set(attributes as any)

    kyselyQuery = this.conditionallyAttachSimilarityColumnsToUpdate(kyselyQuery)

    const results = this.attachLimitAndOrderStatementsToNonSelectQuery(kyselyQuery as any)
    return results.clone.buildCommon(results.kyselyQuery)
  }

  private attachLimitAndOrderStatementsToNonSelectQuery<
    T extends Query<DreamInstance>,
    DB extends DreamInstance['dreamconf']['DB'],
    QueryType extends
      | UpdateQueryBuilder<DB, ExtractTableAlias<DB, DreamInstance['table']>, any, object>
      | DeleteQueryBuilder<DB, ExtractTableAlias<DB, DreamInstance['table']>, object>,
  >(this: T, kyselyQuery: QueryType): { kyselyQuery: QueryType; clone: T } {
    if (this.limitStatement || this.orderStatements.length) {
      kyselyQuery = (kyselyQuery as any).where((eb: any) => {
        const subquery = this.nestedSelect(this.dreamInstance.primaryKey)

        return eb(this.dreamInstance.primaryKey as any, 'in', subquery)
      }) as typeof kyselyQuery

      return {
        kyselyQuery,
        clone: this.clone({ where: null, whereNot: null, order: null, limit: null }) as T,
      }
    }

    return { kyselyQuery, clone: this }
  }

  private get hasSimilarityClauses() {
    return (this as any).similarityStatementBuilder().hasSimilarityClauses
  }

  private similarityStatementBuilder(this: Query<DreamInstance>) {
    return new SimilarityBuilder(this.dreamInstance, {
      where: [...this.whereStatements],
      whereNot: [...this.whereNotStatements],
      joinsWhereStatements: this.joinsWhereStatements,
      transaction: this.dreamTransaction,
      connection: this.connectionOverride,
    })
  }

  private conditionallyAttachSimilarityColumnsToSelect(
    this: Query<DreamInstance>,
    kyselyQuery: SelectQueryBuilder<
      DreamInstance['dreamconf']['DB'],
      ExtractTableAlias<DreamInstance['dreamconf']['DB'], DreamInstance['table']>,
      object
    >,
    { bypassOrder = false }: { bypassOrder?: boolean } = {}
  ) {
    const similarityBuilder = this.similarityStatementBuilder()
    if (similarityBuilder.hasSimilarityClauses) {
      kyselyQuery = similarityBuilder.select(kyselyQuery, { bypassOrder })
    }

    return kyselyQuery
  }

  private conditionallyAttachSimilarityColumnsToUpdate(
    this: Query<DreamInstance>,
    kyselyQuery: UpdateQueryBuilder<
      DreamInstance['dreamconf']['DB'],
      ExtractTableAlias<DreamInstance['dreamconf']['DB'], DreamInstance['table']>,
      ExtractTableAlias<any, any>,
      any
    >
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
  Schema extends DreamInstance['dreamconf']['schema'] = DreamInstance['dreamconf']['schema'],
  DB extends DreamInstance['dreamconf']['DB'] = DreamInstance['dreamconf']['DB'],
  PassthroughColumns extends
    DreamInstance['dreamconf']['passthroughColumns'] = DreamInstance['dreamconf']['passthroughColumns'],
> {
  baseSqlAlias?: TableOrAssociationName<Schema>
  baseSelectQuery?: Query<any> | null
  passthroughWhereStatement?: PassthroughWhere<PassthroughColumns> | null
  where?: readonly WhereStatement<DB, Schema, any>[] | null
  whereNot?: readonly WhereStatement<DB, Schema, any>[] | null
  limit?: LimitStatement | null
  offset?: OffsetStatement | null
  or?: WhereStatement<DB, Schema, any>[][] | null
  order?: OrderQueryStatement<ColumnType>[] | null
  preloadStatements?: RelaxedPreloadStatement
  preloadWhereStatements?: RelaxedPreloadWhereStatement<DB, Schema>
  distinctColumn?: ColumnType | null
  joinsStatements?: RelaxedJoinsStatement
  joinsWhereStatements?: RelaxedJoinsWhereStatement<DB, Schema>
  bypassAllDefaultScopes?: boolean
  bypassAllDefaultScopesExceptOnAssociations?: boolean
  bypassSpecificDefaultScopes?: string[]
  bypassSpecificDefaultScopesExceptOnAssociations?: string[]
  transaction?: DreamTransaction<Dream> | null | undefined
  connection?: DbConnectionType
  shouldReallyDestroy?: boolean
}

function getSourceAssociation(dream: Dream | typeof Dream | undefined, sourceName: string) {
  if (!dream) return
  if (!sourceName) return
  return (
    (dream as Dream)['getAssociationMetadata'](sourceName) ||
    (dream as Dream)['getAssociationMetadata'](singular(sourceName))
  )
}

interface PreloadedDreamsAndWhatTheyPointTo {
  dream: Dream
  pointsToPrimaryKey: string
}

export interface FindEachOpts {
  batchSize?: number
}
