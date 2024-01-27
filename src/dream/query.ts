import { ExtractTableAlias } from 'kysely/dist/cjs/parser/table-parser'
import { AssociationTableNames } from '../db/reflections'
import {
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
} from './types'
import {
  AliasedExpression,
  ComparisonOperator,
  DeleteQueryBuilder,
  DeleteResult,
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
import cloneDeep from 'lodash.clonedeep'
import protectAgainstPollutingAssignment from '../helpers/protectAgainstPollutingAssignment'
import associationToGetterSetterProp from '../decorators/associations/associationToGetterSetterProp'
import compact from '../helpers/compact'
import snakeify from '../../shared/helpers/snakeify'
import LoadIntoModels from './internal/associations/load-into-models'
import { allNestedObjectKeys } from '../helpers/allNestedObjectKeys'
import { extractValueFromJoinsPluckResponse } from './internal/extractValueFromJoinsPluckResponse'
import MissingRequiredCallbackFunctionToPluckEach from '../exceptions/missing-required-callback-function-to-pluck-each'
import CannotPassAdditionalFieldsToPluckEachAfterCallback from '../exceptions/cannot-pass-additional-fields-to-pluck-each-after-callback-function'

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
}

export default class Query<
  DreamClass extends typeof Dream,
  DreamInstance extends InstanceType<DreamClass> = InstanceType<DreamClass>,
  DB extends DreamInstance['DB'] = DreamInstance['DB'],
  DBTypeCache extends DreamInstance['dreamconf']['dbTypeCache'] = DreamInstance['dreamconf']['dbTypeCache'],
  SyncedAssociations extends DreamInstance['syncedAssociations'] = DreamInstance['syncedAssociations'],
  AllColumns extends DreamInstance['allColumns'] = DreamInstance['allColumns'],
  Table extends DB[DreamInstance['table']] = DB[DreamInstance['table']],
  ColumnType extends keyof InstanceType<DreamClass>['DB'][keyof InstanceType<DreamClass>['DB']] extends never
    ? unknown
    : keyof InstanceType<DreamClass>['DB'][keyof InstanceType<DreamClass>['DB']] = keyof InstanceType<DreamClass>['DB'][keyof InstanceType<DreamClass>['DB']] extends never
    ? unknown
    : keyof InstanceType<DreamClass>['DB'][keyof InstanceType<DreamClass>['DB']]
