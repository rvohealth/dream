import crypto from 'crypto'
import { ExtractTableAlias } from 'kysely/dist/cjs/parser/table-parser'
import { AssociationTableNames } from '../db/reflections'
import { LimitStatement, WhereStatement } from '../decorators/associations/shared'
import {
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
  TRIGRAM_OPERATORS,
  SqlCommandType,
  SimilarityStatement,
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
} from 'kysely'
import { marshalDBValue } from '../helpers/marshalDBValue'
import Dream from '../dream'
import { HasManyStatement } from '../decorators/associations/has-many'
import { HasOneStatement } from '../decorators/associations/has-one'
import { BelongsToStatement } from '../decorators/associations/belongs-to'
import _db from '../db'
import CannotJoinPolymorphicBelongsToError from '../exceptions/associations/cannot-join-polymorphic-belongs-to-error'
import OpsStatement from '../ops/ops-statement'
import { Range } from '../helpers/range'
import { DateTime } from 'luxon'
import DreamTransaction from './transaction'
import sqlResultToDreamInstance from './internal/sqlResultToDreamInstance'
import ForeignKeyOnAssociationDoesNotMatchPrimaryKeyOnBase from '../exceptions/associations/foreign-key-on-association-does-not-match-primary-key-on-base'
import CurriedOpsStatement from '../ops/curried-ops-statement'
import CannotAssociateThroughPolymorphic from '../exceptions/associations/cannot-associate-through-polymorphic'
import MissingThroughAssociation from '../exceptions/associations/missing-through-association'
import MissingThroughAssociationSource from '../exceptions/associations/missing-through-association-source'
import compact from '../helpers/compact'
import JoinAttemptedOnMissingAssociation from '../exceptions/associations/join-attempted-with-missing-association'
import { singular } from 'pluralize'
import isEmpty from 'lodash.isempty'
import executeDatabaseQuery from './internal/executeDatabaseQuery'
import { DbConnectionType } from '../db/types'
import NoUpdateAllOnAssociationQuery from '../exceptions/no-updateall-on-association-query'
import { isObject, isString } from '../helpers/typechecks'
import similaritySelectSql from './internal/similarity/similaritySelectSql'
import similarityWhereSql from './internal/similarity/similarityWhereSql'
import validateTable from '../db/validators/validateTable'
import validateColumn from '../db/validators/validateColumn'
import CannotNegateSimilarityClause from '../exceptions/cannot-negate-similarity-clause'
import SimilarityBuilder from './internal/similarity/SimilarityBuilder'
import ConnectedToDB from '../db/ConnectedToDB'
import SimilarityOperatorNotSupportedOnDestroyQueries from '../exceptions/similarity-operator-not-supported-on-destroy-queries'
import debug from '../../shared/helpers/debug'

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
  Table extends DB[DreamInstance['table']] = DB[DreamInstance['table']],
  ColumnType = keyof DB[keyof DB] extends never ? unknown : keyof DB[keyof DB]
