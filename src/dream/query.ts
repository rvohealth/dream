import { ExtractTableAlias } from 'kysely/dist/cjs/parser/table-parser'
import { AssociationTableNames } from '../db/reflections'
import {
  AssociationStatement,
  LimitStatement,
  OffsetStatement,
  OrderQueryStatement,
  PassthroughWhere,
  TableColumnName,
  WhereSelfStatement,
  WhereStatement,
} from '../decorators/associations/shared'
import {
  DreamConst,
  JoinsArgumentTypeAssociatedTableNames,
  PreloadArgumentTypeAssociatedTableNames,
  NextJoinsWhereArgumentType,
  NextPreloadArgumentType,
  RelaxedPreloadStatement,
  RelaxedJoinsStatement,
  RelaxedJoinsWhereStatement,
  NextJoinsWherePluckArgumentType,
  FinalJoinsWherePluckArgumentType,
  TableOrAssociationName,
  GreaterThanOne,
  GreaterThanThree,
  GreaterThanTwo,
  GreaterThanFour,
  GreaterThanFive,
  GreaterThanSix,
  DreamTableSchema,
  DreamClassColumns,
  OrderDir,
  VariadicJoinsArgs,
  VariadicJoinsArgs2,
  VariadicJoinsArgs3,
  BruteForceVariadicJoinsArgs,
  Choose,
} from './types'
import {
  AliasedExpression,
  ComparisonOperator,
  DeleteQueryBuilder,
  SelectQueryBuilder,
  UpdateQueryBuilder,
  Updateable,
  ComparisonOperatorExpression as KyselyComparisonOperatorExpression,
  sql,
  ExpressionBuilder,
  ExpressionWrapper,
  RawBuilder,
} from 'kysely'
import { marshalDBValue } from '../helpers/marshalDBValue'
import Dream from '../dream'
import { HasManyStatement } from '../decorators/associations/has-many'
import { HasOneStatement } from '../decorators/associations/has-one'
import { BelongsToStatement } from '../decorators/associations/belongs-to'
import CannotJoinPolymorphicBelongsToError from '../exceptions/associations/cannot-join-polymorphic-belongs-to-error'
import OpsStatement from '../ops/ops-statement'
import { Range } from '../helpers/range'
import { DateTime } from 'luxon'
import DreamTransaction from './transaction'
import sqlResultToDreamInstance from './internal/sqlResultToDreamInstance'
import CurriedOpsStatement from '../ops/curried-ops-statement'
import CannotAssociateThroughPolymorphic from '../exceptions/associations/cannot-associate-through-polymorphic'
import MissingThroughAssociation from '../exceptions/associations/missing-through-association'
import MissingThroughAssociationSource from '../exceptions/associations/missing-through-association-source'
import JoinAttemptedOnMissingAssociation from '../exceptions/associations/join-attempted-with-missing-association'
import { singular } from 'pluralize'
import isEmpty from 'lodash.isempty'
import executeDatabaseQuery from './internal/executeDatabaseQuery'
import { DbConnectionType } from '../db/types'
import NoUpdateAllOnAssociationQuery from '../exceptions/no-updateall-on-association-query'
import { isObject, isString } from '../helpers/typechecks'
import CannotNegateSimilarityClause from '../exceptions/cannot-negate-similarity-clause'
import SimilarityBuilder from './internal/similarity/SimilarityBuilder'
import ConnectedToDB from '../db/ConnectedToDB'
import SimilarityOperatorNotSupportedOnDestroyQueries from '../exceptions/similarity-operator-not-supported-on-destroy-queries'
import cloneDeepSafe from '../helpers/cloneDeepSafe'
import protectAgainstPollutingAssignment from '../helpers/protectAgainstPollutingAssignment'
import associationToGetterSetterProp from '../decorators/associations/associationToGetterSetterProp'
import compact from '../helpers/compact'
import snakeify from '../helpers/snakeify'
import LoadIntoModels from './internal/associations/load-into-models'
import { allNestedObjectKeys } from '../helpers/allNestedObjectKeys'
import { extractValueFromJoinsPluckResponse } from './internal/extractValueFromJoinsPluckResponse'
import MissingRequiredCallbackFunctionToPluckEach from '../exceptions/missing-required-callback-function-to-pluck-each'
import CannotPassAdditionalFieldsToPluckEachAfterCallback from '../exceptions/cannot-pass-additional-fields-to-pluck-each-after-callback-function'
import NoUpdateAllOnJoins from '../exceptions/no-updateall-on-joins'
import orderByDirection from './internal/orderByDirection'
import { Path } from './dotpathtypes'

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

export default class Query<
  DreamClass extends typeof Dream,
  DreamInstance extends InstanceType<DreamClass> = InstanceType<DreamClass>,
  DB extends DreamInstance['DB'] = DreamInstance['DB'],
  SyncedAssociations extends DreamInstance['syncedAssociations'] = DreamInstance['syncedAssociations'],
  AllColumns extends DreamInstance['allColumns'] = DreamInstance['allColumns'],
  ColumnType extends DreamClassColumns<DreamClass> = DreamClassColumns<DreamClass>,