> extends ConnectedToDB<DreamClass> {
  public static readonly BATCH_SIZES = {
    FIND_EACH: 1000,
    PLUCK_EACH: 10000,
    PLUCK_EACH_THROUGH: 1000,
  }

  public readonly dreamClass: DreamClass
  public dreamTransaction: DreamTransaction<DB> | null = null
  public connectionOverride?: DbConnectionType

  private readonly passthroughWhereStatement: PassthroughWhere<AllColumns> = Object.freeze({})
  private readonly whereStatements: readonly WhereStatement<DB, SyncedAssociations, any>[] = Object.freeze([])
  private readonly whereNotStatements: readonly WhereStatement<DB, SyncedAssociations, any>[] = Object.freeze(
    []
  )
  private readonly limitStatement: LimitStatement | null
  private readonly offsetStatement: OffsetStatement | null
  private readonly orStatements: readonly WhereStatement<DB, SyncedAssociations, any>[] = Object.freeze([])
  private readonly orderStatement: OrderQueryStatement<ColumnType> | null = null
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
    this.dreamClass = DreamClass
    this.baseSqlAlias = opts.baseSqlAlias || this.dreamClass.prototype['table']
    this.baseSelectQuery = opts.baseSelectQuery || null
    this.passthroughWhereStatement = Object.freeze(opts.passthroughWhereStatement || {})
    this.whereStatements = Object.freeze(opts.where || [])
    this.whereNotStatements = Object.freeze(opts.whereNot || [])
    this.limitStatement = Object.freeze(opts.limit || null)
    this.offsetStatement = Object.freeze(opts.offset || null)
    this.orStatements = Object.freeze(opts.or || [])
    this.orderStatement = Object.freeze(opts.order || null)
    this.preloadStatements = Object.freeze(opts.preloadStatements || {})
    this.joinsStatements = Object.freeze(opts.joinsStatements || {})
    this.joinsWhereStatements = Object.freeze(opts.joinsWhereStatements || {})
    this.bypassDefaultScopes = Object.freeze(opts.bypassDefaultScopes || false)
    this.dreamTransaction = opts.transaction || null
    this.distinctColumn = opts.distinctColumn || null
    this.connectionOverride = opts.connection
  }

  private symmetricalQueryForDreamClass<D extends typeof Dream>(
    this: Query<DreamClass>,
    dreamClass: D
  ): Query<D> {
    const associationQuery: Query<D> = (
      this.bypassDefaultScopes ? dreamClass.unscoped() : dreamClass.query()
    ).clone({ passthroughWhereStatement: this.passthroughWhereStatement })
    return this.dreamTransaction ? associationQuery.txn(this.dreamTransaction) : associationQuery
  }

  public clone(opts: QueryOpts<DreamClass, ColumnType> = {}): Query<DreamClass> {
    return new Query(this.dreamClass, {
      baseSqlAlias: opts.baseSqlAlias || this.baseSqlAlias,
      baseSelectQuery: opts.baseSelectQuery || this.baseSelectQuery,
      passthroughWhereStatement: Object.freeze({
        ...this.passthroughWhereStatement,
        ...(opts.passthroughWhereStatement || {}),
      }),
      where: opts.where === null ? [] : Object.freeze([...this.whereStatements, ...(opts.where || [])]),
      whereNot:
        opts.whereNot === null ? [] : Object.freeze([...this.whereNotStatements, ...(opts.whereNot || [])]),
      limit: opts.limit !== undefined ? opts.limit : this.limitStatement || null,
      offset: opts.offset !== undefined ? opts.offset : this.offsetStatement || null,
      or: opts.or === null ? [] : [...this.orStatements, ...(opts.or || [])],
      order: opts.order !== undefined ? opts.order : this.orderStatement || null,
      distinctColumn: (opts.distinctColumn !== undefined
        ? opts.distinctColumn
        : this.distinctColumn) as ColumnType | null,

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
    }) as Query<DreamClass>
  }

  public async find<
    T extends Query<DreamClass>,
    TableName extends keyof InstanceType<DreamClass>['dreamconf']['interpretedDB'] = InstanceType<DreamClass>['table'] &
      keyof InstanceType<DreamClass>['dreamconf']['interpretedDB']
  >(
    this: T,
    id: InstanceType<DreamClass>['dreamconf']['interpretedDB'][TableName][DreamClass['primaryKey'] &
      keyof InstanceType<DreamClass>['dreamconf']['interpretedDB'][TableName]]
  ): Promise<(InstanceType<DreamClass> & Dream) | null> {
    if (!id) return null
    // @ts-ignore
    return await this.where({
      [this.dreamClass.primaryKey]: id,
    }).first()
  }

  public async findBy<T extends Query<DreamClass>>(
    this: T,
    attributes: WhereStatement<DB, SyncedAssociations, InstanceType<DreamClass>['table']>
  ): Promise<(InstanceType<DreamClass> & Dream) | null> {
    return await this.where(attributes).first()
  }

  public async findEach<T extends Query<DreamClass>>(
    this: T,
    cb: (instance: InstanceType<DreamClass>) => void | Promise<void>,
    { batchSize = Query.BATCH_SIZES.FIND_EACH }: { batchSize?: number } = {}
  ): Promise<void> {
    let offset = 0
    let records: any[]

    do {
      records = await this.offset(offset).limit(batchSize).all()

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
    T extends Query<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    SyncedAssociations extends InstanceType<DreamClass>['syncedAssociations'],
    //
    A extends NextPreloadArgumentType<SyncedAssociations, TableName>,
    ATableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, TableName, A>,
    B extends NextPreloadArgumentType<SyncedAssociations, ATableName>,
    BTableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, ATableName, B>,
    C extends NextPreloadArgumentType<SyncedAssociations, BTableName>,
    CTableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, BTableName, C>,
    D extends NextPreloadArgumentType<SyncedAssociations, CTableName>,
    DTableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, CTableName, D>,
    E extends NextPreloadArgumentType<SyncedAssociations, DTableName>,
    ETableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, DTableName, E>,
    F extends NextPreloadArgumentType<SyncedAssociations, ETableName>,
    FTableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, ETableName, F>,
    G extends NextPreloadArgumentType<SyncedAssociations, FTableName>
  >(this: T, models: Dream[], a: A, b?: B, c?: C, d?: D, e?: E, f?: F, g?: G) {
    const query = this.preload(a as any, b as any, c as any, d as any, e as any, f as any, g as any)
    await new LoadIntoModels<DreamClass>(query.preloadStatements, query.passthroughWhereStatement).loadInto(
      models
    )
  }

  public preload<
    T extends Query<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    SyncedAssociations extends InstanceType<DreamClass>['syncedAssociations'],
    //
    A extends NextPreloadArgumentType<SyncedAssociations, TableName>,
    ATableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, TableName, A>,
    B extends NextPreloadArgumentType<SyncedAssociations, ATableName>,
    BTableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, ATableName, B>,
    C extends NextPreloadArgumentType<SyncedAssociations, BTableName>,
    CTableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, BTableName, C>,
    D extends NextPreloadArgumentType<SyncedAssociations, CTableName>,
    DTableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, CTableName, D>,
    E extends NextPreloadArgumentType<SyncedAssociations, DTableName>,
    ETableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, DTableName, E>,
    F extends NextPreloadArgumentType<SyncedAssociations, ETableName>,
    FTableName extends PreloadArgumentTypeAssociatedTableNames<SyncedAssociations, ETableName, F>,
    G extends NextPreloadArgumentType<SyncedAssociations, FTableName>
  >(this: T, a: A, b?: B, c?: C, d?: D, e?: E, f?: F, g?: G) {
    const preloadStatements = { ...this.preloadStatements }
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
      const nextPreload = preloadStatements[nextStatement]
      this.fleshOutPreloadStatements(nextPreload, associationStatements)
    } else if (Array.isArray(nextAssociationStatement)) {
      const nextStatement = nextAssociationStatement as string[]

      nextStatement.forEach(associationStatement => {
        preloadStatements[protectAgainstPollutingAssignment(associationStatement)] = {}
      })
    }
  }

  public joins<
    T extends Query<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    DB extends InstanceType<DreamClass>['DB'],
    SyncedAssociations extends InstanceType<DreamClass>['syncedAssociations'],
    //
    A extends keyof SyncedAssociations[TableName] & string,
    ATableName extends (SyncedAssociations[TableName][A & keyof SyncedAssociations[TableName]] &
      string[])[number],
    //
    B extends NextJoinsWhereArgumentType<DB, SyncedAssociations, ATableName>,
    BTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ATableName, B>,
    C extends NextJoinsWhereArgumentType<DB, SyncedAssociations, BTableName>,
    CTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, BTableName, C>,
    D extends NextJoinsWhereArgumentType<DB, SyncedAssociations, CTableName>,
    DTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, CTableName, D>,
    E extends NextJoinsWhereArgumentType<DB, SyncedAssociations, DTableName>,
    ETableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, DTableName, E>,
    F extends NextJoinsWhereArgumentType<DB, SyncedAssociations, ETableName>,
    FTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ETableName, F>,
    G extends NextJoinsWhereArgumentType<DB, SyncedAssociations, FTableName>
  >(this: T, a: A, b?: B, c?: C, d?: D, e?: E, f?: F, g?: G) {
    const joinsStatements = { ...this.joinsStatements }

    const joinsWhereStatements: RelaxedJoinsWhereStatement<DB, SyncedAssociations> = {
      ...this.joinsWhereStatements,
    }
    this.fleshOutJoinsStatements(joinsStatements, joinsWhereStatements, null, [a, b, c, d, e, f, g])
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
        nextJoinsStatements,
        nextJoinsWhereStatements,
        nextStatement,
        associationStatements
      )
    } else if (isObject(nextAssociationStatement) && previousAssociationName) {
      const clonedNextAssociationStatement = cloneDeep(nextAssociationStatement)

      Object.keys(clonedNextAssociationStatement).forEach((key: string) => {
        joinsWhereStatements[protectAgainstPollutingAssignment(key)] = (
          clonedNextAssociationStatement as any
        )[key]
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
    T extends Query<DreamClass>,
    DB extends InstanceType<DreamClass>['DB'],
    SyncedAssociations extends InstanceType<DreamClass>['syncedAssociations'],
    TableName extends InstanceType<DreamClass>['table'],
    //
    A extends keyof SyncedAssociations[TableName] & string,
    ATableName extends (SyncedAssociations[TableName][A & keyof SyncedAssociations[TableName]] &
      string[])[number],
    //
    B extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, A, A, ATableName>,
    BTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ATableName, B>,
    C extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, B, A, BTableName>,
    CTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, BTableName, C>,
    D extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, C, B, CTableName>,
    DTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, CTableName, D>,
    E extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, D, C, DTableName>,
    ETableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, DTableName, E>,
    F extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, E, D, ETableName>,
    FTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ETableName, F>,
    //
    G extends FinalJoinsWherePluckArgumentType<DB, SyncedAssociations, F, E, FTableName>
  >(this: T, a: A, b: B, c?: C, d?: D, e?: E, f?: F, g?: G) {
    const joinsStatements = { ...this.joinsStatements }

    const joinsWhereStatements: RelaxedJoinsWhereStatement<DB, SyncedAssociations> = {
      ...this.joinsWhereStatements,
    }
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
    T extends Query<DreamClass>,
    DB extends InstanceType<DreamClass>['DB'],
    SyncedAssociations extends InstanceType<DreamClass>['syncedAssociations'],
    TableName extends InstanceType<DreamClass>['table'],
    CB extends (data: any | any[]) => void | Promise<void>,
    //
    A extends keyof SyncedAssociations[TableName] & string,
    ATableName extends (SyncedAssociations[TableName][A & keyof SyncedAssociations[TableName]] &
      string[])[number],
    //
    B extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, A, A, ATableName>,
    BTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ATableName, B>,
    C extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, B, A, BTableName>,
    CTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, BTableName, C>,
    D extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, C, B, CTableName>,
    DTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, CTableName, D>,
    E extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, D, C, DTableName>,
    ETableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, DTableName, E>,
    F extends NextJoinsWherePluckArgumentType<DB, SyncedAssociations, E, D, ETableName>,
    FTableName extends JoinsArgumentTypeAssociatedTableNames<DB, SyncedAssociations, ETableName, F>,
    //
    G extends FinalJoinsWherePluckArgumentType<DB, SyncedAssociations, F, E, FTableName>
  >(
    this: T,
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

    const joinsStatements = { ...this.joinsStatements }

    const joinsWhereStatements: RelaxedJoinsWhereStatement<DB, SyncedAssociations> = {
      ...this.joinsWhereStatements,
    }

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
        nextJoinsStatements,
        nextJoinsWhereStatements,
        nextStatement,
        associationStatements
      )
    } else if (isObject(nextAssociationStatement) && previousAssociationName) {
      const clonedNextAssociationStatement = cloneDeep(nextAssociationStatement)

      Object.keys(clonedNextAssociationStatement).forEach((key: string) => {
        joinsWhereStatements[protectAgainstPollutingAssignment(key)] = (
          clonedNextAssociationStatement as any
        )[key]
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

  public unscoped<T extends Query<DreamClass>>(this: T): Query<DreamClass> {
    return this.clone({ bypassDefaultScopes: true, baseSelectQuery: this.baseSelectQuery?.unscoped() })
  }

  public passthrough(passthroughWhereStatement: PassthroughWhere<AllColumns>) {
    return this.clone({ passthroughWhereStatement })
  }

  public where<T extends Query<DreamClass>>(
    this: T,
    attributes: WhereStatement<DB, SyncedAssociations, InstanceType<DreamClass>['table']>
  ): Query<DreamClass> {
    return this._where(attributes, 'where')
  }

  public whereAny<T extends Query<DreamClass>>(
    this: T,
    attributes: WhereStatement<DB, SyncedAssociations, InstanceType<DreamClass>['table']>[]
  ): Query<DreamClass> {
    return this.clone({
      or: attributes.map(obj => ({ ...obj })),
    })
  }

  public whereNot<T extends Query<DreamClass>>(
    this: T,
    attributes: WhereStatement<DB, SyncedAssociations, InstanceType<DreamClass>['table']>
  ): Query<DreamClass> {
    return this._where(attributes, 'whereNot')
  }

  private _where<T extends Query<DreamClass>>(
    this: T,
    attributes: WhereStatement<DB, SyncedAssociations, InstanceType<DreamClass>['table']>,
    typeOfWhere: 'where' | 'whereNot'
  ): Query<DreamClass> {
    return this.clone({
      [typeOfWhere]: [{ ...attributes }],
    })
  }

  public nestedSelect<
    T extends Query<DreamClass>,
    DB extends InstanceType<DreamClass>['DB'],
    TableName extends InstanceType<DreamClass>['table'],
    SimpleFieldType extends keyof Updateable<DB[TableName]>,
    PluckThroughFieldType extends any
    // PluckThroughFieldType extends PluckThroughAssociationExpression<
    //   InstanceType<DreamClass>['table'],
    //   T['joinsStatements'][number]
    // >
  >(this: T, selection: SimpleFieldType | PluckThroughFieldType) {
    let query = this.buildSelect({ bypassSelectAll: true }) as SelectQueryBuilder<
      DB,
      ExtractTableAlias<DB, TableName>,
      any
    >

    query = this.conditionallyAttachSimilarityColumnsToSelect(query as any, { includeGroupBy: false }) as any

    return query.select(selection as any)
  }

  public order<ColumnName extends keyof Table & string>(
    column: ColumnName,
    direction: 'asc' | 'desc' = 'asc'
  ) {
    return this.clone({
      order: { column: this.namespaceColumn(column) as any, direction },
    })
  }

  public limit(limit: number) {
    return this.clone({ limit })
  }

  public offset(offset: number) {
    return this.clone({ offset })
  }

  public sql() {
    const kyselyQuery = this.buildSelect()
    return kyselyQuery.compile()
  }

  // TODO: in the future, we should support insert type, but don't yet, since inserts are done outside
  // the query class for some reason.
  public toKysely<
    T extends Query<DreamClass>,
    QueryType extends 'select' | 'delete' | 'update',
    ToKyselyReturnType = QueryType extends 'select'
      ? SelectQueryBuilder<any, string, {}>
      : QueryType extends 'delete'
      ? DeleteQueryBuilder<any, string, {}>
      : QueryType extends 'update'
      ? UpdateQueryBuilder<any, string, any, {}>
      : never
  >(this: T, type: QueryType): ToKyselyReturnType {
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

  public txn(dreamTransaction: DreamTransaction<DreamClass>) {
    return this.clone({ transaction: dreamTransaction })
  }

  public async count<T extends Query<DreamClass>>(this: T) {
    const { count } = this.dbFor('select').fn
    let kyselyQuery = this.buildSelect({ bypassSelectAll: true, bypassOrder: true })

    kyselyQuery = kyselyQuery.select(count(this.namespaceColumn(this.dreamClass.primaryKey)).as('tablecount'))

    kyselyQuery = this.conditionallyAttachSimilarityColumnsToSelect(kyselyQuery, { includeGroupBy: true })

    const data = (await executeDatabaseQuery(kyselyQuery, 'executeTakeFirstOrThrow')) as any

    return parseInt(data.tablecount.toString())
  }

  public distinct<T extends Query<DreamClass>>(
    this: T,
    column:
      | TableColumnName<
          InstanceType<DreamClass>['dreamconf']['DB'],
          InstanceType<DreamClass>['dreamconf']['syncedAssociations'],
          InstanceType<DreamClass>['table']
        >
      | boolean = true
  ) {
    if (column === true) {
      return this.clone({ distinctColumn: this.namespaceColumn(this.dreamClass.primaryKey) })
    } else if (column === false) {
      return this.clone({ distinctColumn: null })
    } else {
      return this.clone({ distinctColumn: this.namespaceColumn(column) })
    }
  }

  private namespaceColumn(column: string) {
    if (column.includes('.')) return column
    return `${this.baseSqlAlias}.${column}`
  }

  public async max<
    T extends Query<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    SimpleFieldType extends keyof Updateable<DB[TableName]>,
    PluckThroughFieldType extends any
  >(this: T, field: SimpleFieldType | PluckThroughFieldType) {
    const { max } = this.dbFor('select').fn
    let kyselyQuery = this.buildSelect({ bypassSelectAll: true })

    kyselyQuery = kyselyQuery.select(max(field as any) as any)
    kyselyQuery = this.conditionallyAttachSimilarityColumnsToSelect(kyselyQuery, { includeGroupBy: true })

    const data = (await executeDatabaseQuery(kyselyQuery, 'executeTakeFirstOrThrow')) as any

    return data.max
  }

  public async min<
    T extends Query<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    SimpleFieldType extends keyof Updateable<DB[TableName]>,
    PluckThroughFieldType extends any
  >(this: T, field: SimpleFieldType | PluckThroughFieldType) {
    const { min } = this.dbFor('select').fn
    let kyselyQuery = this.buildSelect({ bypassSelectAll: true })

    kyselyQuery = kyselyQuery.select(min(field as any) as any)
    kyselyQuery = this.conditionallyAttachSimilarityColumnsToSelect(kyselyQuery, { includeGroupBy: true })
    const data = (await executeDatabaseQuery(kyselyQuery, 'executeTakeFirstOrThrow')) as any

    return data.min
  }

  private async pluckWithoutMarshalling<
    T extends Query<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    SimpleFieldType extends keyof Updateable<DB[TableName]> & string,
    TablePrefixedFieldType extends `${TableName}.${SimpleFieldType}`
  >(this: T, ...fields: (SimpleFieldType | TablePrefixedFieldType)[]): Promise<any[]> {
    let kyselyQuery = this.buildSelect({ bypassSelectAll: true })
    const aliases: string[] = []

    fields.forEach((field: string, index: number) => {
      const alias = `dr${index}`
      aliases.push(alias)
      kyselyQuery = kyselyQuery.select(`${field} as ${alias}` as any)
    })

    kyselyQuery = this.conditionallyAttachSimilarityColumnsToSelect(kyselyQuery)

    return (await executeDatabaseQuery(kyselyQuery, 'execute')).map(singleResult =>
      aliases.map(alias => singleResult[alias])
    )
  }

  public async pluck<
    T extends Query<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    SimpleFieldType extends keyof Updateable<DB[TableName]> & string,
    TablePrefixedFieldType extends `${TableName}.${SimpleFieldType}`
  >(this: T, ...fields: (SimpleFieldType | TablePrefixedFieldType)[]): Promise<any[]> {
    const vals = await this.pluckWithoutMarshalling(...fields)
    const mapFn = (val: any, index: number) => marshalDBValue(this.dreamClass, fields[index] as any, val)
    return this.pluckValuesToPluckResponse(fields, vals, mapFn)
  }

  public async pluckEach<
    T extends Query<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    SimpleFieldType extends keyof Updateable<DB[TableName]> & string,
    TablePrefixedFieldType extends `${TableName}.${SimpleFieldType}`,
    CB extends (plucked: any) => void | Promise<void>
  >(
    this: T,
    // NOTE: cannot use abbreviated types captured in generics to type fields, since
    // they will break types in real world use.
    ...fields: (
      | (keyof Updateable<DB[TableName]> & string)
      | `${TableName}.${keyof Updateable<DB[TableName]> & string}`
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

    const onlyColumns: (SimpleFieldType | TablePrefixedFieldType)[] = fields.filter(
      (_, index) => index < providedCbIndex
    ) as (SimpleFieldType | TablePrefixedFieldType)[]

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
      return vals.map(arr => arr.map(mapFn)) as any[]
    } else {
      return vals.flat().map(val => mapFn(val, 0)) as any[]
    }
  }

  public async all<T extends Query<DreamClass>>(this: T) {
    const kyselyQuery = this.buildSelect()

    const results = await executeDatabaseQuery(kyselyQuery, 'execute')

    const theAll = results.map(r =>
      sqlResultToDreamInstance(this.dreamClass, r)
    ) as InstanceType<DreamClass>[]

    await this.applyPreload(this.preloadStatements as any, theAll)

    return theAll
  }

  protected connection<T extends Query<DreamClass>>(
    this: T,
    connection: DbConnectionType
  ): Query<DreamClass> {
    return this.clone({ connection })
  }

  public async exists<T extends Query<DreamClass>>(this: T): Promise<boolean> {
    // Implementing via `limit(1).all()`, rather than the simpler `!!(await this.first())`
    // because it avoids the step of finding the first. Just find any, and return
    // that one.
    return (await this.limit(1).all()).length > 0
  }

  public async first<T extends Query<DreamClass>>(this: T) {
    const query = this.orderStatement ? this : this.order(this.dreamClass.primaryKey as any, 'asc')
    return await query.takeOne()
  }

  private async takeOne<T extends Query<DreamClass>>(this: T) {
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
      | HasManyStatement<DB, SyncedAssociations, any>
      | HasOneStatement<DB, SyncedAssociations, any>
      | BelongsToStatement<DB, SyncedAssociations, any>,
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
    association: HasOneStatement<DB, SyncedAssociations, any> | HasManyStatement<DB, SyncedAssociations, any>
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
    this: Query<DreamClass>,
    association: BelongsToStatement<any, any, string>,
    dreams: Dream[]
  ) {
    if (!association.polymorphic)
      throw new Error(
        `Association ${association.as} points to an array of models but is not designated polymorphic`
      )
    if (association.type !== 'BelongsTo')
      throw new Error(
        `Polymorphic association ${association.as} points to an array of models but is ${association.type}. Only BelongsTo associations may point to an array of models.`
      )

    let associatedDreams: Dream[] = []

    for (const associatedModel of association.modelCB() as (typeof Dream)[]) {
      const relevantAssociatedModels = dreams.filter((dream: any) => {
        return (
          (dream as any)[association.foreignKeyTypeField()] === associatedModel['stiBaseClassOrOwnClass'].name
        )
      })

      if (relevantAssociatedModels.length) {
        dreams.forEach((dream: any) => {
          dream[associationToGetterSetterProp(association)] = null
        })

        const loadedAssociations = await this.symmetricalQueryForDreamClass(associatedModel)
          .where({
            [associatedModel.primaryKey]: relevantAssociatedModels.map(
              (dream: any) => (dream as any)[association.foreignKey()]
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
                  dream[association.foreignKey()] === loadedAssociation.primaryKeyValue
                )
              } else {
                return dream[association.foreignKey()] === loadedAssociation.primaryKeyValue
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

  private async applyOnePreload(this: Query<DreamClass>, associationName: string, dreams: Dream | Dream[]) {
    if (!Array.isArray(dreams)) dreams = [dreams as Dream]

    const dream = dreams.find(dream => dream.getAssociation(associationName))!
    if (!dream) return

    let association = dream.getAssociation(associationName)
    const dreamClass = dream.constructor as typeof Dream
    const dreamClassToHydrate = association.modelCB() as typeof Dream

    if ((association.polymorphic && association.type === 'BelongsTo') || Array.isArray(dreamClassToHydrate))
      return this.preloadPolymorphicBelongsTo(association as BelongsToStatement<any, any, string>, dreams)

    const dreamClassToHydrateColumns = dreamClassToHydrate.columns()
    const throughColumnsToHydrate: any[] = []

    const columnsToPluck = [
      ...(dreamClassToHydrateColumns.map(column => `${associationName}.${column.toString()}`) as any[]),
    ]

    const asHasAssociation = association as
      | HasManyStatement<DB, SyncedAssociations, any>
      | HasOneStatement<DB, SyncedAssociations, any>

    if (asHasAssociation.through && asHasAssociation.preloadThroughColumns) {
      asHasAssociation.preloadThroughColumns!.forEach(preloadThroughColumn => {
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

  private async hydratePreload(this: Query<DreamClass>, dream: Dream) {
    await this.applyPreload(this.preloadStatements as any, dream)
  }

  private async applyPreload(
    this: Query<DreamClass>,
    preloadStatement: RelaxedPreloadStatement,
    dream: Dream | Dream[]
  ) {
    for (const key of Object.keys(preloadStatement as any)) {
      const nestedDreams = await this.applyOnePreload(key, dream)
      if (nestedDreams) {
        await this.applyPreload((preloadStatement as any)[key], nestedDreams)
      }
    }
  }

  public async last<T extends Query<DreamClass>>(this: T) {
    const query = this.orderStatement
      ? this.order(this.orderStatement.column, this.orderStatement.direction === 'desc' ? 'asc' : 'desc')
      : this.order((this.dreamClass as typeof Dream).primaryKey as any, 'desc')

    return await query.takeOne()
  }

  public async destroy<T extends Query<DreamClass>>(this: T): Promise<number> {
    const deletionResult = (await executeDatabaseQuery(
      this.buildDelete(),
      'executeTakeFirst'
    )) as DeleteResult
    return Number(deletionResult?.numDeletedRows || 0)
  }

  public async destroyBy<T extends Query<DreamClass>>(
    this: T,
    attributes: Updateable<InstanceType<DreamClass>['table']>
  ) {
    const query = this.where(attributes as any)

    if (query.hasSimilarityClauses) {
      throw new SimilarityOperatorNotSupportedOnDestroyQueries(this.dreamClass, attributes)
    }

    return query.destroy()
  }

  public async updateAll<T extends Query<DreamClass>>(
    this: T,
    attributes: Updateable<InstanceType<DreamClass>['table']>
  ) {
    if (this.baseSelectQuery) throw new NoUpdateAllOnAssociationQuery()

    const kyselyQuery = this.buildUpdate(attributes)
    const res = await executeDatabaseQuery(kyselyQuery, 'execute')
    const resultData = Array.from(res.entries())?.[0]?.[1]
    return Number((resultData as any)?.numUpdatedRows || 0)
  }

  private conditionallyApplyScopes(this: Query<DreamClass>): Query<DreamClass> {
    if (this.bypassDefaultScopes) return this

    const thisScopes = this.dreamClass['scopes'].default
    let query: Query<DreamClass> = this
    for (const scope of thisScopes) {
      query = (this.dreamClass as any)[scope.method](query)
    }

    return query
  }

  // Through associations don't get written into the SQL; they
  // locate the next association we need to build into the SQL
  // AND the source to reference on the other side
  private joinsBridgeThroughAssociations<T extends Query<DreamClass>>(
    this: T,
    {
      query,
      dreamClass,
      association,
      previousAssociationTableOrAlias,
    }: {
      // @reduce-type-complexity
      // query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>
      query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>
      // @reduce-type-complexity
      // dreamClass: typeof Dream
      dreamClass: any
      // @reduce-type-complexity
      // association:
      //   | HasOneStatement<DB, SyncedAssociations, any>
      //   | HasManyStatement<DB, SyncedAssociations, any>
      //   | BelongsToStatement<DB, SyncedAssociations, any>
      association: any
      // @reduce-type-complexity
      // previousAssociationTableOrAlias: TableOrAssociationName<InstanceType<DreamClass>['syncedAssociations']>
      previousAssociationTableOrAlias: any
    }
  ): {
    // @reduce-type-complexity
    // query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>
    query: any
    // @reduce-type-complexity
    // dreamClass: typeof Dream
    dreamClass: any
    // @reduce-type-complexity
    // association:
    //   | HasOneStatement<DB, SyncedAssociations, any>
    //   | HasManyStatement<DB, SyncedAssociations, any>
    //   | BelongsToStatement<DB, SyncedAssociations, any>
    association: any
    // @reduce-type-complexity
    // throughClass?: typeof Dream | null
    throughClass?: any
    // @reduce-type-complexity
    // previousAssociationTableOrAlias: TableOrAssociationName<InstanceType<DreamClass>['syncedAssociations']>
    previousAssociationTableOrAlias: any
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
        // @reduce-type-complexity
        // currentAssociationTableOrAlias: association.through as TableOrAssociationName<
        //   InstanceType<DreamClass>['syncedAssociations']
        // >,
        currentAssociationTableOrAlias: association.through as any,
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

  private applyOneJoin<T extends Query<DreamClass>>(
    this: T,
    {
      query,
      dreamClass,
      previousAssociationTableOrAlias,
      currentAssociationTableOrAlias,
      originalAssociation,
    }: {
      // @reduce-type-complexity
      // query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>
      query: any
      // @reduce-type-complexity
      // dreamClass: typeof Dream
      dreamClass: any
      // @reduce-type-complexity
      // previousAssociationTableOrAlias: TableOrAssociationName<InstanceType<DreamClass>['syncedAssociations']>
      previousAssociationTableOrAlias: any
      // @reduce-type-complexity
      // currentAssociationTableOrAlias: TableOrAssociationName<InstanceType<DreamClass>['syncedAssociations']>
      currentAssociationTableOrAlias: any
      // @reduce-type-complexity
      // originalAssociation?:
      //   | HasOneStatement<DB, SyncedAssociations, any>
      //   | HasManyStatement<DB, SyncedAssociations, any>
      originalAssociation?: any
    }
  ): {
    // @reduce-type-complexity
    // query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>
    query: any
    association: any
    // @reduce-type-complexity
    // previousAssociationTableOrAlias: TableOrAssociationName<InstanceType<DreamClass>['syncedAssociations']>
    previousAssociationTableOrAlias: any
    // @reduce-type-complexity
    // currentAssociationTableOrAlias: TableOrAssociationName<InstanceType<DreamClass>['syncedAssociations']>
    currentAssociationTableOrAlias: any
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
          : `${to} as ${currentAssociationTableOrAlias as string}`

      // @ts-ignore
      query = query.innerJoin(
        // @ts-ignore
        joinTableExpression,
        `${previousAssociationTableOrAlias}.${association.foreignKey() as string}`,
        `${currentAssociationTableOrAlias as string}.${(association.modelCB() as typeof Dream).primaryKey}`
      )
    } else {
      const to = association.modelCB().prototype.table
      const joinTableExpression =
        currentAssociationTableOrAlias === to
          ? currentAssociationTableOrAlias
          : `${to} as ${currentAssociationTableOrAlias as string}`

      // @ts-ignore
      query = query.innerJoin(
        // @ts-ignore
        joinTableExpression,
        `${previousAssociationTableOrAlias}.${association.modelCB().primaryKey}`,
        `${currentAssociationTableOrAlias as string}.${association.foreignKey() as string}`
      )

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

      if (originalAssociation?.through) {
        if (originalAssociation.distinct) {
          query = query.distinctOn(
            this.distinctColumnNameForAssociation({
              association: originalAssociation,
              tableNameOrAlias: originalAssociation.as,
              foreignKey: originalAssociation.modelCB().primaryKey,
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

        if (originalAssociation.order) {
          query = this.applyOrderStatementForAssociation(query, originalAssociation)
        }
      }

      if (!this.bypassDefaultScopes) {
        let scopesQuery = new Query<DreamClass>(this.dreamClass)
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

      if (association.order) {
        query = this.applyOrderStatementForAssociation(query, association)
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

  private recursivelyJoin<T extends Query<DreamClass>>(
    this: T,
    {
      query,
      joinsStatement,
      dreamClass,
      previousAssociationTableOrAlias,
    }: {
      // @reduce-type-complexity
      // query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>
      query: any
      // @reduce-type-complexity
      // joinsStatement: RelaxedJoinsWhereStatement<DB, SyncedAssociations>
      joinsStatement: any
      // @reduce-type-complexity
      // dreamClass: typeof Dream
      dreamClass: typeof Dream
      // @reduce-type-complexity
      // previousAssociationTableOrAlias: TableOrAssociationName<InstanceType<DreamClass>['syncedAssociations']>
      previousAssociationTableOrAlias: any
    }
  ): // @reduce-type-complexity
  // ): SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}> {
  any {
    // @reduce-type-complexity
    // const tableOrAssociationNames = Object.keys(joinsStatement) as TableOrAssociationName<
    //   InstanceType<DreamClass>['syncedAssociations']
    // >[]
    const tableOrAssociationNames = Object.keys(joinsStatement) as any[]

    for (const currentAssociationTableOrAlias of tableOrAssociationNames) {
      const results = this.applyOneJoin({
        query,
        dreamClass,
        previousAssociationTableOrAlias,
        currentAssociationTableOrAlias,
      })

      query = results.query
      const association = results.association

      query = this.recursivelyJoin({
        query,
        // @ts-ignore
        joinsStatement: joinsStatement[currentAssociationTableOrAlias],
        dreamClass: association.modelCB(),
        previousAssociationTableOrAlias: currentAssociationTableOrAlias,
      })
    }

    return query
  }

  private applyWhereStatements<
    T extends Query<DreamClass>,
    WS extends WhereStatement<DB, SyncedAssociations, InstanceType<DreamClass>['table']>
  >(
    this: T,
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>,
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

  private applyOrderStatementForAssociation<T extends Query<DreamClass>>(
    this: T,
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>,
    association: HasOneStatement<DB, SyncedAssociations, any> | HasManyStatement<DB, SyncedAssociations, any>
  ) {
    const orderStatement = association.order

    if (Array.isArray(orderStatement)) {
      query = query.orderBy(`${association.as}.${orderStatement[0]}`, orderStatement[1])
    } else {
      query = query.orderBy(`${association.as}.${orderStatement}`, 'asc')
    }

    if (association.type === 'HasOne') {
      query = query.limit(1)
    }

    return query
  }

  private applySingleWhereStatement<T extends Query<DreamClass>>(
    this: T,
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>,
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
        let val = (whereStatement as any)[attr]

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
          query = negate ? query.where(sql`TRUE`) : query.where(sql`FALSE`)
        } else if (b === 'not in' && Array.isArray(c) && c.length === 0) {
          query = negate ? query.where(sql`FALSE`) : query.where(sql`TRUE`)
        } else if (negate) {
          // @ts-ignore
          const negatedB = OPERATION_NEGATION_MAP[b]
          if (!negatedB) throw new Error(`no negation available for comparison operator ${b}`)
          query = query.where(a, negatedB, c)

          if (b2) {
            // @ts-ignore
            const negatedB2 = OPERATION_NEGATION_MAP[b2]
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

  private whereStatementsToExpressionWrappers<T extends Query<DreamClass>>(
    this: T,
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
            let val = (whereStatement as any)[attr]

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
              return negate ? sql`TRUE` : sql`FALSE`
            } else if (b === 'not in' && Array.isArray(c) && c.length === 0) {
              return negate ? sql`FALSE` : sql`TRUE`
            } else if (negate) {
              // @ts-ignore
              const negatedB = OPERATION_NEGATION_MAP[b]
              if (!negatedB) throw new Error(`no negation available for comparison operator ${b}`)
              const whereExpression = [eb(a, negatedB, c)]

              if (b2) {
                // @ts-ignore
                const negatedB2 = OPERATION_NEGATION_MAP[b2]
                if (!negatedB2) throw new Error(`no negation available for comparison operator ${b2}`)
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

  private orStatementsToExpressionWrappers<T extends Query<DreamClass>>(
    this: T,
    eb: ExpressionBuilder<any, any>,
    orStatement: WhereStatement<DB, SyncedAssociations, InstanceType<DreamClass>['table']>
  ): ExpressionBuilder<any, any> | ExpressionWrapper<any, any, any> {
    let useAnd = false

    return Object.keys(orStatement)
      .filter(key => (orStatement as any)[key] !== undefined)
      .reduce(
        (
          expressionBuilderOrWrap: ExpressionBuilder<any, any> | ExpressionWrapper<any, any, any>,
          attr: any
        ): ExpressionBuilder<any, any> | ExpressionWrapper<any, any, any> => {
          let val = (orStatement as any)[attr]

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
            if (useAnd) {
              return expressionBuilderOrWrap.and(sql`FALSE`) as any
            } else {
              useAnd = true
              return sql`FALSE` as any
            }
          } else if (b === 'not in' && Array.isArray(c) && c.length === 0) {
            if (useAnd) {
              return expressionBuilderOrWrap.and(sql`TRUE`) as any
            } else {
              useAnd = true
              return sql`TRUE` as any
            }
          } else {
            if (useAnd) {
              expressionBuilderOrWrap = (expressionBuilderOrWrap as any).and(eb(a, b, c))
            } else {
              useAnd = true
              expressionBuilderOrWrap = eb(a, b, c)
            }
            if (b2) expressionBuilderOrWrap = (expressionBuilderOrWrap as any).and(eb(a2, b2, c2))
            return expressionBuilderOrWrap
          }
        },
        eb
      )
  }

  private dreamWhereStatementToExpressionBuilderParts(attr: string, val: any) {
    let a: any
    let b: KyselyComparisonOperatorExpression
    let c: any
    let a2: any | null = null
    let b2: KyselyComparisonOperatorExpression | null = null
    let c2: any | null = null

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
    } else if (['SelectQueryBuilder', 'SelectQueryBuilderImpl'].includes(val.constructor.name)) {
      a = attr
      b = 'in'
      c = val
    } else if (Array.isArray(val)) {
      a = attr
      b = 'in'
      c = val
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
      keyof InstanceType<DreamClass>['syncedAssociations']
  >(
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>,
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
        let currentAssociationTableOrAlias = key as TableOrAssociationName<
          InstanceType<DreamClass>['syncedAssociations']
        >

        query = this.recursivelyApplyJoinWhereStatement<any>(
          query,
          // @ts-ignore
          whereJoinsStatement[currentAssociationTableOrAlias],
          currentAssociationTableOrAlias
        )
      }
    }

    return query
  }

  private buildCommon<T extends Query<DreamClass>>(this: T, kyselyQuery: any) {
    this.checkForQueryViolations()

    let query = this.conditionallyApplyScopes()

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

        let orEb: ExpressionWrapper<any, any, any> | undefined

        if (query.orStatements.length) {
          const orStatement = query
            .aliasWhereStatements(query.orStatements, query.baseSqlAlias)
            .map(orStatement => this.orStatementsToExpressionWrappers(eb, orStatement))
          orEb = eb.or(orStatement)
        }

        return eb.and(compact([...whereStatement, ...whereNotStatement, orEb]))
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

  private checkForQueryViolations<T extends Query<DreamClass>>(this: T) {
    const invalidWhereNotClauses = this.similarityStatementBuilder().whereNotStatementsWithSimilarityClauses()
    if (invalidWhereNotClauses.length) {
      const { tableName, tableAlias, columnName, opsStatement } = invalidWhereNotClauses[0]
      throw new CannotNegateSimilarityClause(tableName, columnName, opsStatement.value)
    }
  }

  private aliasWhereStatements(
    whereStatements: Readonly<WhereStatement<DB, SyncedAssociations, InstanceType<DreamClass>['table']>[]>,
    alias: string
  ) {
    return whereStatements.map(whereStatement => {
      return Object.keys(whereStatement).reduce((aliasedWhere, key) => {
        aliasedWhere[`${alias}.${key}`] = (whereStatement as any)[key]
        return aliasedWhere
      }, {} as any)
    })
  }

  // selfAlias and selfWhereClause are hard-coded into the model. They are never
  // populated with untrusted data, so the use of `sql.raw` is safe.
  private rawifiedSelfWhereClause({
    associationAlias,
    selfAlias,
    selfWhereClause,
  }: {
    associationAlias: string
    selfAlias: string
    selfWhereClause: WhereSelfStatement<DB, SyncedAssociations, InstanceType<DreamClass>['table']>
  }) {
    return Object.keys(selfWhereClause).reduce((acc, key) => {
      const selfColumn = selfWhereClause[key]
      if (!selfColumn) return acc

      acc[`${associationAlias}.${key}`] = sql.raw(`"${snakeify(selfAlias)}"."${snakeify(selfColumn)}"`)
      return acc
    }, {} as any)
  }

  private buildDelete<T extends Query<DreamClass>>(
    this: T
  ): DeleteQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}> {
    let kyselyQuery = this.dbFor('delete').deleteFrom(
      this.baseSqlAlias as unknown as AliasedExpression<any, any>
    )

    const results = this.attachLimitAndOrderStatementsToNonSelectQuery(kyselyQuery)
    return results.clone.buildCommon(results.kyselyQuery)
  }

  private buildSelect<T extends Query<DreamClass>, DI extends InstanceType<DreamClass>, DB extends DI['DB']>(
    this: T,
    {
      bypassSelectAll = false,
      bypassOrder = false,
    }: { bypassSelectAll?: boolean; bypassOrder?: boolean } = {}
  ): SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}> {
    let kyselyQuery: SelectQueryBuilder<DB, any, {}>

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

    if (this.orderStatement && !bypassOrder)
      kyselyQuery = kyselyQuery.orderBy(this.orderStatement.column as any, this.orderStatement.direction)

    if (this.limitStatement) kyselyQuery = kyselyQuery.limit(this.limitStatement)
    if (this.offsetStatement) kyselyQuery = kyselyQuery.offset(this.offsetStatement)

    if (!bypassSelectAll) {
      kyselyQuery = kyselyQuery.selectAll(
        this.baseSqlAlias as ExtractTableAlias<DB, InstanceType<DreamClass>['table']>
      )

      kyselyQuery = this.conditionallyAttachSimilarityColumnsToSelect(kyselyQuery)
    }

    return kyselyQuery
  }

  private buildUpdate<T extends Query<DreamClass>>(
    this: T,
    attributes: Updateable<InstanceType<DreamClass>['table']>
  ): UpdateQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, any, {}> {
    let kyselyQuery = this.dbFor('update')
      .updateTable(this.dreamClass.prototype.table as InstanceType<DreamClass>['table'])
      .set(attributes as any)

    kyselyQuery = this.conditionallyAttachSimilarityColumnsToUpdate(kyselyQuery)

    const results = this.attachLimitAndOrderStatementsToNonSelectQuery(kyselyQuery)
    return results.clone.buildCommon(results.kyselyQuery)
  }

  private attachLimitAndOrderStatementsToNonSelectQuery<
    T extends Query<DreamClass>,
    QueryType extends
      | UpdateQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, any, {}>
      | DeleteQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>
  >(this: T, kyselyQuery: QueryType): { kyselyQuery: QueryType; clone: T } {
    if (this.limitStatement || this.orderStatement) {
      kyselyQuery = (kyselyQuery as any).where((eb: any) => {
        let subquery = this.nestedSelect(this.dreamClass.primaryKey)
        return eb(this.dreamClass.primaryKey as any, 'in', subquery)
      })

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

  private similarityStatementBuilder<T extends Query<DreamClass>>(this: T) {
    return new SimilarityBuilder(this.dreamClass, {
      where: [...this.whereStatements],
      whereNot: [...this.whereNotStatements],
      joinsWhereStatements: this.joinsWhereStatements,
      transaction: this.dreamTransaction,
      connection: this.connectionOverride,
    })
  }

  private conditionallyAttachSimilarityColumnsToSelect<T extends Query<DreamClass>>(
    this: T,
    kyselyQuery: SelectQueryBuilder<
      InstanceType<DreamClass>['DB'],
      ExtractTableAlias<InstanceType<DreamClass>['DB'], InstanceType<DreamClass>['table']>,
      {}
    >,
    { includeGroupBy = false }: { includeGroupBy?: boolean } = {}
  ) {
    const similarityBuilder = this.similarityStatementBuilder()
    if (similarityBuilder.hasSimilarityClauses) {
      kyselyQuery = similarityBuilder.select(kyselyQuery, { includeGroupBy })
    }

    return kyselyQuery
  }

  private conditionallyAttachSimilarityColumnsToUpdate<T extends Query<DreamClass>>(
    this: T,
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
}

export interface QueryOpts<
  DreamClass extends typeof Dream,
  ColumnType extends keyof InstanceType<DreamClass>['DB'][keyof InstanceType<DreamClass>['DB']] extends never
    ? unknown
    : keyof InstanceType<DreamClass>['DB'][keyof InstanceType<DreamClass>['DB']] = keyof InstanceType<DreamClass>['DB'][keyof InstanceType<DreamClass>['DB']] extends never
    ? unknown
    : keyof InstanceType<DreamClass>['DB'][keyof InstanceType<DreamClass>['DB']],
  DreamInstance extends InstanceType<DreamClass> = InstanceType<DreamClass>,
  DB extends DreamInstance['DB'] = DreamInstance['DB'],
  SyncedAssociations extends DreamInstance['syncedAssociations'] = DreamInstance['syncedAssociations'],
  AllColumns extends DreamInstance['allColumns'] = DreamInstance['allColumns']
> {
  baseSqlAlias?: TableOrAssociationName<InstanceType<DreamClass>['syncedAssociations']>
  baseSelectQuery?: Query<any> | null
  passthroughWhereStatement?: PassthroughWhere<AllColumns> | null
  where?: readonly WhereStatement<DB, SyncedAssociations, any>[] | null
  whereNot?: readonly WhereStatement<DB, SyncedAssociations, any>[] | null
  limit?: LimitStatement | null
  offset?: OffsetStatement | null
  or?: WhereStatement<DB, SyncedAssociations, any>[] | null
  order?: OrderQueryStatement<ColumnType> | null
  preloadStatements?: RelaxedPreloadStatement
  distinctColumn?: ColumnType | null
  joinsStatements?: RelaxedJoinsStatement
  joinsWhereStatements?: RelaxedJoinsWhereStatement<DB, SyncedAssociations>
  bypassDefaultScopes?: boolean
  transaction?: DreamTransaction<DB> | null | undefined
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