> extends ConnectedToDB<DreamClass> {
  public readonly whereStatement: readonly WhereStatement<DB, SyncedAssociations, any>[] = Object.freeze([])
  public readonly whereNotStatement: readonly WhereStatement<DB, SyncedAssociations, any>[] = Object.freeze(
    []
  )
  public readonly limitStatement: LimitStatement | null
  public readonly orStatements: readonly Query<DreamClass>[] = Object.freeze([])
  public readonly orderStatement: { column: ColumnType & string; direction: 'asc' | 'desc' } | null = null
  public readonly preloadStatements: RelaxedPreloadStatement = Object.freeze({})
  public readonly joinsStatements: RelaxedJoinsStatement = Object.freeze({})
  public readonly joinsWhereStatements: RelaxedJoinsWhereStatement<DB, SyncedAssociations> = Object.freeze({})
  public readonly shouldBypassDefaultScopes: boolean = false
  public readonly dreamClass: DreamClass
  public baseSQLAlias: TableOrAssociationName<SyncedAssociations>
  public baseSelectQuery: Query<any> | null
  public dreamTransaction: DreamTransaction<DB> | null = null
  public connectionOverride?: DbConnectionType
  constructor(DreamClass: DreamClass, opts: QueryOpts<DreamClass, ColumnType> = {}) {
    super(DreamClass, opts)
    this.dreamClass = DreamClass
    this.baseSQLAlias = opts.baseSQLAlias || this.dreamClass.prototype['table']
    this.baseSelectQuery = opts.baseSelectQuery || null
    this.whereStatement = Object.freeze(opts.where || [])
    this.whereNotStatement = Object.freeze(opts.whereNot || [])
    this.limitStatement = Object.freeze(opts.limit || null)
    this.orStatements = Object.freeze(opts.or || [])
    this.orderStatement = Object.freeze(opts.order || null)
    this.preloadStatements = Object.freeze(opts.preloadStatements || {})
    this.joinsStatements = Object.freeze(opts.joinsStatements || {})
    this.joinsWhereStatements = Object.freeze(opts.joinsWhereStatements || {})
    this.shouldBypassDefaultScopes = Object.freeze(opts.shouldBypassDefaultScopes || false)
    this.dreamTransaction = opts.transaction || null
    this.connectionOverride = opts.connection
  }

  public clone(opts: QueryOpts<DreamClass, ColumnType> = {}): Query<DreamClass> {
    return new Query(this.dreamClass, {
      baseSQLAlias: opts.baseSQLAlias || this.baseSQLAlias,
      baseSelectQuery: opts.baseSelectQuery || this.baseSelectQuery,
      where: [...this.whereStatement, ...(opts.where || [])],
      whereNot: [...this.whereNotStatement, ...(opts.whereNot || [])],
      limit: opts.limit || this.limitStatement,
      or: [...this.orStatements, ...(opts.or || [])],
      order: opts.order || this.orderStatement || null,
      preloadStatements: opts.preloadStatements || this.preloadStatements,
      joinsStatements: opts.joinsStatements || this.joinsStatements,
      joinsWhereStatements: opts.joinsWhereStatements || this.joinsWhereStatements,
      shouldBypassDefaultScopes:
        opts.shouldBypassDefaultScopes !== undefined
          ? opts.shouldBypassDefaultScopes
          : this.shouldBypassDefaultScopes,
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

  public or(orStatement: Query<DreamClass>) {
    return this.clone({ or: [orStatement] })
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

      if (!preloadStatements[nextStatement]) preloadStatements[nextStatement] = {}
      const nextPreload = preloadStatements[nextStatement]
      this.fleshOutPreloadStatements(nextPreload, associationStatements)
    } else if (Array.isArray(nextAssociationStatement)) {
      const nextStatement = nextAssociationStatement as string[]

      nextStatement.forEach(associationStatement => {
        preloadStatements[associationStatement] = {}
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

      if (!joinsStatements[nextStatement]) joinsStatements[nextStatement] = {}
      if (!joinsWhereStatements[nextStatement]) joinsWhereStatements[nextStatement] = {}
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
      Object.keys(nextAssociationStatement).forEach((key: string) => {
        joinsWhereStatements[key] = (nextAssociationStatement as any)[key]
      })
      this.fleshOutJoinsStatements(
        joinsStatements,
        joinsWhereStatements,
        previousAssociationName,
        associationStatements
      )
    }
  }

  public async joinsPluck<
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
    const pluckStatement = this.fleshOutJoinsPluckStatements(joinsStatements, joinsWhereStatements, null, [
      a,
      b as any,
      c,
      d,
      e,
      f,
      g,
    ])

    return await this.clone({ joinsStatements, joinsWhereStatements }).pluck(
      ...([pluckStatement].flat() as any[])
    )
  }

  private fleshOutJoinsPluckStatements(
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

      if (!joinsStatements[nextStatement]) joinsStatements[nextStatement] = {}
      if (!joinsWhereStatements[nextStatement]) joinsWhereStatements[nextStatement] = {}
      const nextJoinsStatements = joinsStatements[nextStatement]
      const nextJoinsWhereStatements = joinsWhereStatements[nextStatement] as RelaxedJoinsWhereStatement<
        DB,
        SyncedAssociations
      >

      return this.fleshOutJoinsPluckStatements(
        nextJoinsStatements,
        nextJoinsWhereStatements,
        nextStatement,
        associationStatements
      )
    } else if (isObject(nextAssociationStatement) && previousAssociationName) {
      Object.keys(nextAssociationStatement).forEach((key: string) => {
        joinsWhereStatements[key] = (nextAssociationStatement as any)[key]
      })

      return this.fleshOutJoinsPluckStatements(
        joinsStatements,
        joinsWhereStatements,
        previousAssociationName,
        associationStatements
      )
    }
  }

  public setBaseSQLAlias(baseSQLAlias: TableOrAssociationName<SyncedAssociations>) {
    return this.clone({ baseSQLAlias })
  }

  public setBaseSelectQuery(baseSelectQuery: Query<any> | null) {
    return this.clone({ baseSelectQuery })
  }

  public unscoped<T extends Query<DreamClass>>(this: T): Query<DreamClass> {
    return this.clone({ shouldBypassDefaultScopes: true })
  }

  public where<T extends Query<DreamClass>>(
    this: T,
    attributes: WhereStatement<DB, SyncedAssociations, InstanceType<DreamClass>['table']>
  ): Query<DreamClass> {
    return this._where(attributes, 'where')
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
    const chainableWhereStatement: WhereStatement<DB, SyncedAssociations, any> = {}

    Object.keys(attributes).forEach(
      key =>
        // @ts-ignore
        (chainableWhereStatement[key] = attributes[key])
    )

    return this.clone({
      [typeOfWhere]: [chainableWhereStatement],
    })
  }

  public nestedSelect<
    T extends Query<DreamClass>,
    DB extends InstanceType<DreamClass>['DB'],
    TableName extends InstanceType<DreamClass>['table'],
    SimpleFieldType extends keyof Updateable<DB[TableName]>,
    JoinsPluckFieldType extends any
    // JoinsPluckFieldType extends JoinsPluckAssociationExpression<
    //   InstanceType<DreamClass>['table'],
    //   T['joinsStatements'][number]
    // >
  >(this: T, selection: SimpleFieldType | JoinsPluckFieldType) {
    const query = this.buildSelect({ bypassSelectAll: true }) as SelectQueryBuilder<
      DB,
      ExtractTableAlias<DB, TableName>,
      any
    >
    return query.select(selection as any)
  }

  public order<ColumnName extends keyof Table & string>(
    column: ColumnName,
    direction: 'asc' | 'desc' = 'asc'
  ) {
    return this.clone({ order: { column: column as any, direction } })
  }

  public limit(count: number) {
    return this.clone({ limit: { count } })
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
        throw `never`
    }
  }

  public txn(dreamTransaction: DreamTransaction<DreamClass>) {
    return this.clone({ transaction: dreamTransaction })
  }

  public async count<T extends Query<DreamClass>>(this: T) {
    const { count } = this.dbFor('select').fn
    let kyselyQuery = this.buildSelect({ bypassSelectAll: true })

    kyselyQuery = kyselyQuery.select(
      count(`${this.baseSQLAlias as any}.${this.dreamClass.primaryKey}` as any).as('tablecount')
    )

    kyselyQuery = this.conditionallyAttachSimilarityColumnsToSelect(kyselyQuery, { includeGroupBy: true })

    const data = (await executeDatabaseQuery(kyselyQuery, 'executeTakeFirstOrThrow')) as any

    return parseInt(data.tablecount.toString())
  }

  public async max<
    T extends Query<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    SimpleFieldType extends keyof Updateable<DB[TableName]>,
    JoinsPluckFieldType extends any
  >(this: T, field: SimpleFieldType | JoinsPluckFieldType) {
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
    JoinsPluckFieldType extends any
  >(this: T, field: SimpleFieldType | JoinsPluckFieldType) {
    const { min } = this.dbFor('select').fn
    let kyselyQuery = this.buildSelect({ bypassSelectAll: true })

    kyselyQuery = kyselyQuery.select(min(field as any) as any)
    kyselyQuery = this.conditionallyAttachSimilarityColumnsToSelect(kyselyQuery, { includeGroupBy: true })
    const data = (await executeDatabaseQuery(kyselyQuery, 'executeTakeFirstOrThrow')) as any

    return data.min
  }

  public async pluck<
    T extends Query<DreamClass>,
    TableName extends InstanceType<DreamClass>['table'],
    SimpleFieldType extends keyof Updateable<DB[TableName]>
  >(this: T, ...fields: SimpleFieldType[]): Promise<any[]> {
    let kyselyQuery = this.buildSelect({ bypassSelectAll: true })

    fields.forEach(field => {
      kyselyQuery = kyselyQuery.select(field as any)
    })

    kyselyQuery = this.conditionallyAttachSimilarityColumnsToSelect(kyselyQuery)

    const vals = (await executeDatabaseQuery(kyselyQuery, 'execute')).map(result => Object.values(result))

    const mapFn = (val: any, index: any) => marshalDBValue(this.dreamClass, fields[index] as any, val)

    if (fields.length > 1) {
      return vals.map(arr => arr.map(mapFn)) as any[]
    } else {
      return vals.flat().map(mapFn) as any[]
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

  public connection<T extends Query<DreamClass>>(this: T, connection: DbConnectionType): Query<DreamClass> {
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

  public hydrateAssociation(
    dreams: Dream[],
    association:
      | HasManyStatement<DB, SyncedAssociations, any>
      | HasOneStatement<DB, SyncedAssociations, any>
      | BelongsToStatement<DB, SyncedAssociations, any>,
    loadedAssociations: Dream[]
  ) {
    switch (association.type) {
      case 'HasMany':
        dreams.forEach((dream: any) => (dream[association.as] = []))
        break
      default:
        dreams.forEach((dream: any) => {
          Object.defineProperty(dream, association.as, {
            configurable: true,
            get() {
              return null
            },
          })
        })
    }

    // dreams is a Rating
    // Rating belongs to: rateables (Posts / Compositions)
    // loadedAssociations is an array of Posts and Compositions
    // if rating.rateable_id === loadedAssociation.primaryKeyvalue
    //  rating.rateable = loadedAssociation
    for (const loadedAssociation of loadedAssociations) {
      if (association.type === 'BelongsTo') {
        dreams
          .filter((dream: any) => {
            if (association.polymorphic) {
              return (
                dream[association.foreignKeyTypeField()] === loadedAssociation.stiBaseClassOrOwnClass.name &&
                dream[association.foreignKey()] === loadedAssociation.primaryKeyValue
              )
            } else {
              return dream[association.foreignKey()] === loadedAssociation.primaryKeyValue
            }
          })
          .forEach((dream: any) => {
            Object.defineProperty(dream, association.as, {
              get() {
                return loadedAssociation
              },
            })
          })
      } else {
        dreams.forEach(dream => {
          if (
            (loadedAssociation as any)[association.foreignKey()].constructor !==
            dream.primaryKeyValue!.constructor
          )
            throw new ForeignKeyOnAssociationDoesNotMatchPrimaryKeyOnBase({
              baseDreamClass: dream.constructor as typeof Dream,
              associationDreamClass: loadedAssociation.constructor as typeof Dream,
              foreignKeyColumnName: association.foreignKey() as string,
            })
        })

        dreams
          .filter(dream => (loadedAssociation as any)[association.foreignKey()] === dream.primaryKeyValue)
          .forEach((dream: any) => {
            if (association.type === 'HasMany') {
              dream[association.as].push(loadedAssociation)
            } else {
              Object.defineProperty(dream, association.as, {
                get() {
                  return loadedAssociation
                },
              })
            }
          })
      }
    }

    if (association.type === 'HasMany') {
      dreams.forEach((dream: any) => {
        if (dream[association.as]) Object.freeze(dream[association.as])
      })
    }
  }

  public async preloadBridgeThroughAssociations(
    dreamClass: typeof Dream,
    dreams: Dream[],
    association:
      | HasOneStatement<DB, SyncedAssociations, any>
      | HasManyStatement<DB, SyncedAssociations, any>
      | BelongsToStatement<DB, SyncedAssociations, any>
  ): Promise<{
    dreams: Dream[]
    association:
      | HasOneStatement<DB, SyncedAssociations, any>
      | HasManyStatement<DB, SyncedAssociations, any>
      | BelongsToStatement<DB, SyncedAssociations, any>
  }> {
    if (association.type === 'BelongsTo' || !association.through) {
      return { dreams: compact(dreams), association }
    } else {
      // Post has many Commenters through Comments
      // hydrate Post Comments
      await this.applyOneInclude(association.through, dreams)

      dreams.forEach(dream => {
        if (association.type === 'HasMany') {
          Object.defineProperty(dream, association.as, {
            configurable: true,
            get() {
              const throughAssociation = (dream as any)[association.through!]

              if (Array.isArray(throughAssociation)) {
                return Object.freeze(
                  (throughAssociation as any[]).flatMap(record =>
                    hydratedSourceValue(record, association.source)
                  )
                )
              } else if (throughAssociation) {
                return hydratedSourceValue(throughAssociation, association.source)
              } else {
                return Object.freeze([])
              }
            },
          })
        } else {
          Object.defineProperty(dream, association.as, {
            configurable: true,
            get() {
              return hydratedSourceValue((dream as any)[association.through!], association.source) || null
            },
          })
        }
      })

      // return:
      //  Comments,
      //  the Comments -> CommentAuthors hasMany association
      // So that Comments may be properly hydrated with many CommentAuthors
      const newDreams = (dreams as any[]).flatMap(dream => dream[association.through!])
      const newAssociation = this.followThroughAssociation(dreamClass, association)

      return await this.preloadBridgeThroughAssociations(dreamClass, newDreams, newAssociation)
    }
  }

  private followThroughAssociation(
    dreamClass: typeof Dream,
    association: HasOneStatement<DB, SyncedAssociations, any> | HasManyStatement<DB, SyncedAssociations, any>
  ) {
    const throughAssociation = association.through && dreamClass.associationMap()[association.through]
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

    return newAssociation
  }

  public async applyOneInclude(currentAssociationTableOrAlias: string, dreams: Dream | Dream[]) {
    if (!Array.isArray(dreams)) dreams = [dreams as Dream]

    const dream = dreams.find(dream => dream.associationMap()[currentAssociationTableOrAlias])!
    if (!dream) return

    let association = dream.associationMap()[currentAssociationTableOrAlias]
    let associationQuery

    const results = await this.preloadBridgeThroughAssociations(
      dream.constructor as typeof Dream,
      dreams,
      association
    )
    dreams = results.dreams
    if (dreams.length === 0) return
    association = results.association

    if (association.type === 'BelongsTo') {
      if (association.polymorphic) {
        // Rating polymorphically BelongsTo Composition and Post
        // for each of Composition and Post
        for (const associatedModel of association.modelCB() as (typeof Dream)[]) {
          const relevantAssociatedModels = dreams.filter((dream: any) => {
            return (
              (dream as any)[association.foreignKeyTypeField()] ===
              associatedModel.stiBaseClassOrOwnClass.name
            )
          })

          if (relevantAssociatedModels.length) {
            associationQuery = this.dreamTransaction
              ? associatedModel.txn(this.dreamTransaction)
              : associatedModel

            // @ts-ignore
            associationQuery = associationQuery.where({
              [associatedModel.primaryKey]: relevantAssociatedModels.map(
                (dream: any) => (dream as any)[association.foreignKey()]
              ),
            })

            this.hydrateAssociation(dreams, association, await associationQuery.all())
          }
        }
      } else {
        const associatedModel = association.modelCB() as typeof Dream
        associationQuery = this.dreamTransaction
          ? associatedModel.txn(this.dreamTransaction)
          : associatedModel

        // @ts-ignore
        associationQuery = associationQuery.where({
          [associatedModel.primaryKey]: dreams.map(dream => (dream as any)[association.foreignKey()]),
        })

        this.hydrateAssociation(dreams, association, await associationQuery.all())
      }
    } else {
      const associatedModel = association.modelCB() as typeof Dream
      associationQuery = this.dreamTransaction ? associatedModel.txn(this.dreamTransaction) : associatedModel
      // @ts-ignore
      associationQuery = associationQuery.where({
        [association.foreignKey()]: dreams.map(dream => dream.primaryKeyValue),
      })

      if (association.polymorphic) {
        associationQuery = associationQuery.where({
          [association.foreignKeyTypeField()]: dream.stiBaseClassOrOwnClass.name,
        })
      }

      if (association.where) {
        debug(`
applying where clause for association:
${JSON.stringify(association, null, 2)}
        `)
      }
      if (association.where) associationQuery = associationQuery.where(association.where)

      if (association.whereNot) {
        debug(`
applying whereNot clause for association:
${JSON.stringify(association, null, 2)}
        `)
      }
      if (association.whereNot) associationQuery = associationQuery.whereNot(association.whereNot)

      this.hydrateAssociation(dreams, association, await associationQuery.all())
    }

    return compact(dreams.flatMap(dream => (dream as any)[association.as]))
  }

  public async hydratePreload(dream: Dream) {
    await this.applyPreload(this.preloadStatements as any, dream)
  }

  private async applyPreload(preloadStatement: RelaxedPreloadStatement, dream: Dream | Dream[]) {
    for (const key of Object.keys(preloadStatement as any)) {
      const nestedDream = await this.applyOneInclude(key, dream)
      if (nestedDream) {
        await this.applyPreload((preloadStatement as any)[key], nestedDream)
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
    const deletionResult = (await this.buildDelete().executeTakeFirst()) as DeleteResult
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
    if (this.shouldBypassDefaultScopes) return this

    const thisScopes = this.dreamClass.scopes.default
    let query: Query<DreamClass> = this
    for (const scope of thisScopes) {
      query = (this.dreamClass as any)[scope.method](query)
    }

    return query
  }

  private joinsBridgeThroughAssociations<T extends Query<DreamClass>>(
    this: T,
    {
      query,
      dreamClass,
      association,
      previousAssociationTableOrAlias,
    }: {
      query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>
      dreamClass: typeof Dream
      association:
        | HasOneStatement<DB, SyncedAssociations, any>
        | HasManyStatement<DB, SyncedAssociations, any>
        | BelongsToStatement<DB, SyncedAssociations, any>
      previousAssociationTableOrAlias: TableOrAssociationName<InstanceType<DreamClass>['syncedAssociations']>
    }
  ): {
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>
    dreamClass: typeof Dream
    association:
      | HasOneStatement<DB, SyncedAssociations, any>
      | HasManyStatement<DB, SyncedAssociations, any>
      | BelongsToStatement<DB, SyncedAssociations, any>
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
      // Post has many Commenters through Comments
      //  Comments,
      //  the Comments -> CommentAuthors hasMany association
      // dreamClass is Post
      // newDreamClass is Comment
      const results = this.applyOneJoin({
        query,
        dreamClass,
        previousAssociationTableOrAlias,
        currentAssociationTableOrAlias: association.through as TableOrAssociationName<
          InstanceType<DreamClass>['syncedAssociations']
        >,
      })
      const newAssociation = this.followThroughAssociation(dreamClass, association)

      return this.joinsBridgeThroughAssociations({
        query: results.query,
        dreamClass: association.modelCB(),
        association: newAssociation,
        previousAssociationTableOrAlias: association.through as TableOrAssociationName<
          InstanceType<DreamClass>['syncedAssociations']
        >,
      })
    }
  }

  private applyOneJoin<T extends Query<DreamClass>>(
    this: T,
    {
      query,
      dreamClass,
      previousAssociationTableOrAlias,
      currentAssociationTableOrAlias,
    }: {
      query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>
      dreamClass: typeof Dream
      previousAssociationTableOrAlias: TableOrAssociationName<InstanceType<DreamClass>['syncedAssociations']>
      currentAssociationTableOrAlias: TableOrAssociationName<InstanceType<DreamClass>['syncedAssociations']>
    }
  ): {
    query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>
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

    let association = dreamClass.associationMap()[currentAssociationTableOrAlias]
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
        query = this.applyWhereStatement(
          query,
          this.aliasWhereStatement(
            [{ [association.foreignKeyTypeField()]: dreamClass.stiBaseClassOrOwnClass.name } as any],
            currentAssociationTableOrAlias
          )
        )
      }

      if (!this.shouldBypassDefaultScopes) {
        const tempQuery = new Query<DreamClass>(this.dreamClass)

        const associationClass = association.modelCB() as any
        const associationScopes = associationClass.scopes.default
        for (const scope of associationScopes) {
          associationClass[scope.method](tempQuery)
        }

        query = this.applyWhereStatement(
          query,
          this.aliasWhereStatement(tempQuery.whereStatement, currentAssociationTableOrAlias)
        )
      }

      if (association.where) {
        query = this.applyWhereStatement(
          query,
          this.aliasWhereStatement(
            [association.where as WhereStatement<DB, SyncedAssociations, InstanceType<DreamClass>['table']>],
            currentAssociationTableOrAlias
          )
        )
      }

      if (association.whereNot) {
        query = this.applyWhereStatement(
          query,
          this.aliasWhereStatement(
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
    }

    return {
      query,
      association,
      previousAssociationTableOrAlias,
      currentAssociationTableOrAlias,
    }
  }

  private recursivelyJoin<T extends Query<DreamClass>>(
    this: T,
    {
      query,
      joinsStatement,
      dreamClass,
      previousAssociationTableOrAlias,
    }: {
      query: SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}>
      joinsStatement: RelaxedJoinsWhereStatement<DB, SyncedAssociations>
      dreamClass: typeof Dream
      previousAssociationTableOrAlias: TableOrAssociationName<InstanceType<DreamClass>['syncedAssociations']>
    }
  ): SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}> {
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

  private applyWhereStatement<
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

        let a: any
        let b: KyselyComparisonOperatorExpression
        let c: any
        let a2: any | null = null
        let b2: KyselyComparisonOperatorExpression | null = null
        let c2: any | null = null

        if (val instanceof Function) {
          val = val()
        }

        if (val === null) {
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
          if (!negatedB) throw `no negation available for comparison operator ${b}`
          query = query.where(a, negatedB, c)

          if (b2) {
            // @ts-ignore
            const negatedB2 = OPERATION_NEGATION_MAP[b2]
            if (!negatedB2) throw `no negation available for comparison operator ${b2}`
            query.where(a2, negatedB2, c2)
          }
        } else {
          query = query.where(a, b, c)
          if (b2) query = query.where(a2, b2, c2)
        }
      })

    return query
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
        query = (this as any).applyWhereStatement(query, {
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
        previousAssociationTableOrAlias: this.baseSQLAlias,
      })
    }

    query.orStatements.forEach(orStatement => {
      kyselyQuery = kyselyQuery.union(orStatement.toKysely('select') as any)
    })

    if (Object.keys(query.whereStatement).length) {
      kyselyQuery = query.applyWhereStatement(
        kyselyQuery,
        query.aliasWhereStatement(query.whereStatement, query.baseSQLAlias)
      )
    }

    if (Object.keys(query.whereNotStatement).length) {
      kyselyQuery = query.applyWhereStatement(
        kyselyQuery,
        query.aliasWhereStatement(query.whereNotStatement, query.baseSQLAlias),
        {
          negate: true,
        }
      )
    }

    if (!isEmpty(query.joinsWhereStatements)) {
      kyselyQuery = query.recursivelyApplyJoinWhereStatement(
        kyselyQuery,
        query.joinsWhereStatements,
        query.baseSQLAlias
      )
    }

    return kyselyQuery
  }

  private checkForQueryViolations() {
    const invalidWhereNotClauses = this.similarityStatementBuilder().whereNotStatementsWithSimilarityClauses()
    if (invalidWhereNotClauses.length) {
      const { tableName, tableAlias, columnName, opsStatement } = invalidWhereNotClauses[0]
      throw new CannotNegateSimilarityClause(tableName, columnName, opsStatement.value)
    }
  }

  private aliasWhereStatement(
    whereStatements: Readonly<WhereStatement<DB, SyncedAssociations, InstanceType<DreamClass>['table']>[]>,
    alias: string
  ) {
    return whereStatements.map(whereStatement => {
      const aliasedWhere: any = {}
      Object.keys(whereStatement).forEach((key: any) => {
        aliasedWhere[`${alias}.${key}`] = (whereStatement as any)[key]
      })
      return aliasedWhere
    })
  }

  private buildDelete<T extends Query<DreamClass>>(
    this: T
  ): DeleteQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}> {
    let kyselyQuery = this.dbFor('delete').deleteFrom(
      this.baseSQLAlias as unknown as AliasedExpression<any, any>
    )
    return this.buildCommon(kyselyQuery)
  }

  private buildSelect<T extends Query<DreamClass>, DI extends InstanceType<DreamClass>, DB extends DI['DB']>(
    this: T,
    { bypassSelectAll = false }: { bypassSelectAll?: boolean } = {}
  ): SelectQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, {}> {
    let kyselyQuery: SelectQueryBuilder<DB, any, {}>

    if (this.baseSelectQuery) {
      kyselyQuery = this.baseSelectQuery.buildSelect({ bypassSelectAll: true })
    } else {
      const from =
        this.baseSQLAlias === this.dreamClass.prototype.table
          ? this.dreamClass.prototype.table
          : `${this.dreamClass.prototype.table} as ${this.baseSQLAlias}`

      kyselyQuery = this.dbFor('select').selectFrom(from as any)
    }

    kyselyQuery = this.buildCommon(kyselyQuery)

    if (this.orderStatement)
      kyselyQuery = kyselyQuery.orderBy(this.orderStatement.column as any, this.orderStatement.direction)

    if (this.limitStatement) kyselyQuery = kyselyQuery.limit(this.limitStatement.count)

    if (!bypassSelectAll) {
      kyselyQuery = kyselyQuery.selectAll(
        this.baseSQLAlias as ExtractTableAlias<DB, InstanceType<DreamClass>['table']>
      )

      kyselyQuery = this.conditionallyAttachSimilarityColumnsToSelect(kyselyQuery)
    }

    return kyselyQuery
  }

  public buildUpdate<T extends Query<DreamClass>>(
    this: T,
    attributes: Updateable<InstanceType<DreamClass>['table']>
  ): UpdateQueryBuilder<DB, ExtractTableAlias<DB, InstanceType<DreamClass>['table']>, any, {}> {
    let kyselyQuery = this.dbFor('update')
      .updateTable(this.dreamClass.prototype.table as InstanceType<DreamClass>['table'])
      .set(attributes as any)

    kyselyQuery = this.conditionallyAttachSimilarityColumnsToUpdate(kyselyQuery)

    return this.buildCommon(kyselyQuery)
  }

  private get hasSimilarityClauses() {
    return this.similarityStatementBuilder().hasSimilarityClauses
  }

  private similarityStatementBuilder<T extends Query<DreamClass>>(this: T) {
    return new SimilarityBuilder(this.dreamClass, {
      where: [...this.whereStatement],
      whereNot: [...this.whereNotStatement],
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
  ColumnType = keyof InstanceType<DreamClass>['DB'][keyof InstanceType<DreamClass>['DB']] extends never
    ? unknown
    : keyof InstanceType<DreamClass>['DB'][keyof InstanceType<DreamClass>['DB']],
  DreamInstance extends InstanceType<DreamClass> = InstanceType<DreamClass>,
  DB extends DreamInstance['DB'] = DreamInstance['DB'],
  SyncedAssociations extends DreamInstance['syncedAssociations'] = DreamInstance['syncedAssociations']
> {
  baseSQLAlias?: TableOrAssociationName<InstanceType<DreamClass>['syncedAssociations']>
  baseSelectQuery?: Query<any> | null
  where?: WhereStatement<DB, SyncedAssociations, any>[]
  whereNot?: WhereStatement<DB, SyncedAssociations, any>[]
  limit?: LimitStatement | null
  or?: Query<DreamClass>[]
  order?: { column: ColumnType & string; direction: 'asc' | 'desc' } | null
  preloadStatements?: RelaxedPreloadStatement
  joinsStatements?: RelaxedJoinsStatement
  joinsWhereStatements?: RelaxedJoinsWhereStatement<DB, SyncedAssociations>
  shouldBypassDefaultScopes?: boolean
  transaction?: DreamTransaction<DB> | null | undefined
  connection?: DbConnectionType
}

function getSourceAssociation(dream: Dream | typeof Dream | undefined, sourceName: string) {
  if (!dream) return
  if (!sourceName) return
  return (
    (dream as Dream).associationMap()[sourceName] || (dream as Dream).associationMap()[singular(sourceName)]
  )
}

function hydratedSourceValue(dream: Dream | typeof Dream | undefined, sourceName: string) {
  if (!dream) return
  if (!sourceName) return
  return (dream as any)[sourceName] || (dream as any)[singular(sourceName)]
}