> extends ConnectedToDB<DreamClass> {
  public static readonly BATCH_SIZES = {
    FIND_EACH: 1000,
    PLUCK_EACH: 10000,
    PLUCK_EACH_THROUGH: 1000,
  }

  public dreamTransaction: DreamTransaction<Dream> | null = null

  private readonly passthroughWhereStatement: PassthroughWhere<AllColumns> = Object.freeze({})
  private readonly whereStatements: readonly WhereStatement<DB, SyncedAssociations, any>[] = Object.freeze([])
  private readonly whereNotStatements: readonly WhereStatement<DB, SyncedAssociations, any>[] = Object.freeze(
    []
  )
  private readonly limitStatement: LimitStatement | null
  private readonly offsetStatement: OffsetStatement | null
  private readonly orStatements: readonly WhereStatement<DB, SyncedAssociations, any>[][] = Object.freeze([])
  private readonly orderStatements: readonly OrderQueryStatement<ColumnType>[] = Object.freeze([])
  private readonly preloadStatements: RelaxedPreloadStatement = Object.freeze({})
  private readonly joinsStatements: RelaxedJoinsStatement = Object.freeze({})
  private readonly joinsWhereStatements: RelaxedJoinsWhereStatement<DB, SyncedAssociations> = Object.freeze(
    {}
  )
  private readonly bypassDefaultScopes: boolean = false
  private readonly distinctColumn: ColumnType | null = null
  private baseSqlAlias: TableOrAssociationName<SyncedAssociations>
  private baseSelectQuery: Query<any> | null

  constructor(DreamClass: DreamClass, opts: QueryOpts<DreamClass, ColumnType> = {}) {
    super(DreamClass, opts)
    this.baseSqlAlias = opts.baseSqlAlias || this.dreamClass.prototype['table']
    this.baseSelectQuery = opts.baseSelectQuery || null
    this.passthroughWhereStatement = Object.freeze(opts.passthroughWhereStatement || {})
    this.whereStatements = Object.freeze(opts.where || [])
    this.whereNotStatements = Object.freeze(opts.whereNot || [])
    this.limitStatement = Object.freeze(opts.limit || null)
    this.offsetStatement = Object.freeze(opts.offset || null)
    this.orStatements = Object.freeze(opts.or || [])
    this.orderStatements = Object.freeze(opts.order || [])
    this.preloadStatements = Object.freeze(opts.preloadStatements || {})
    this.joinsStatements = Object.freeze(opts.joinsStatements || {})
    this.joinsWhereStatements = Object.freeze(opts.joinsWhereStatements || {})
    this.bypassDefaultScopes = Object.freeze(opts.bypassDefaultScopes || false)
    this.dreamTransaction = opts.transaction || null
    this.distinctColumn = opts.distinctColumn || null
    this.connectionOverride = opts.connection
  }

  public get isDreamQuery() {
    return true
  }

  private symmetricalQueryForDreamClass<D extends typeof Dream>(
    this: Query<DreamClass, DreamInstance, DB, SyncedAssociations, AllColumns, ColumnType>,
    dreamClass: D
  ): Query<D> {
    const associationQuery: Query<D> = (
      this.bypassDefaultScopes ? dreamClass.unscoped() : dreamClass.query()
    ).clone({ passthroughWhereStatement: this.passthroughWhereStatement })
    return this.dreamTransaction ? associationQuery.txn(this.dreamTransaction) : associationQuery
  }

  public clone(
    opts: QueryOpts<DreamClass, ColumnType> = {}
  ): Query<DreamClass, DreamInstance, DB, SyncedAssociations, AllColumns, ColumnType> {
    return new Query<DreamClass, DreamInstance, DB, SyncedAssociations, AllColumns, ColumnType>(
      this.dreamClass,
      {
        baseSqlAlias: opts.baseSqlAlias || this.baseSqlAlias,
        baseSelectQuery: opts.baseSelectQuery || this.baseSelectQuery,
        passthroughWhereStatement: Object.freeze({
          ...this.passthroughWhereStatement,
          ...(opts.passthroughWhereStatement || {}),
        }),
        where: opts.where === null ? [] : Object.freeze([...this.whereStatements, ...(opts.where || [])]),
        whereNot:
          opts.whereNot === null ? [] : Object.freeze([...this.whereNotStatements, ...(opts.whereNot || [])]),
        limit:
          opts.limit === null ? null : opts.limit !== undefined ? opts.limit : this.limitStatement || null,
        offset:
          opts.limit === null || opts.offset === null
            ? null
            : opts.offset !== undefined
              ? opts.offset
              : this.offsetStatement || null,
        or: opts.or === null ? [] : [...this.orStatements, ...(opts.or || [])],
        order: opts.order === null ? [] : [...this.orderStatements, ...(opts.order || [])],

        distinctColumn: opts.distinctColumn !== undefined ? opts.distinctColumn : this.distinctColumn,

        // when passed, preloadStatements, joinsStatements, and joinsWhereStatements are already
        // cloned versions of the `this.` versions, handled in the `preload` and `joins` methods
        preloadStatements: opts.preloadStatements || this.preloadStatements,
        joinsStatements: opts.joinsStatements || this.joinsStatements,
        joinsWhereStatements: opts.joinsWhereStatements || this.joinsWhereStatements,
        // end:when passed, preloadStatements, joinsStatements, and joinsWhereStatements are already...

        bypassDefaultScopes:
          opts.bypassDefaultScopes !== undefined ? opts.bypassDefaultScopes : this.bypassDefaultScopes,
        transaction: opts.transaction || this.dreamTransaction,
        connection: opts.connection,
      }
    )
  }

  public async find<
    TableName extends
      keyof InstanceType<DreamClass>['dreamconf']['interpretedDB'] = InstanceType<DreamClass>['table'] &
      keyof InstanceType<DreamClass>['dreamconf']['interpretedDB'],
  >(
    id: InstanceType<DreamClass>['dreamconf']['interpretedDB'][TableName][DreamClass['primaryKey'] &
      keyof InstanceType<DreamClass>['dreamconf']['interpretedDB'][TableName]]
  ): Promise<(InstanceType<DreamClass> & Dream) | null> {
    if (!id) return null

    return await this.where({
      [this.dreamClass.primaryKey]: id,
    } as any).first()
  }

  public async findBy(
    attributes: WhereStatement<DB, SyncedAssociations, InstanceType<DreamClass>['table']>
  ): Promise<(InstanceType<DreamClass> & Dream) | null> {
    return await this.where(attributes).first()
  }

  public async findEach(
    cb: (instance: InstanceType<DreamClass>) => void | Promise<void>,
    { batchSize = Query.BATCH_SIZES.FIND_EACH }: { batchSize?: number } = {}
  ): Promise<void> {
    let offset = 0
    let records: any[]

    do {
      records = (await this.offset(offset).limit(batchSize).all()) as DreamInstance[]

      for (const record of records) {
        await cb(record)
      }

      offset += batchSize
    } while (records.length > 0 && records.length === batchSize)
  }

  // //**
  //  *
  //  * @param this
  //  * @param models
  //  * @param a
  //  * @param b
  //  * @param c
  //  * @param d
  //  * @param e
  //  * @param f
  //  * @param g
  //  * @returns
  //  */
  public async loadInto<
    TableName extends InstanceType<DreamClass>['table'],
    //
    A extends NextPreloadArgumentType<SyncedAssociations, TableName>,
    ATableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, TableName, A>,
    B extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanOne
      ? NextPreloadArgumentType<SyncedAssociations, ATableName>
      : any,
    BTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanOne
      ? PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, ATableName, B>
      : never,
    C extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanTwo
      ? NextPreloadArgumentType<SyncedAssociations, BTableName>
      : any,
    CTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanTwo
      ? PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, BTableName, C>
      : never,
    D extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanThree
      ? NextPreloadArgumentType<SyncedAssociations, CTableName>
      : any,
    DTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanThree
      ? PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, CTableName, D>
      : never,
    E extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFour
      ? NextPreloadArgumentType<SyncedAssociations, DTableName>
      : any,
    ETableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFour
      ? PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, DTableName, E>
      : never,
    F extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFive
      ? NextPreloadArgumentType<SyncedAssociations, ETableName>
      : any,
    FTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFive
      ? PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, ETableName, F>
      : never,
    G extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanSix
      ? NextPreloadArgumentType<SyncedAssociations, FTableName>
      : any,
  >(models: Dream[], a: A, b?: B, c?: C, d?: D, e?: E, f?: F, g?: G) {
    const query = this.preload(a as any, b as any, c as any, d as any, e as any, f as any, g as any)
    await new LoadIntoModels<DreamClass>(query.preloadStatements, query.passthroughWhereStatement).loadInto(
      models
    )
  }

  public preload<
    TableName extends InstanceType<DreamClass>['table'],
    //
    A extends NextPreloadArgumentType<SyncedAssociations, TableName>,
    ATableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, TableName, A>,
    B extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanOne
      ? NextPreloadArgumentType<SyncedAssociations, ATableName>
      : any,
    BTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanOne
      ? PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, ATableName, B>
      : never,
    C extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanTwo
      ? NextPreloadArgumentType<SyncedAssociations, BTableName>
      : any,
    CTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanTwo
      ? PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, BTableName, C>
      : never,
    D extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanThree
      ? NextPreloadArgumentType<SyncedAssociations, CTableName>
      : any,
    DTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanThree
      ? PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, CTableName, D>
      : never,
    E extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFour
      ? NextPreloadArgumentType<SyncedAssociations, DTableName>
      : any,
    ETableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFour
      ? PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, DTableName, E>
      : never,
    F extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFive
      ? NextPreloadArgumentType<SyncedAssociations, ETableName>
      : any,
    FTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFive
      ? PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, ETableName, F>
      : never,
    G extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanSix
      ? NextPreloadArgumentType<SyncedAssociations, FTableName>
      : any,
  >(a: A, b?: B, c?: C, d?: D, e?: E, f?: F, g?: G) {
    const preloadStatements = cloneDeepSafe(this.preloadStatements)

    this.fleshOutPreloadStatements(preloadStatements, [a, b, c, d, e, f, g])

    return this.clone({ preloadStatements })
  }

  private fleshOutPreloadStatements(
    preloadStatements: RelaxedPreloadStatement,
    associationStatements: (string | string[] | undefined)[]
  ) {
    const nextAssociationStatement = associationStatements.shift()

    if (nextAssociationStatement === undefined) {
      // just satisfying typing
    } else if (isString(nextAssociationStatement)) {
      const nextStatement = nextAssociationStatement as string

      if (!preloadStatements[nextStatement])
        preloadStatements[protectAgainstPollutingAssignment(nextStatement)] = {}
      const nextPreload = preloadStatements[nextStatement] as any

      this.fleshOutPreloadStatements(nextPreload, associationStatements)
    } else if (Array.isArray(nextAssociationStatement)) {
      const nextStatement = nextAssociationStatement

      nextStatement.forEach(associationStatement => {
        preloadStatements[protectAgainstPollutingAssignment(associationStatement)] = {}
      })
    }
  }

  public joinsExperiment<
    TableName extends InstanceType<DreamClass>['table'],
    SyncedAssociations extends InstanceType<DreamClass>['syncedAssociations'],
    const Str extends string,
  >(args: Str & Path<SyncedAssociations, TableName>) {}

  public joins<
    TableName extends InstanceType<DreamClass>['table'],
    SyncedAssociations extends InstanceType<DreamClass>['syncedAssociations'],
    ConstArr extends readonly [...any[]],
    // ConstArr extends readonly [keyof SyncedAssociations[TableName] & string, ...any[]],
    // Arr extends readonly [...ConstArr],
    const Arr extends readonly any[] = [...ConstArr, any],
  >(...args: ConstArr & VariadicJoinsArgs<DB, SyncedAssociations, TableName, ConstArr>) {
    const joinsStatements = cloneDeepSafe(this.joinsStatements)

    const joinsWhereStatements: RelaxedJoinsWhereStatement<DB, SyncedAssociations> = cloneDeepSafe(
      this.joinsWhereStatements
    )
    this.fleshOutJoinsStatements(joinsStatements, joinsWhereStatements, null, args as any)

    return this.clone({ joinsStatements, joinsWhereStatements })
  }

  private fleshOutJoinsStatements(
    joinsStatements: RelaxedPreloadStatement,
    joinsWhereStatements: RelaxedJoinsWhereStatement<DB, SyncedAssociations>,
    previousAssociationName: null | string,
    associationStatements: (string | WhereStatement<DB, SyncedAssociations, any> | undefined)[]
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
        SyncedAssociations
      >

      this.fleshOutJoinsStatements(
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

      this.fleshOutJoinsStatements(
        joinsStatements,
        joinsWhereStatements,
        previousAssociationName,
        associationStatements
      )
    }
  }

  public async pluckThrough<
    TableName extends InstanceType<DreamClass>['table'],
    //
    A extends keyof SyncedAssociations[TableName] & string,
    ATableName extends (SyncedAssociations[TableName][A & keyof SyncedAssociations[TableName]] &
      string[])[number],
    //
    B extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanOne
      ? NextJoinsWherePluckArgumentType<DB, SyncedAssociations, A, A, ATableName>
      : any,
    BTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanOne
      ? JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ATableName, B>
      : never,
    C extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanTwo
      ? NextJoinsWherePluckArgumentType<DB, SyncedAssociations, B, A, BTableName>
      : any,
    CTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanTwo
      ? JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, BTableName, C>
      : never,
    D extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanThree
      ? CTableName extends never
        ? never
        : NextJoinsWherePluckArgumentType<DB, SyncedAssociations, C, B, CTableName>
      : any,
    DTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanThree
      ? CTableName extends never
        ? never
        : JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, CTableName, D>
      : never,
    E extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFour
      ? DTableName extends never
        ? never
        : NextJoinsWherePluckArgumentType<DB, SyncedAssociations, D, C, DTableName>
      : any,
    ETableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFour
      ? DTableName extends never
        ? never
        : JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, DTableName, E>
      : never,
    F extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFive
      ? ETableName extends never
        ? never
        : NextJoinsWherePluckArgumentType<DB, SyncedAssociations, E, D, ETableName>
      : any,
    FTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFive
      ? ETableName extends never
        ? never
        : JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ETableName, F>
      : never,
    //
    G extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanSix
      ? FTableName extends never
        ? never
        : FinalJoinsWherePluckArgumentType<DB, SyncedAssociations, F, E, FTableName>
      : any,
  >(a: A, b: B, c?: C, d?: D, e?: E, f?: F, g?: G): Promise<any[]> {
    const joinsStatements = cloneDeepSafe(this.joinsStatements)

    const joinsWhereStatements: RelaxedJoinsWhereStatement<DB, SyncedAssociations> = cloneDeepSafe(
      this.joinsWhereStatements
    )
    const pluckStatement = [
      this.fleshOutPluckThroughStatements(joinsStatements, joinsWhereStatements, null, [
        a,
        b as any,
        c,
        d,
        e,
        f,
        g,
      ]),
    ].flat() as any[]

    const vals = await this.clone({ joinsStatements, joinsWhereStatements }).pluckWithoutMarshalling(
      ...pluckStatement
    )

    const associationNamesToDreamClasses = this.pluckThroughStatementsToDreamClassesMap([
      a,
      b as any,
      c,
      d,
      e,
      f,
      g,
    ])

    const mapFn = (val: any, index: number) => {
      return extractValueFromJoinsPluckResponse(
        val,
        index,
        pluckStatement,
        this.dreamClass,
        associationNamesToDreamClasses
      )
    }

    const response = this.pluckValuesToPluckResponse(pluckStatement, vals, mapFn)
    return response
  }

  public async pluckEachThrough<
    TableName extends InstanceType<DreamClass>['table'],
    CB extends (data: any) => void | Promise<void>,
    //
    A extends keyof SyncedAssociations[TableName] & string,
    ATableName extends (SyncedAssociations[TableName][A & keyof SyncedAssociations[TableName]] &
      string[])[number],
    //
    B extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanOne
      ? NextJoinsWherePluckArgumentType<DB, SyncedAssociations, A, A, ATableName>
      : any,
    BTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanOne
      ? JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ATableName, B>
      : never,
    C extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanTwo
      ? NextJoinsWherePluckArgumentType<DB, SyncedAssociations, B, A, BTableName>
      : any,
    CTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanTwo
      ? JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, BTableName, C>
      : never,
    D extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanThree
      ? CTableName extends never
        ? never
        : NextJoinsWherePluckArgumentType<DB, SyncedAssociations, C, B, CTableName>
      : any,
    DTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanThree
      ? CTableName extends never
        ? never
        : JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, CTableName, D>
      : never,
    E extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFour
      ? DTableName extends never
        ? never
        : NextJoinsWherePluckArgumentType<DB, SyncedAssociations, D, C, DTableName>
      : any,
    ETableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFour
      ? DTableName extends never
        ? never
        : JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, DTableName, E>
      : never,
    F extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFive
      ? ETableName extends never
        ? never
        : NextJoinsWherePluckArgumentType<DB, SyncedAssociations, E, D, ETableName>
      : any,
    FTableName extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanFive
      ? ETableName extends never
        ? never
        : JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ETableName, F>
      : never,
    //
    G extends InstanceType<DreamClass>['maxAssociationTypeDepth'] extends GreaterThanSix
      ? FTableName extends never
        ? never
        : FinalJoinsWherePluckArgumentType<DB, SyncedAssociations, F, E, FTableName>
      : any,
  >(
    a: A,
    b: B | CB | FindEachOpts,
    c?: C | CB | FindEachOpts,
    d?: D | CB | FindEachOpts,
    e?: E | CB | FindEachOpts,
    f?: F | CB | FindEachOpts,
    g?: G | CB | FindEachOpts,
    cb?: CB | FindEachOpts,
    opts?: FindEachOpts
  ): Promise<void> {
    const allOpts = [a, b, c, d, e, f, g, cb, opts]
    const providedCbIndex = allOpts.findIndex(v => typeof v === 'function')
    const providedCb = allOpts[providedCbIndex] as CB
    const providedOpts = allOpts[providedCbIndex + 1] as FindEachOpts

    if (!providedCb)
      throw new MissingRequiredCallbackFunctionToPluckEach('pluckEachThrough', compact(allOpts))
    if (providedOpts !== undefined && !providedOpts?.batchSize)
      throw new CannotPassAdditionalFieldsToPluckEachAfterCallback('pluckEachThrough', compact(allOpts))

    const batchSize = providedOpts?.batchSize || Query.BATCH_SIZES.PLUCK_EACH_THROUGH

    const joinsStatements = cloneDeepSafe(this.joinsStatements)

    const joinsWhereStatements: RelaxedJoinsWhereStatement<DB, SyncedAssociations> = cloneDeepSafe(
      this.joinsWhereStatements
    )

    const fieldArgs = [a, b as any, c, d, e, f, g]
    const onlyColumns: any = fieldArgs.filter((_, index) => index < providedCbIndex)

    const pluckStatement = [
      this.fleshOutPluckThroughStatements(joinsStatements, joinsWhereStatements, null, onlyColumns),
    ].flat() as any[]

    const associationNamesToDreamClasses = this.pluckThroughStatementsToDreamClassesMap(fieldArgs)

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
        .offset(offset)
        .limit(batchSize)
        .pluckWithoutMarshalling(...pluckStatement)
      const plucked = this.pluckValuesToPluckResponse(pluckStatement, results, mapFn)

      for (const data of plucked) {
        await providedCb(data)
      }

      offset += batchSize
    } while (results.length > 0 && results.length === batchSize)
  }

  private pluckThroughStatementsToDreamClassesMap(
    associationStatements: (
      | string
      | WhereStatement<DB, SyncedAssociations, any>
      // TODO: once we find a way to consolidate join types,
      // using dot util helpers being developed over there.
      // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
      | `${any}.${any}`
      | `${any}.${any}`[]
      | undefined
    )[]
  ): { [key: string]: typeof Dream } {
    const joinsStatements = {}
    this.fleshOutPluckThroughStatements(joinsStatements, {}, null, associationStatements)
    const associations = allNestedObjectKeys(joinsStatements)
    return this.associationsToDreamClassesMap(associations)
  }

  private associationsToDreamClassesMap(associationNames: string[]) {
    const associationsToDreamClassesMap: { [key: string]: typeof Dream } = {}

    associationNames.reduce((dreamClass: typeof Dream, associationName: string) => {
      const association = dreamClass.getAssociation(associationName)
      const through = (association as any).through

      if (through) {
        const throughAssociation = dreamClass.getAssociation(through)
        const throughAssociationDreamClass = throughAssociation.modelCB() as typeof Dream
        associationsToDreamClassesMap[through] = throughAssociationDreamClass
      }

      const nextDreamClass = association.modelCB() as typeof Dream
      associationsToDreamClassesMap[associationName] = nextDreamClass
      return nextDreamClass
    }, this.dreamClass)

    return associationsToDreamClassesMap
  }

  private fleshOutPluckThroughStatements(
    joinsStatements: RelaxedPreloadStatement,
    joinsWhereStatements: RelaxedJoinsWhereStatement<DB, SyncedAssociations>,
    previousAssociationName: null | string,
    associationStatements: (
      | string
      | WhereStatement<DB, SyncedAssociations, any>
      // TODO: once we find a way to consolidate join types,
      // using dot util helpers being developed over there.
      // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
      | `${any}.${any}`
      | `${any}.${any}`[]
      | undefined
    )[]
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
        SyncedAssociations
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

  private setBaseSQLAlias(baseSqlAlias: TableOrAssociationName<SyncedAssociations>) {
    return this.clone({ baseSqlAlias })
  }

  private setBaseSelectQuery(baseSelectQuery: Query<any> | null) {
    return this.clone({ baseSelectQuery })
  }

  public unscoped(): Query<DreamClass, DreamInstance, DB, SyncedAssociations, AllColumns, ColumnType> {
    return this.clone({ bypassDefaultScopes: true, baseSelectQuery: this.baseSelectQuery?.unscoped() })
  }

  public passthrough(passthroughWhereStatement: PassthroughWhere<AllColumns>) {
    return this.clone({ passthroughWhereStatement })
  }

  public where(
    attributes: WhereStatement<DB, SyncedAssociations, InstanceType<DreamClass>['table']>
  ): Query<DreamClass, DreamInstance, DB, SyncedAssociations, AllColumns, ColumnType> {
    return this._where(attributes, 'where')
  }

  public whereAny(
    attributes: WhereStatement<DB, SyncedAssociations, InstanceType<DreamClass>['table']>[]
  ): Query<DreamClass, DreamInstance, DB, SyncedAssociations, AllColumns, ColumnType> {
    return this.clone({
      or: [attributes.map(obj => ({ ...obj }))],
    })
  }

  public whereNot(
    attributes: WhereStatement<DB, SyncedAssociations, InstanceType<DreamClass>['table']>
  ): Query<DreamClass, DreamInstance, DB, SyncedAssociations, AllColumns, ColumnType> {
    return this._where(attributes, 'whereNot')
  }

  private _where(
    attributes: WhereStatement<DB, SyncedAssociations, InstanceType<DreamClass>['table']>,
    typeOfWhere: 'where' | 'whereNot'
  ): Query<DreamClass, DreamInstance, DB, SyncedAssociations, AllColumns, ColumnType> {
    return this.clone({
      [typeOfWhere]: [{ ...attributes }],
    })
  }

  public nestedSelect<SimpleFieldType extends keyof DreamClassColumns<DreamClass>, PluckThroughFieldType>(
    this: Query<DreamClass, DreamInstance, DB, SyncedAssociations, AllColumns, ColumnType>,
    selection: SimpleFieldType | PluckThroughFieldType
  ) {
    const query = this.buildSelect({ bypassSelectAll: true, bypassOrder: true }) as SelectQueryBuilder<
      any,
      any,
      any
    >

    return query.select(this.namespaceColumn(selection as any))
  }

  public order(
    arg: ColumnType | Partial<Record<ColumnType, OrderDir>> | null
  ): Query<DreamClass, DreamInstance, DB, SyncedAssociations, AllColumns, ColumnType> {
    if (arg === null) return this.clone({ order: null })
    if (isString(arg)) return this.clone({ order: [{ column: arg as any, direction: 'asc' }] })

    let query = this.clone()

    Object.keys(arg).forEach(key => {
      const column = key as ColumnType
      const direction = (arg as any)[key] as OrderDir

      query = query.clone({
        order: [{ column: column as any, direction }],
      })
    })

    return query
  }

  public limit(limit: number | null) {
    return this.clone({ limit })
  }

  public offset(offset: number | null) {
    return this.clone({ offset })
  }

  public sql() {
    const kyselyQuery = this.buildSelect()
    return kyselyQuery.compile()
  }

  // TODO: in the future, we should support insert type, but don't yet, since inserts are done outside
  // the query class for some reason.
  public toKysely<
    QueryType extends 'select' | 'delete' | 'update',
    ToKyselyReturnType = QueryType extends 'select'
      ? SelectQueryBuilder<DreamInstance['DB'], DreamInstance['table'], any>
      : QueryType extends 'delete'
        ? DeleteQueryBuilder<DreamInstance['DB'], DreamInstance['table'], any>
        : QueryType extends 'update'
          ? UpdateQueryBuilder<DreamInstance['DB'], DreamInstance['table'], DreamInstance['table'], any>
          : never,
  >(type: QueryType) {
    switch (type) {
      case 'select':
        return this.buildSelect() as ToKyselyReturnType

      case 'delete':
        return this.buildDelete() as ToKyselyReturnType

      case 'update':
        return this.buildUpdate({}) as ToKyselyReturnType

      default:
        throw new Error('never')
    }
  }

  public txn(dreamTransaction: DreamTransaction<Dream>) {
    return this.clone({ transaction: dreamTransaction })
  }

  public async count() {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { count } = this.dbFor('select').fn
    const distinctColumn = this.distinctColumn
    const query = this.clone({ distinctColumn: null })

    let kyselyQuery = query.buildSelect({ bypassSelectAll: true, bypassOrder: true })

    const countClause = distinctColumn
      ? count(sql`DISTINCT ${distinctColumn}`)
      : count(query.namespaceColumn(query.dreamClass.primaryKey))

    kyselyQuery = kyselyQuery.select(countClause.as('tablecount'))

    const data = await executeDatabaseQuery(kyselyQuery, 'executeTakeFirstOrThrow')

    return parseInt(data.tablecount.toString())
  }

  public distinct(
    column:
      | TableColumnName<
          InstanceType<DreamClass>['dreamconf']['DB'],
          InstanceType<DreamClass>['dreamconf']['syncedAssociations'],
          InstanceType<DreamClass>['table']
        >
      | boolean = true
  ) {
    if (column === true) {
      return this.clone({ distinctColumn: this.namespaceColumn(this.dreamClass.primaryKey) as ColumnType })
    } else if (column === false) {
      return this.clone({ distinctColumn: null })
    } else {
      return this.clone({ distinctColumn: this.namespaceColumn(column) as ColumnType })
    }
  }

  private namespaceColumn(column: string) {
    if (column.includes('.')) return column
    return `${this.baseSqlAlias}.${column}`
  }

  public async max<PluckThroughFieldType>(field: ColumnType | PluckThroughFieldType) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { max } = this.dbFor('select').fn
    let kyselyQuery = this.buildSelect({ bypassSelectAll: true, bypassOrder: true })

    kyselyQuery = kyselyQuery.select(max(field as any) as any)

    const data = await executeDatabaseQuery(kyselyQuery, 'executeTakeFirstOrThrow')

    return data.max
  }

  public async min<PluckThroughFieldType>(field: ColumnType | PluckThroughFieldType) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { min } = this.dbFor('select').fn
    let kyselyQuery = this.buildSelect({ bypassSelectAll: true, bypassOrder: true })

    kyselyQuery = kyselyQuery.select(min(field as any) as any)
    const data = await executeDatabaseQuery(kyselyQuery, 'executeTakeFirstOrThrow')

    return data.min
  }

  private async pluckWithoutMarshalling(...fields: DreamClassColumns<DreamClass>[]): Promise<any[]> {
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

  public async pluck<TableName extends DreamInstance['table']>(
    ...fields: (ColumnType | `${TableName}.${ColumnType}`)[]
  ): Promise<any[]> {
    const vals = await this.pluckWithoutMarshalling(...fields)

    const mapFn = (val: any, index: number) => marshalDBValue(this.dreamClass, fields[index] as any, val)
    return this.pluckValuesToPluckResponse(fields, vals, mapFn)
  }

  public async pluckEach<
    TableName extends DreamInstance['table'],
    CB extends (plucked: any) => void | Promise<void>,
  >(...fields: (ColumnType | `${TableName}.${ColumnType}` | CB | FindEachOpts)[]): Promise<void> {
    const providedCbIndex = fields.findIndex(v => typeof v === 'function')
    const providedCb = fields[providedCbIndex] as CB
    const providedOpts = fields[providedCbIndex + 1] as FindEachOpts

    if (!providedCb) throw new MissingRequiredCallbackFunctionToPluckEach('pluckEach', fields)
    if (providedOpts !== undefined && !providedOpts?.batchSize)
      throw new CannotPassAdditionalFieldsToPluckEachAfterCallback('pluckEach', fields)

    const onlyColumns = fields.filter(
      (_, index) => index < providedCbIndex
    ) as DreamClassColumns<DreamClass>[]

    const batchSize = providedOpts?.batchSize || Query.BATCH_SIZES.PLUCK_EACH_THROUGH

    const mapFn = (val: any, index: number) => marshalDBValue(this.dreamClass, fields[index] as any, val)

    let offset = 0
    let records: any[]
    do {
      records = await this.offset(offset)
        .limit(batchSize)
        .pluckWithoutMarshalling(...onlyColumns)

      const vals = this.pluckValuesToPluckResponse(onlyColumns, records, mapFn)
      for (const val of vals) {
        await providedCb(val)
      }

      offset += batchSize
    } while (records.length > 0 && records.length === batchSize)
  }

  private pluckValuesToPluckResponse(fields: any[], vals: any[], mapFn: (value: any, index: number) => any) {
    if (fields.length > 1) {
      return vals.map(arr => arr.map(mapFn))
    } else {
      return vals.flat().map(val => mapFn(val, 0))
    }
  }

  public async all() {
    const kyselyQuery = this.buildSelect()

    const results = await executeDatabaseQuery(kyselyQuery, 'execute')

    const theAll = results.map(r =>
      sqlResultToDreamInstance(this.dreamClass, r)
    ) as InstanceType<DreamClass>[]

    await this.applyPreload(this.preloadStatements as any, theAll)

    return theAll
  }

  protected connection(
    connection: DbConnectionType
  ): Query<DreamClass, DreamInstance, DB, SyncedAssociations, AllColumns, ColumnType> {
    return this.clone({ connection })
  }

  public async exists(): Promise<boolean> {
    // Implementing via `limit(1).all()`, rather than the simpler `!!(await this.first())`
    // because it avoids the step of finding the first. Just find any, and return
    // that one.
    return (await this.limit(1).all()).length > 0
  }

  public async first() {
    const query = this.orderStatements.length
      ? this
      : this.order({ [this.dreamClass.primaryKey as any]: 'asc' } as any)
    return await query.takeOne()
  }

  private async takeOne() {
    const kyselyQuery = this.buildSelect()
    const results = await executeDatabaseQuery(kyselyQuery, 'executeTakeFirst')

    if (results) {
      const theFirst = sqlResultToDreamInstance(this.dreamClass, results) as InstanceType<DreamClass>

      if (theFirst) await this.applyPreload(this.preloadStatements as any, [theFirst])

      return theFirst
    } else return null
  }

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

  private followThroughAssociation(
    dreamClass: typeof Dream,
    association: HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>
  ) {
    const throughAssociation = association.through && dreamClass.getAssociation(association.through)
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
  private async preloadPolymorphicBelongsTo(
    this: Query<DreamClass, DreamInstance, DB, SyncedAssociations, AllColumns, ColumnType>,
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

        const loadedAssociations = await this.symmetricalQueryForDreamClass(associatedModel)
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

  private async applyOnePreload(
    this: Query<DreamClass, DreamInstance, DB, SyncedAssociations, AllColumns, ColumnType>,
    associationName: string,
    dreams: Dream | Dream[]
  ) {
    if (!Array.isArray(dreams)) dreams = [dreams] as Dream[]

    const dream = dreams.find(dream => dream.getAssociation(associationName))!
    if (!dream) return

    const association = dream.getAssociation(associationName)
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
      asHasAssociation.preloadThroughColumns.forEach(preloadThroughColumn => {
        throughColumnsToHydrate.push(preloadThroughColumn)
        columnsToPluck.push(`${asHasAssociation.through}.${preloadThroughColumn}`)
      })
    }

    columnsToPluck.push(`${dreamClass.prototype.table}.${dreamClass.primaryKey}`)

    const baseClass = dreamClass['stiBaseClassOrOwnClass'].getAssociation(associationName)
      ? dreamClass['stiBaseClassOrOwnClass']
      : dreamClass

    const hydrationData: any[][] = await this.symmetricalQueryForDreamClass(baseClass)
      .where({ [dreamClass.primaryKey]: dreams.map(obj => obj.primaryKeyValue) })
      .pluckThrough(associationName, columnsToPluck)

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

  private async hydratePreload(
    this: Query<DreamClass, DreamInstance, DB, SyncedAssociations, AllColumns, ColumnType>,
    dream: Dream
  ) {
    await this.applyPreload(this.preloadStatements as any, dream)
  }

  private async applyPreload(
    this: Query<DreamClass, DreamInstance, DB, SyncedAssociations, AllColumns, ColumnType>,
    preloadStatement: RelaxedPreloadStatement,
    dream: Dream | Dream[]
  ) {
    const keys = Object.keys(preloadStatement as any)

    for (const key of keys) {
      const nestedDreams = await this.applyOnePreload(key, dream)
      if (nestedDreams) {
        await this.applyPreload((preloadStatement as any)[key], nestedDreams)
      }
    }
  }

  public async last() {
    const query = this.orderStatements.length
      ? this.invertOrder()
      : this.order({ [this.dreamClass.primaryKey as any]: 'desc' } as any)

    return await query.takeOne()
  }

  public async destroy(): Promise<number> {
    const deletionResult = await executeDatabaseQuery(this.buildDelete(), 'executeTakeFirst')
    return Number(deletionResult?.numDeletedRows || 0)
  }

  public async destroyBy(attributes: Updateable<InstanceType<DreamClass>['table']>) {
    const query = this.where(attributes as any)

    if (query.hasSimilarityClauses) {
      throw new SimilarityOperatorNotSupportedOnDestroyQueries(this.dreamClass, attributes)
    }

    return query.destroy()
  }

  public async updateAll(attributes: DreamTableSchema<InstanceType<DreamClass>>) {
    if (this.baseSelectQuery) throw new NoUpdateAllOnAssociationQuery()
    if (Object.keys(this.joinsStatements).length) throw new NoUpdateAllOnJoins()

    const kyselyQuery = this.buildUpdate(attributes)
    const res = await executeDatabaseQuery(kyselyQuery, 'execute')
    const resultData = Array.from(res.entries())?.[0]?.[1]

    return Number(resultData?.numUpdatedRows || 0)
  }

  private conditionallyApplyScopes(): Query<
    DreamClass,
    DreamInstance,
    DB,
    SyncedAssociations,
    AllColumns,
    ColumnType
  > {
    if (this.bypassDefaultScopes) return this

    const thisScopes = this.dreamClass['scopes'].default
    let query: Query<DreamClass, DreamInstance, DB, SyncedAssociations, AllColumns, ColumnType> = this
    for (const scope of thisScopes) {
      query = (this.dreamClass as any)[scope.method](query)
    }

    return query
  }

  // Through associations don't get written into the SQL; they
  // locate the next association we need to build into the SQL
  // AND the source to reference on the other side
  private joinsBridgeThroughAssociations({
    query,
    dreamClass,
    association,
    previousAssociationTableOrAlias,
  }: {
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, object>
    dreamClass: typeof Dream
    association:
      | HasOneStatement<any, any, any, any>
      | HasManyStatement<any, any, any, any>
      | BelongsToStatement<any, any, any, any>
    previousAssociationTableOrAlias: TableOrAssociationName<InstanceType<DreamClass>['syncedAssociations']>
  }): {
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, object>
    dreamClass: typeof Dream
    association:
      | HasOneStatement<any, any, any, any>
      | HasManyStatement<any, any, any, any>
      | BelongsToStatement<any, any, any, any>
    throughClass?: typeof Dream | null
    previousAssociationTableOrAlias: TableOrAssociationName<InstanceType<DreamClass>['syncedAssociations']>
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
        currentAssociationTableOrAlias: association.through as TableOrAssociationName<
          InstanceType<DreamClass>['syncedAssociations']
        >,
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
          previousAssociationTableOrAlias: throughAssociation.as as TableOrAssociationName<
            InstanceType<DreamClass>['syncedAssociations']
          >,
        })
      } else {
        // This new association is not a through association, so
        // this is the target association we were looking for
        return {
          query: queryWithThroughAssociationApplied,
          dreamClass: association.modelCB(),
          association: newAssociation,
          throughClass,
          previousAssociationTableOrAlias: association.through as TableOrAssociationName<
            InstanceType<DreamClass>['syncedAssociations']
          >,
        }
      }
    }
  }

  private applyOneJoin({
    query,
    dreamClass,
    previousAssociationTableOrAlias,
    currentAssociationTableOrAlias,
    originalAssociation,
  }: {
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, object>
    dreamClass: typeof Dream
    previousAssociationTableOrAlias: TableOrAssociationName<InstanceType<DreamClass>['syncedAssociations']>
    currentAssociationTableOrAlias: TableOrAssociationName<InstanceType<DreamClass>['syncedAssociations']>
    originalAssociation?: HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>
  }): {
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, object>
    association: any
    previousAssociationTableOrAlias: TableOrAssociationName<InstanceType<DreamClass>['syncedAssociations']>
    currentAssociationTableOrAlias: TableOrAssociationName<InstanceType<DreamClass>['syncedAssociations']>
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

    let association = dreamClass.getAssociation(currentAssociationTableOrAlias)
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

      const to = (association.modelCB() as typeof Dream).prototype.table
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
      const to = association.modelCB().prototype.table
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
            [association.where as WhereStatement<DB, SyncedAssociations, InstanceType<DreamClass>['table']>],
            currentAssociationTableOrAlias
          )
        )
      }

      if (association.whereNot) {
        query = this.applyWhereStatements(
          query,
          this.aliasWhereStatements(
            [
              association.whereNot as WhereStatement<
                DB,
                SyncedAssociations,
                InstanceType<DreamClass>['table']
              >,
            ],
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

    if (!this.bypassDefaultScopes) {
      let scopesQuery = new Query<DreamClass, DreamInstance, DB, SyncedAssociations, AllColumns, ColumnType>(
        this.dreamClass
      )
      const associationClass = association.modelCB() as any
      const associationScopes = associationClass.scopes.default

      for (const scope of associationScopes) {
        const tempQuery = associationClass[scope.method](scopesQuery)
        if (tempQuery && tempQuery.constructor === this.constructor) scopesQuery = tempQuery
      }

      query = this.applyWhereStatements(
        query,
        this.aliasWhereStatements(scopesQuery.whereStatements, currentAssociationTableOrAlias)
      )
    }

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

  private recursivelyJoin({
    query,
    joinsStatement,
    dreamClass,
    previousAssociationTableOrAlias,
  }: {
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, object>
    joinsStatement: RelaxedJoinsWhereStatement<DB, SyncedAssociations>
    dreamClass: typeof Dream
    previousAssociationTableOrAlias: TableOrAssociationName<InstanceType<DreamClass>['syncedAssociations']>
  }): SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, object> {
    for (const currentAssociationTableOrAlias of Object.keys(joinsStatement) as TableOrAssociationName<
      InstanceType<DreamClass>['syncedAssociations']
    >[]) {
      const results = this.applyOneJoin({
        query,
        dreamClass,
        previousAssociationTableOrAlias,
        currentAssociationTableOrAlias,
      })

      query = results.query
      const association = results.association as AssociationStatement

      query = this.recursivelyJoin({
        query,
        joinsStatement: joinsStatement[currentAssociationTableOrAlias] as any,

        dreamClass: association.modelCB() as typeof Dream,
        previousAssociationTableOrAlias: currentAssociationTableOrAlias,
      })
    }

    return query
  }

  private applyWhereStatements<
    WS extends WhereStatement<DB, SyncedAssociations, InstanceType<DreamClass>['table']>,
  >(
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, object>,
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

  private applyOrderStatementForAssociation({
    query,
    tableNameOrAlias,
    association,
  }: {
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, object>
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

  private applySingleWhereStatement(
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, object>,
    whereStatement: WhereStatement<DB, SyncedAssociations, InstanceType<DreamClass>['table']>,
    {
      negate = false,
    }: {
      negate?: boolean
    } = {}
  ) {
    Object.keys(whereStatement)
      .filter(key => (whereStatement as any)[key] !== undefined)
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

  private whereStatementsToExpressionWrappers(
    eb: ExpressionBuilder<any, any>,
    whereStatement: WhereStatement<DB, SyncedAssociations, InstanceType<DreamClass>['table']>,
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

  private orStatementsToExpressionWrappers(
    eb: ExpressionBuilder<any, any>,
    orStatement: WhereStatement<DB, SyncedAssociations, InstanceType<DreamClass>['table']>
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
    }

    if (val === DreamConst.passthrough) {
      const column = attr.split('.').pop()
      a = attr
      b = '='
      c = (this.passthroughWhereStatement as any)[column!]
    } else if (val === null) {
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
    } else if (val.constructor === CurriedOpsStatement) {
      val = val.toOpsStatement(this.dreamClass, attr)
      a = attr
      b = val.operator
      c = val.value
    } else if (val.constructor === OpsStatement) {
      a = attr
      b = val.operator as KyselyComparisonOperatorExpression
      c = val.value
    } else if (val.constructor === Range) {
      let rangeStart = null
      let rangeEnd = null

      if ((val.begin?.constructor || val.end?.constructor) === DateTime) {
        rangeStart = val.begin?.toJSDate()
        rangeEnd = val.end?.toJSDate()
      } else if ((val.begin?.constructor || val.end?.constructor) === Number) {
        rangeStart = val.begin
        rangeEnd = val.end
      }

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

    return { a, b, c, a2, b2, c2 }
  }

  private recursivelyApplyJoinWhereStatement<
    PreviousTableName extends AssociationTableNames<
      InstanceType<DreamClass>['DB'],
      InstanceType<DreamClass>['syncedAssociations']
    > &
      keyof InstanceType<DreamClass>['syncedAssociations'],
  >(
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, object>,
    whereJoinsStatement: RelaxedJoinsWhereStatement<DB, SyncedAssociations>,
    previousAssociationTableOrAlias: TableOrAssociationName<InstanceType<DreamClass>['syncedAssociations']>
  ) {
    for (const key of Object.keys(whereJoinsStatement) as (
      | keyof InstanceType<DreamClass>['syncedAssociations'][PreviousTableName]
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
        const currentAssociationTableOrAlias = key as TableOrAssociationName<
          InstanceType<DreamClass>['syncedAssociations']
        >

        query = this.recursivelyApplyJoinWhereStatement<any>(
          query,
          whereJoinsStatement[currentAssociationTableOrAlias] as any,
          currentAssociationTableOrAlias
        )
      }
    }

    return query
  }

  private buildCommon(kyselyQuery: any) {
    this.checkForQueryViolations()

    const query = this.conditionallyApplyScopes()

    if (!isEmpty(query.joinsStatements)) {
      kyselyQuery = query.recursivelyJoin({
        query: kyselyQuery,
        joinsStatement: query.joinsStatements,
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

  private checkForQueryViolations() {
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

  private rawifiedSelfWhereClause({
    associationAlias,
    selfAlias,
    selfWhereClause,
  }: {
    associationAlias: string
    selfAlias: string
    selfWhereClause: WhereSelfStatement<any, DB, SyncedAssociations, InstanceType<DreamClass>['table']>
  }) {
    const alphanumericUnderscoreRegexp = /[^a-zA-Z0-9_]/g
    selfAlias = selfAlias.replaceAll(alphanumericUnderscoreRegexp, '')

    return Object.keys(selfWhereClause).reduce((acc, key) => {
      const selfColumn = selfWhereClause[key]?.replaceAll(alphanumericUnderscoreRegexp, '')
      if (!selfColumn) return acc

      acc[`${associationAlias}.${key}`] = sql.raw(`"${snakeify(selfAlias)}"."${snakeify(selfColumn)}"`)
      return acc
    }, {} as any)
  }

  private buildDelete(): DeleteQueryBuilder<
    DB,
    ExtractTableAlias<DB, InstanceType<DreamClass>['table']>,
    object
  > {
    const kyselyQuery = this.dbFor('delete').deleteFrom(
      this.baseSqlAlias as unknown as AliasedExpression<any, any>
    )

    const results = this.attachLimitAndOrderStatementsToNonSelectQuery(kyselyQuery as any)
    return results.clone.buildCommon(results.kyselyQuery)
  }

  private buildSelect({
    bypassSelectAll = false,
    bypassOrder = false,
  }: {
    bypassSelectAll?: boolean
    bypassOrder?: boolean
  } = {}): SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, object> {
    let kyselyQuery: SelectQueryBuilder<DB, any, object>

    if (this.baseSelectQuery) {
      kyselyQuery = this.baseSelectQuery.buildSelect({ bypassSelectAll: true })
    } else {
      const from =
        this.baseSqlAlias === this.dreamClass.prototype.table
          ? this.dreamClass.prototype.table
          : `${this.dreamClass.prototype.table} as ${this.baseSqlAlias}`

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
      kyselyQuery = kyselyQuery.selectAll(
        this.baseSqlAlias as ExtractTableAlias<DB, InstanceType<DreamClass>['table']>
      )
    }

    return kyselyQuery
  }

  private buildUpdate(
    attributes: Updateable<InstanceType<DreamClass>['table']>
  ): UpdateQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, any, object> {
    let kyselyQuery = this.dbFor('update')
      .updateTable(this.dreamClass.prototype.table as InstanceType<DreamClass>['table'])
      .set(attributes as any)

    kyselyQuery = this.conditionallyAttachSimilarityColumnsToUpdate(kyselyQuery)

    const results = this.attachLimitAndOrderStatementsToNonSelectQuery(kyselyQuery as any)
    return results.clone.buildCommon(results.kyselyQuery)
  }

  private attachLimitAndOrderStatementsToNonSelectQuery<
    T extends Query<DreamClass, DreamInstance, DB, SyncedAssociations, AllColumns, ColumnType>,
    QueryType extends
      | UpdateQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, any, object>
      | DeleteQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, object>,
  >(this: T, kyselyQuery: QueryType): { kyselyQuery: QueryType; clone: T } {
    if (this.limitStatement || this.orderStatements.length) {
      kyselyQuery = (kyselyQuery as any).where((eb: any) => {
        const subquery = this.nestedSelect(this.dreamClass.primaryKey)

        return eb(this.dreamClass.primaryKey as any, 'in', subquery)
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

  private similarityStatementBuilder() {
    return new SimilarityBuilder(this.dreamClass, {
      where: [...this.whereStatements],
      whereNot: [...this.whereNotStatements],
      joinsWhereStatements: this.joinsWhereStatements,
      transaction: this.dreamTransaction,
      connection: this.connectionOverride,
    })
  }

  private conditionallyAttachSimilarityColumnsToSelect(
    kyselyQuery: SelectQueryBuilder<
      InstanceType<DreamClass>['DB'],
      ExtractTableAlias<InstanceType<DreamClass>['DB'], InstanceType<DreamClass>['table']>,
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
    kyselyQuery: UpdateQueryBuilder<
      InstanceType<DreamClass>['DB'],
      ExtractTableAlias<InstanceType<DreamClass>['DB'], InstanceType<DreamClass>['table']>,
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
  DreamClass extends typeof Dream,
  ColumnType extends DreamClassColumns<DreamClass>,
  DreamInstance extends InstanceType<DreamClass> = InstanceType<DreamClass>,
  DB extends DreamInstance['DB'] = DreamInstance['DB'],
  SyncedAssociations extends DreamInstance['syncedAssociations'] = DreamInstance['syncedAssociations'],
  AllColumns extends DreamInstance['allColumns'] = DreamInstance['allColumns'],
> {
  baseSqlAlias?: TableOrAssociationName<InstanceType<DreamClass>['syncedAssociations']>
  baseSelectQuery?: Query<any> | null
  passthroughWhereStatement?: PassthroughWhere<AllColumns> | null
  where?: readonly WhereStatement<DB, SyncedAssociations, any>[] | null
  whereNot?: readonly WhereStatement<DB, SyncedAssociations, any>[] | null
  limit?: LimitStatement | null
  offset?: OffsetStatement | null
  or?: WhereStatement<DB, SyncedAssociations, any>[][] | null
  order?: OrderQueryStatement<ColumnType>[] | null
  preloadStatements?: RelaxedPreloadStatement
  distinctColumn?: ColumnType | null
  joinsStatements?: RelaxedJoinsStatement
  joinsWhereStatements?: RelaxedJoinsWhereStatement<DB, SyncedAssociations>
  bypassDefaultScopes?: boolean
  transaction?: DreamTransaction<Dream> | null | undefined
  connection?: DbConnectionType
}

function getSourceAssociation(dream: Dream | typeof Dream | undefined, sourceName: string) {
  if (!dream) return
  if (!sourceName) return
  return (dream as Dream).getAssociation(sourceName) || (dream as Dream).getAssociation(singular(sourceName))
}

interface PreloadedDreamsAndWhatTheyPointTo {
  dream: Dream
  pointsToPrimaryKey: string
}

export interface FindEachOpts {
  batchSize?: number
}
