import {
  AliasedExpression,
  DeleteQueryBuilder,
  ExpressionBuilder,
  ExpressionWrapper,
  JoinBuilder,
  ComparisonOperatorExpression as KyselyComparisonOperatorExpression,
  SelectQueryBuilder,
  sql,
  SqlBool,
  Updateable,
  UpdateQueryBuilder,
} from 'kysely'
import pluralize from 'pluralize-esm'
import _db from '../../db/index.js'
import associationToGetterSetterProp from '../../decorators/field/association/associationToGetterSetterProp.js'
import Dream from '../../Dream.js'
import CannotAssociateThroughPolymorphic from '../../errors/associations/CannotAssociateThroughPolymorphic.js'
import CannotJoinPolymorphicBelongsToError from '../../errors/associations/CannotJoinPolymorphicBelongsToError.js'
import JoinAttemptedOnMissingAssociation from '../../errors/associations/JoinAttemptedOnMissingAssociation.js'
import MissingRequiredAssociationAndClause from '../../errors/associations/MissingRequiredAssociationAndClause.js'
import MissingRequiredPassthroughForAssociationAndClause from '../../errors/associations/MissingRequiredPassthroughForAssociationAndClause.js'
import MissingThroughAssociation from '../../errors/associations/MissingThroughAssociation.js'
import MissingThroughAssociationSource from '../../errors/associations/MissingThroughAssociationSource.js'
import CannotNegateSimilarityClause from '../../errors/CannotNegateSimilarityClause.js'
import CannotPassUndefinedAsAValueToAWhereClause from '../../errors/CannotPassUndefinedAsAValueToAWhereClause.js'
import UnexpectedUndefined from '../../errors/UnexpectedUndefined.js'
import CalendarDate from '../../helpers/CalendarDate.js'
import camelize from '../../helpers/camelize.js'
import compact from '../../helpers/compact.js'
import { DateTime } from '../../helpers/DateTime.js'
import isEmpty from '../../helpers/isEmpty.js'
import isObject from '../../helpers/isObject.js'
import namespaceColumn from '../../helpers/namespaceColumn.js'
import normalizeUnicode from '../../helpers/normalizeUnicode.js'
import objectPathsToArrays from '../../helpers/objectPathsToArrays.js'
import protectAgainstPollutingAssignment from '../../helpers/protectAgainstPollutingAssignment.js'
import { Range } from '../../helpers/range.js'
import snakeify from '../../helpers/snakeify.js'
import sqlAttributes from '../../helpers/sqlAttributes.js'
import uniq from '../../helpers/uniq.js'
import CurriedOpsStatement from '../../ops/curried-ops-statement.js'
import OpsStatement from '../../ops/ops-statement.js'
import { BelongsToStatement } from '../../types/associations/belongsTo.js'
import { HasManyStatement } from '../../types/associations/hasMany.js'
import { HasOneStatement } from '../../types/associations/hasOne.js'
import { AssociationStatement, SelfOnStatement, WhereStatement } from '../../types/associations/shared.js'
import {
  AliasToDreamIdMap,
  AllDefaultScopeNames,
  AssociationNameToAssociationDataAndDreamClassMap,
  AssociationNameToAssociationMap,
  AssociationNameToDreamClassMap,
  DreamColumnNames,
  DreamTableSchema,
  JoinAndStatements,
  OrderDir,
  RelaxedJoinAndStatement,
  RelaxedJoinStatement,
  RelaxedPreloadOnStatement,
  RelaxedPreloadStatement,
  TableOrAssociationName,
} from '../../types/dream.js'
import { DefaultQueryTypeOptions, JoinTypes, PreloadedDreamsAndWhatTheyPointTo } from '../../types/query.js'
import { DreamConst } from '../constants.js'
import DreamTransaction from '../DreamTransaction.js'
import executeDatabaseQuery from '../internal/executeDatabaseQuery.js'
import extractAssociationMetadataFromAssociationName from '../internal/extractAssociationMetadataFromAssociationName.js'
import orderByDirection from '../internal/orderByDirection.js'
import shouldBypassDefaultScope from '../internal/shouldBypassDefaultScope.js'
import SimilarityBuilder from '../internal/similarity/SimilarityBuilder.js'
import sqlResultToDreamInstance from '../internal/sqlResultToDreamInstance.js'
import Query from '../Query.js'
import QueryDriverBase from './Base.js'

export default class PostgresQueryDriver<DreamInstance extends Dream> extends QueryDriverBase<DreamInstance> {
  /**
   * @internal
   *
   * This method is used internally by a Query driver to
   * take the result of a single row in a database, and
   * turn that row into the provided dream instance.
   *
   * If needed, the return type can be overriden to
   * explicitly define the resulting dream instance,
   * in cases where a proper type for the dream class
   * cannot be inferred, i.e.
   *
   * ```ts
   * this.dbResultToDreamInstance<typeof Dream, DreamInstance>(result, this.dreamClass)
   * ```
   */
  public override dbResultToDreamInstance<
    DreamClass extends typeof Dream,
    RetType = InstanceType<DreamClass>,
  >(result: any, dreamClass: typeof Dream): RetType {
    return sqlResultToDreamInstance(dreamClass, result) as RetType
  }

  /**
   * @internal
   *
   * Used for applying first and last queries
   *
   * @returns A dream instance or null
   */
  public async takeOne(this: PostgresQueryDriver<DreamInstance>): Promise<DreamInstance | null> {
    if (this.query['joinLoadActivated']) {
      let query: Query<DreamInstance>

      if (
        this.query['whereStatements'].find(
          whereStatement =>
            (whereStatement as any)[this.dreamClass.primaryKey] ||
            (whereStatement as any)[this.query['namespacedPrimaryKey']]
        )
      ) {
        // the query already includes a primary key where statement
        query = this.query
      } else {
        // otherwise find the primary key and apply it to the query
        const primaryKeyValue = (
          await this.query.limit(1).pluck(this.query['namespacedPrimaryKey'] as any)
        )[0]
        if (primaryKeyValue === undefined) return null
        query = this.query.where({ [this.query['namespacedPrimaryKey']]: primaryKeyValue } as any)
      }

      return (await new PostgresQueryDriver(query)['executeJoinLoad']())[0] || null
    }

    const kyselyQuery = new PostgresQueryDriver(this.query.limit(1)).buildSelect()
    const results = await executeDatabaseQuery(kyselyQuery, 'executeTakeFirst')

    if (results) {
      const theFirst = this.dbResultToDreamInstance<typeof Dream, DreamInstance>(results, this.dreamClass)

      if (theFirst)
        await this.applyPreload(
          this.query['preloadStatements'] as any,
          this.query['preloadOnStatements'] as any,
          [theFirst]
        )

      return theFirst
    } else return null
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
  public async takeAll(
    options: {
      columns?: DreamColumnNames<DreamInstance>[]
    } = {}
  ): Promise<DreamInstance[]> {
    if (this.query['joinLoadActivated']) return await this.executeJoinLoad(options)

    const kyselyQuery = this.buildSelect(options)
    const results = await executeDatabaseQuery(kyselyQuery, 'execute')
    const theAll = results.map(r => this.dbResultToDreamInstance(r, this.dreamClass))
    await this.applyPreload(
      this.query['preloadStatements'] as any,
      this.query['preloadOnStatements'] as any,
      theAll
    )

    return theAll as DreamInstance[]
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
  public async max(columnName: string): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { max } = this.dbFor('select').fn
    let kyselyQuery = new PostgresQueryDriver(this.query).buildSelect({
      bypassSelectAll: true,
      bypassOrder: true,
    })

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
  public async min(columnName: string): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { min } = this.dbFor('select').fn
    let kyselyQuery = new PostgresQueryDriver(this.query).buildSelect({
      bypassSelectAll: true,
      bypassOrder: true,
    })

    kyselyQuery = kyselyQuery.select(min(columnName as any) as any)
    const data = await executeDatabaseQuery(kyselyQuery, 'executeTakeFirstOrThrow')

    return data.min
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
    const distinctColumn = this.query['distinctColumn']
    const query = this.query.clone({ distinctColumn: null })

    let kyselyQuery = new PostgresQueryDriver(query).buildSelect({ bypassSelectAll: true, bypassOrder: true })

    const countClause = distinctColumn
      ? count(sql`DISTINCT ${distinctColumn}`)
      : count(query['namespaceColumn'](query.dreamInstance.primaryKey))

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
  public async pluck(...fields: DreamColumnNames<DreamInstance>[]): Promise<any[]> {
    let kyselyQuery = new PostgresQueryDriver(
      this.query['removeAllDefaultScopesExceptOnAssociations']()
    ).buildSelect({
      bypassSelectAll: true,
    })
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
    this: PostgresQueryDriver<DreamInstance>,
    selection: SimpleFieldType | PluckThroughFieldType
  ) {
    const query = this.buildSelect({
      bypassSelectAll: true,
      bypassOrder: true,
    })
    return query.select(this.namespaceColumn(selection as any))
  }

  /**
   * executes provided query instance as a deletion query.
   * @returns the number of deleted rows
   */
  public async delete(): Promise<number> {
    const deletionResult = await executeDatabaseQuery(this.buildDelete(), 'executeTakeFirst')
    return Number(deletionResult?.numDeletedRows || 0)
  }

  /**
   * executes provided query instance as an update query.
   * @returns the number of updated rows
   */
  public async update(attributes: DreamTableSchema<DreamInstance>): Promise<number> {
    const kyselyQuery = this.buildUpdate(attributes)
    const res = await executeDatabaseQuery(kyselyQuery, 'execute')
    const resultData = Array.from(res.entries())?.[0]?.[1]
    return Number(resultData?.numUpdatedRows || 0)
  }

  /**
   * persists any unsaved changes to the database. If a transaction
   * is provided as a second argument, it will use that transaction
   * to encapsulate the persisting of the dream, as well as any
   * subsequent model hooks that are fired.
   */
  public static async saveDream(dream: Dream, txn: DreamTransaction<Dream> | null = null) {
    const db = txn?.kyselyTransaction ?? _db('primary')

    const sqlifiedAttributes = sqlAttributes(dream)

    if (dream.isPersisted) {
      const query = db
        .updateTable(dream.table)
        .set(sqlifiedAttributes as any)
        .where(namespaceColumn(dream.primaryKey, dream.table), '=', dream.primaryKeyValue)
      return await executeDatabaseQuery(
        query.returning([...dream.columns()] as any),
        'executeTakeFirstOrThrow'
      )
    } else {
      const query = db
        .insertInto(dream.table)
        .values(sqlifiedAttributes as any)
        .returning([...dream.columns()] as any)
      return await executeDatabaseQuery(query, 'executeTakeFirstOrThrow')
    }
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

  private buildDelete(this: PostgresQueryDriver<DreamInstance>): DeleteQueryBuilder<any, any, any> {
    const kyselyQuery = this.dbFor('delete').deleteFrom(
      this.query['baseSqlAlias'] as unknown as AliasedExpression<any, any>
    )

    const results = this.attachLimitAndOrderStatementsToNonSelectQuery(kyselyQuery as any)
    return new PostgresQueryDriver(results.clone).buildCommon(results.kyselyQuery)
  }

  private buildSelect(
    this: PostgresQueryDriver<DreamInstance>,
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

    if (this.query['baseSelectQuery']) {
      const connectionOverride = this.query['connectionOverride']

      const query = connectionOverride
        ? this.query['baseSelectQuery'].connection(connectionOverride)
        : this.query['baseSelectQuery']
      kyselyQuery = new PostgresQueryDriver(query).buildSelect({ bypassSelectAll: true })
    } else {
      const from =
        this.query['baseSqlAlias'] === this.query['tableName']
          ? this.query['tableName']
          : `${this.query['tableName']} as ${this.query['baseSqlAlias']}`

      kyselyQuery = this.dbFor('select').selectFrom(from)
    }

    if (this.query['distinctColumn']) {
      kyselyQuery = kyselyQuery.distinctOn(this.query['distinctColumn'])
    }

    kyselyQuery = this.buildCommon(kyselyQuery)

    kyselyQuery = this.conditionallyAttachSimilarityColumnsToSelect(kyselyQuery, {
      bypassOrder: bypassOrder || !!this.query['distinctColumn'],
    }) as typeof kyselyQuery

    if (this.query['orderStatements'].length && !bypassOrder) {
      this.query['orderStatements'].forEach(orderStatement => {
        kyselyQuery = kyselyQuery.orderBy(
          this.namespaceColumn(orderStatement.column),
          orderByDirection(orderStatement.direction)
        )
      })
    }

    if (this.query['limitStatement']) kyselyQuery = kyselyQuery.limit(this.query['limitStatement'])
    if (this.query['offsetStatement']) kyselyQuery = kyselyQuery.offset(this.query['offsetStatement'])

    if (columns) {
      kyselyQuery = kyselyQuery.select(
        this.columnsWithRequiredLoadColumns(columns).map(column => this.namespaceColumn(column))
      )
    } else if (!bypassSelectAll) {
      kyselyQuery = kyselyQuery.selectAll(this.query['baseSqlAlias'])
    }

    // even though we manually bypass explicit order statements above,
    // associations can contain their own ordering systems. If we do not
    // escape all orders, we can mistakenly allow an order clause to sneak in.
    if (bypassOrder) kyselyQuery = kyselyQuery.clearOrderBy()

    return kyselyQuery
  }

  private buildUpdate<DB extends DreamInstance['DB']>(
    attributes: Updateable<DreamInstance['table']>
  ): UpdateQueryBuilder<DB, any, any, object> {
    let kyselyQuery = this.dbFor('update')
      .updateTable(this.query['tableName'] as DreamInstance['table'])
      .set(attributes as any)

    kyselyQuery = this.conditionallyAttachSimilarityColumnsToUpdate(kyselyQuery)

    const results = this.attachLimitAndOrderStatementsToNonSelectQuery(kyselyQuery as any)
    return new PostgresQueryDriver(results.clone).buildCommon(results.kyselyQuery)
  }

  /**
   * @internal
   *
   * Used to hydrate dreams with the provided associations
   */
  public hydrateAssociation(
    dreams: Dream[],
    association: AssociationStatement,
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
   * Used by loadBuider
   */
  public async hydratePreload(this: PostgresQueryDriver<DreamInstance>, dream: Dream) {
    await this.applyPreload(
      this.query['preloadStatements'] as any,
      this.query['preloadOnStatements'] as any,
      dream
    )
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
    selfAndClause,
  }: {
    associationAlias: string
    selfAlias: string
    selfAndClause: SelfOnStatement<any, DB, Schema, DreamInstance['table']>
  }) {
    const alphanumericUnderscoreRegexp = /[^a-zA-Z0-9_]/g
    selfAlias = selfAlias.replace(alphanumericUnderscoreRegexp, '')

    return Object.keys(selfAndClause).reduce((acc, key) => {
      const selfColumn = selfAndClause[key]?.replace(alphanumericUnderscoreRegexp, '')
      if (!selfColumn) return acc

      acc[this.namespaceColumn(key, associationAlias)] = sql.raw(
        `"${snakeify(selfAlias)}"."${snakeify(selfColumn)}"`
      )
      return acc
    }, {} as any)
  }

  private attachLimitAndOrderStatementsToNonSelectQuery<
    T extends PostgresQueryDriver<DreamInstance>,
    QueryType extends UpdateQueryBuilder<any, any, any, any> | DeleteQueryBuilder<any, any, any>,
  >(this: T, kyselyQuery: QueryType): { kyselyQuery: QueryType; clone: Query<DreamInstance> } {
    if (this.query['limitStatement'] || this.query['orderStatements'].length) {
      kyselyQuery = (kyselyQuery as any).where((eb: ExpressionBuilder<any, any>) => {
        const subquery = this.query.nestedSelect(this.dreamInstance.primaryKey)

        return eb(this.dreamInstance.primaryKey as any, 'in', subquery)
      }) as typeof kyselyQuery

      return {
        kyselyQuery,
        clone: this.query.clone<Query<DreamInstance>>({
          where: null,
          whereNot: null,
          order: null,
          limit: null,
        }),
      }
    }

    return { kyselyQuery, clone: this.query }
  }

  private columnsWithRequiredLoadColumns(columns: string[]) {
    return uniq(
      compact([this.dreamClass.primaryKey, this.dreamClass['isSTIBase'] ? 'type' : null, ...columns])
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
    const query = this.query['limit'](null).offset(null as any)

    let kyselyQuery = new PostgresQueryDriver(query).buildSelect({ bypassSelectAll: true })

    const aliasToDreamClassesMap = {
      [this.query['baseSqlAlias']]: this.dreamClass,
      ...this.joinStatementsToDreamClassesMap(this.query['leftJoinStatements']),
    }

    const associationAliasToColumnAliasMap: Record<string, Record<string, string>> = {}
    const aliasToAssociationsMap = this.joinStatementsToAssociationsMap(this.query['leftJoinStatements'])

    const aliases = Object.keys(aliasToDreamClassesMap)

    let nextColumnAliasCounter = 0

    aliases.forEach((aliasOrExpression: string) => {
      const alias = extractAssociationMetadataFromAssociationName(aliasOrExpression).alias
      if (alias === undefined) throw new UnexpectedUndefined()

      associationAliasToColumnAliasMap[alias] ||= {}
      const aliasedDreamClass = aliasToDreamClassesMap[alias]
      if (aliasedDreamClass === undefined) throw new UnexpectedUndefined()
      const association = aliasToAssociationsMap[alias]

      const columns =
        alias === this.query['baseSqlAlias']
          ? options.columns
            ? this.columnsWithRequiredLoadColumns(options.columns)
            : this.dreamClass.columns()
          : aliasedDreamClass.columns()

      columns.forEach((column: string) => {
        const columnAlias = `dr${nextColumnAliasCounter++}`
        kyselyQuery = kyselyQuery.select(`${this.namespaceColumn(column, alias)} as ${columnAlias}`)
        const columnAliasMap = associationAliasToColumnAliasMap[alias]
        if (columnAliasMap === undefined) throw new UnexpectedUndefined()

        columnAliasMap[column] = columnAlias
      })

      if (association?.type === 'HasOne' || association?.type === 'HasMany') {
        const setupPreloadData = (dbColumnName: string) => {
          const columnAlias = `dr${nextColumnAliasCounter++}`
          const columnAliasMap = associationAliasToColumnAliasMap[association.through!]
          if (columnAliasMap === undefined) throw new UnexpectedUndefined()

          columnAliasMap[dbColumnName] = columnAlias
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
          currentAlias: this.query['baseSqlAlias'],
          singleSqlResult,
          aliasToDreamIdMap,
          associationAliasToColumnAliasMap,
          aliasToAssociationsMap,
          aliasToDreamClassesMap,
          leftJoinStatements: this.query['leftJoinStatements'],
        })

        return aliasToDreamIdMap
      },
      {} as AliasToDreamIdMap
    )

    const baseModelIdToDreamMap = aliasToDreamIdMap[this.query['baseSqlAlias']] || new Map()
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
    if (dreamClass === undefined) throw new UnexpectedUndefined()

    const columnToColumnAliasMap = associationAliasToColumnAliasMap[currentAlias]
    if (columnToColumnAliasMap === undefined) throw new UnexpectedUndefined()

    const primaryKeyName = dreamClass.primaryKey
    if (primaryKeyName === undefined) throw new UnexpectedUndefined()

    const columnAlias = columnToColumnAliasMap[primaryKeyName]
    if (columnAlias === undefined) throw new UnexpectedUndefined()

    const primaryKeyValue = singleSqlResult[columnAlias]
    if (!primaryKeyValue) return null

    aliasToDreamIdMap[currentAlias] ||= new Map()

    if (!aliasToDreamIdMap[currentAlias].get(primaryKeyValue)) {
      const columnValueMap = Object.keys(columnToColumnAliasMap).reduce(
        (columnNameValueMap, columnName) => {
          const columnAlias = columnToColumnAliasMap[columnName]
          if (columnAlias === undefined) throw new UnexpectedUndefined()
          columnNameValueMap[columnName] = singleSqlResult[columnAlias]
          return columnNameValueMap
        },
        {} as Record<string, any>
      )
      const dream = this.dbResultToDreamInstance(columnValueMap, dreamClass)

      const association = aliasToAssociationsMap[currentAlias] as
        | HasOneStatement<any, any, any, any>
        | HasManyStatement<any, any, any, any>
      if (association && association.through && association.preloadThroughColumns) {
        const throughAssociationColumnToColumnAliasMap = associationAliasToColumnAliasMap[association.through]
        if (throughAssociationColumnToColumnAliasMap === undefined) throw new UnexpectedUndefined()

        this.hydratePreloadedThroughColumns({
          association,
          columnToColumnAliasMap: throughAssociationColumnToColumnAliasMap,
          dream,
          singleSqlResult,
        })
      }

      aliasToDreamIdMap[protectAgainstPollutingAssignment(currentAlias)]?.set(primaryKeyValue, dream)
    }

    const dream = aliasToDreamIdMap[currentAlias].get(primaryKeyValue)

    Object.keys(leftJoinStatements).forEach(nextAlias => {
      const { name: associationName, alias } = extractAssociationMetadataFromAssociationName(nextAlias)

      const association = dreamClass['getAssociationMetadata'](associationName)
      if (association === undefined) throw new UnexpectedUndefined()

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
        columnNameToPreloadedThroughColumnNameMap[columnName] = preloadMap[columnName]!
        return columnName
      })
    } else if (Array.isArray(association.preloadThroughColumns)) {
      columnNames = association.preloadThroughColumns.map(columnName => {
        columnNameToPreloadedThroughColumnNameMap[columnName] = columnName
        return columnName
      })
    }

    columnNames.forEach(columnName => {
      const preloadedThroughColumnName = columnNameToPreloadedThroughColumnNameMap[columnName]
      if (preloadedThroughColumnName === undefined) throw new UnexpectedUndefined()

      const columnAlias = columnToColumnAliasMap[columnName]
      if (columnAlias === undefined) {
        throw new UnexpectedUndefined()
      }

      ;(dream as any).preloadedThroughColumns[preloadedThroughColumnName] = singleSqlResult[columnAlias]
    })
  }

  private applyJoinAndStatement<Schema extends DreamInstance['schema']>(
    join: JoinBuilder<any, any>,
    joinAndStatement: JoinAndStatements<any, any, any, any> | null,
    rootTableOrAssociationAlias: TableOrAssociationName<Schema>
  ) {
    if (!joinAndStatement) return join

    join = this._applyJoinAndStatements(join, joinAndStatement.and, rootTableOrAssociationAlias)
    join = this._applyJoinAndStatements(join, joinAndStatement.andNot, rootTableOrAssociationAlias, {
      negate: true,
    })
    join = this._applyJoinAndAnyStatements(join, joinAndStatement.andAny, rootTableOrAssociationAlias)

    return join
  }

  private _applyJoinAndStatements<Schema extends DreamInstance['schema']>(
    join: JoinBuilder<any, any>,
    joinAndStatement: WhereStatement<any, any, any> | undefined,
    rootTableOrAssociationAlias: TableOrAssociationName<Schema>,
    {
      negate = false,
    }: {
      negate?: boolean
    } = {}
  ) {
    if (!joinAndStatement) return join

    return join.on((eb: ExpressionBuilder<any, any>) =>
      this.joinAndStatementToExpressionWrapper(joinAndStatement, rootTableOrAssociationAlias, eb, {
        negate,
        disallowSimilarityOperator: negate,
      })
    )
  }

  private _applyJoinAndAnyStatements<Schema extends DreamInstance['schema']>(
    join: JoinBuilder<any, any>,
    joinAndAnyStatement: WhereStatement<any, any, any>[] | undefined,
    rootTableOrAssociationAlias: TableOrAssociationName<Schema>
  ) {
    if (!joinAndAnyStatement) return join
    if (!joinAndAnyStatement.length) return join

    return join.on((eb: ExpressionBuilder<any, any>) => {
      return eb.or(
        joinAndAnyStatement.map(joinAndStatement =>
          this.joinAndStatementToExpressionWrapper(joinAndStatement, rootTableOrAssociationAlias, eb)
        )
      )
    })
  }

  private joinAndStatementToExpressionWrapper<Schema extends DreamInstance['schema']>(
    joinAndStatement: WhereStatement<any, any, any>,
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

      Object.keys(joinAndStatement).reduce((agg: any, key: any) => {
        agg[this.namespaceColumn(key.toString(), rootTableOrAssociationAlias)] = joinAndStatement[key]
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
  >(this: PostgresQueryDriver<DreamInstance>, kyselyQuery: QueryType): QueryType {
    this.checkForQueryViolations()

    const query = this.conditionallyApplyDefaultScopes()

    if (!isEmpty(query['innerJoinStatements'])) {
      kyselyQuery = this.recursivelyJoin({
        query: kyselyQuery,
        joinStatement: query['innerJoinStatements'],
        joinAndStatements: query['innerJoinAndStatements'],
        dreamClass: query['dreamClass'],
        previousAssociationTableOrAlias: this.query['baseSqlAlias'],
        joinType: 'inner',
      })
    }

    if (!isEmpty(query['leftJoinStatements'])) {
      kyselyQuery = this.recursivelyJoin({
        query: kyselyQuery,
        joinStatement: query['leftJoinStatements'],
        joinAndStatements: query['leftJoinAndStatements'],
        dreamClass: query['dreamClass'],
        previousAssociationTableOrAlias: this.query['baseSqlAlias'],
        joinType: 'left',
      })
    }

    if (
      query['whereStatements'].length ||
      query['whereNotStatements'].length ||
      query['whereAnyStatements'].length
    ) {
      kyselyQuery = (kyselyQuery as SelectQueryBuilder<any, any, any>).where(
        (eb: ExpressionBuilder<any, any>) =>
          eb.and([
            ...this.aliasWhereStatements(query['whereStatements'], query['baseSqlAlias']).map(
              whereStatement =>
                this.whereStatementToExpressionWrapper(eb, whereStatement, {
                  disallowSimilarityOperator: false,
                })
            ),

            ...this.aliasWhereStatements(query['whereNotStatements'], query['baseSqlAlias']).map(
              whereNotStatement =>
                this.whereStatementToExpressionWrapper(eb, whereNotStatement, { negate: true })
            ),

            ...query['whereAnyStatements'].map(whereAnyStatements =>
              eb.or(
                this.aliasWhereStatements(whereAnyStatements, query['baseSqlAlias']).map(whereAnyStatement =>
                  this.whereStatementToExpressionWrapper(eb, whereAnyStatement)
                )
              )
            ),
          ])
      ) as QueryType
    }

    return kyselyQuery
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
      const column = attr.split('.').at(-1)
      if ((this.query['passthroughOnStatement'] as any)[column!] === undefined)
        throw new MissingRequiredPassthroughForAssociationAndClause(column!)
      val = (this.query['passthroughOnStatement'] as any)[column!]
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
      c = val.map(v =>
        v instanceof DateTime || v instanceof CalendarDate
          ? v.toSQL()
          : typeof v === 'string'
            ? normalizeUnicode(v)
            : v
      )
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

    if (c instanceof DateTime || c instanceof CalendarDate) c = c.toSQL()
    else if (typeof c === 'string') c = normalizeUnicode(c)

    if (c2 instanceof DateTime || c2 instanceof CalendarDate) c2 = c2.toSQL()
    else if (typeof c2 === 'string') c2 = normalizeUnicode(c2)

    if (a && c === undefined) throw new CannotPassUndefinedAsAValueToAWhereClause(this.dreamClass, a)
    if (a2 && c2 === undefined) throw new CannotPassUndefinedAsAValueToAWhereClause(this.dreamClass, a2)

    return { a, b, c, a2, b2, c2 }
  }

  private recursivelyJoin<
    QueryType extends
      | SelectQueryBuilder<any, any, any>
      | UpdateQueryBuilder<any, any, any, any>
      | DeleteQueryBuilder<any, any, any>,
    Schema extends DreamInstance['schema'],
  >({
    query,
    joinStatement,
    joinAndStatements,
    dreamClass,
    previousAssociationTableOrAlias,
    joinType,
  }: {
    query: QueryType
    joinStatement: RelaxedJoinStatement
    joinAndStatements: RelaxedJoinAndStatement<any, any>
    dreamClass: typeof Dream
    previousAssociationTableOrAlias: TableOrAssociationName<Schema>
    joinType: 'inner' | 'left'
  }): QueryType {
    for (const currentAssociationTableOrAlias of Object.keys(joinStatement)) {
      const results = this.applyOneJoin({
        query,
        dreamClass,
        previousAssociationTableOrAlias,
        currentAssociationTableOrAlias,
        joinAndStatements,
        joinType,
      })

      query = results.query
      const association = results.association

      query = this.recursivelyJoin({
        query,
        joinStatement: joinStatement[currentAssociationTableOrAlias] as any,
        joinAndStatements: joinAndStatements[currentAssociationTableOrAlias] as any,
        dreamClass: association.modelCB() as typeof Dream,
        previousAssociationTableOrAlias: currentAssociationTableOrAlias,
        joinType,
      })
    }

    return query
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
   *
   */
  private associationNamesToDreamClassesMap(
    associationNames: string[],
    associationsToDreamClassesMap: AssociationNameToDreamClassMap = {}
  ): AssociationNameToDreamClassMap {
    const namesToAssociationsAndDreamClasses =
      this.associationNamesToAssociationDataAndDreamClassesMap(associationNames)
    return Object.keys(namesToAssociationsAndDreamClasses).reduce((remap, associationName) => {
      const associationAndDreamClass = namesToAssociationsAndDreamClasses[associationName]
      if (associationAndDreamClass === undefined) throw new UnexpectedUndefined()

      remap[associationName] = associationAndDreamClass.dreamClass
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
      const associationAndDreamClass = namesToAssociationsAndDreamClasses[associationName]
      if (associationAndDreamClass === undefined) throw new UnexpectedUndefined()

      remap[associationName] = associationAndDreamClass.association
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
      if (association === undefined) throw new UnexpectedUndefined()

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
      if (alias === undefined) throw new UnexpectedUndefined()
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
    throughAssociation: AssociationStatement
    throughAssociationDreamClass: typeof Dream
  } {
    const throughAssociation = dreamClass['getAssociationMetadata'](through)
    if (throughAssociation === undefined) throw new UnexpectedUndefined()

    const throughAssociationDreamClass = throughAssociation.modelCB() as typeof Dream
    return { throughAssociation, throughAssociationDreamClass }
  }

  /**
   * @internal
   *
   * Returns a namespaced column name
   *
   * @returns A string
   */
  private namespaceColumn(column: string, alias: string = this.query['baseSqlAlias']) {
    return namespaceColumn(column, alias)
  }

  private checkForQueryViolations(this: PostgresQueryDriver<DreamInstance>) {
    const invalidWhereNotClauses = this.similarityStatementBuilder().whereNotStatementsWithSimilarityClauses()
    if (invalidWhereNotClauses.length) {
      const invalidWhereNotClause = invalidWhereNotClauses[0]

      if (invalidWhereNotClause === undefined) throw new UnexpectedUndefined()

      const { tableName, columnName, opsStatement } = invalidWhereNotClause
      throw new CannotNegateSimilarityClause(tableName, columnName, opsStatement.value)
    }
  }

  private similarityStatementBuilder(this: PostgresQueryDriver<DreamInstance>) {
    return new SimilarityBuilder(this.dreamInstance, {
      where: [...this.query['whereStatements']],
      whereNot: [...this.query['whereNotStatements']],
      joinAndStatements: this.query['innerJoinAndStatements'],
      transaction: this.query['dreamTransaction'],
      connection: this.query['connectionOverride'],
    })
  }

  /**
   * @internal
   *
   * Applies a preload statement
   */
  private async applyPreload(
    this: PostgresQueryDriver<DreamInstance>,
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
        if (value === undefined) throw new UnexpectedUndefined()
        // filter out plain objects, but not ops and not and/andNot/andAny statements
        // because plain objects are just the next level of nested preload
        if (
          key === 'and' ||
          key === 'andNot' ||
          key === 'andAny' ||
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
    if (this.query['bypassAllDefaultScopes'] || this.query['bypassAllDefaultScopesExceptOnAssociations'])
      return this.query

    const thisScopes = this.dreamClass['scopes'].default
    let query: Query<DreamInstance, any> = this.query
    for (const scope of thisScopes) {
      if (
        !shouldBypassDefaultScope(scope.method, {
          defaultScopesToBypass: [
            ...this.query['defaultScopesToBypass'],
            ...this.query['defaultScopesToBypassExceptOnAssociations'],
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
    association: AssociationStatement
    previousAssociationTableOrAlias: TableOrAssociationName<Schema>
    throughAssociations: (HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>)[]
    joinType: JoinTypes
  }): {
    query: QueryType
    dreamClass: typeof Dream
    association: AssociationStatement
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
    joinAndStatements = {},
    throughAssociations = [],
    joinType,
  }: {
    query: QueryType
    dreamClass: typeof Dream
    previousAssociationTableOrAlias: TableOrAssociationName<Schema>
    currentAssociationTableOrAlias: TableOrAssociationName<Schema>
    joinAndStatements?: RelaxedJoinAndStatement<any, any>
    throughAssociations?: (HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>)[]

    joinType: JoinTypes
  }): {
    query: QueryType
    association: AssociationStatement
    previousAssociationTableOrAlias: TableOrAssociationName<Schema>
    currentAssociationTableOrAlias: TableOrAssociationName<Schema>
  } {
    const { name, alias } = extractAssociationMetadataFromAssociationName(currentAssociationTableOrAlias)
    const joinAndStatement = joinAndStatements[currentAssociationTableOrAlias] as RelaxedJoinAndStatement<
      DB,
      Schema
    >

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
      throughAssociations.length && throughAssociations[0]?.source === association.as

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
          innerJoinStatements: this.query['innerJoinStatements'],
          leftJoinStatements: this.query['leftJoinStatements'],
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
                join = this.applyAssociationAndStatementsToJoinStatement({
                  join,
                  association: throughAssociation,
                  currentAssociationTableOrAlias,
                  previousAssociationTableOrAlias: originalPreviousAssociationTableOrAlias,
                  joinAndStatements,
                })
              }
            )
          }

          join = this.conditionallyApplyDefaultScopesDependentOnAssociation({
            join,
            tableNameOrAlias: currentAssociationTableOrAlias,
            association,
          })

          join = this.applyJoinAndStatement(join, joinAndStatement, currentAssociationTableOrAlias)

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
                join = this.applyAssociationAndStatementsToJoinStatement({
                  join,
                  association: throughAssociation,
                  currentAssociationTableOrAlias,
                  previousAssociationTableOrAlias: originalPreviousAssociationTableOrAlias,
                  joinAndStatements,
                })
              }
            )
          }

          join = this.applyAssociationAndStatementsToJoinStatement({
            join,
            association,
            currentAssociationTableOrAlias,
            previousAssociationTableOrAlias,
            joinAndStatements,
          })

          join = this.conditionallyApplyDefaultScopesDependentOnAssociation({
            join,
            tableNameOrAlias: currentAssociationTableOrAlias,
            association,
          })

          join = this.applyJoinAndStatement(join, joinAndStatement, currentAssociationTableOrAlias)

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

    if (typeof orderStatement === 'string') {
      selectQuery = selectQuery.orderBy(this.namespaceColumn(orderStatement, tableNameOrAlias), 'asc')
    } else {
      Object.keys(orderStatement as Record<string, OrderDir>).forEach(column => {
        const direction = (orderStatement as any)[column] as OrderDir
        selectQuery = selectQuery.orderBy(this.namespaceColumn(column, tableNameOrAlias), direction)
      })
    }

    return selectQuery as QueryType
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

  private applyAssociationAndStatementsToJoinStatement({
    join,
    currentAssociationTableOrAlias,
    previousAssociationTableOrAlias,
    association,
    joinAndStatements,
  }: {
    join: JoinBuilder<any, any>
    currentAssociationTableOrAlias: string
    previousAssociationTableOrAlias: string
    association: HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>
    joinAndStatements: RelaxedJoinAndStatement<any, any>
  }) {
    if (association.and) {
      this.throwUnlessAllRequiredWhereClausesProvided(
        association,
        currentAssociationTableOrAlias,
        joinAndStatements
      )

      join = join.on((eb: ExpressionBuilder<any, any>) =>
        this.whereStatementToExpressionWrapper(
          eb,
          this.aliasWhereStatement(
            association.and as WhereStatement<any, any, any>,
            currentAssociationTableOrAlias
          ),
          { disallowSimilarityOperator: false }
        )
      )
    }

    if (association.andNot) {
      join = join.on((eb: ExpressionBuilder<any, any>) =>
        this.whereStatementToExpressionWrapper(
          eb,
          this.aliasWhereStatement(
            association.andNot as WhereStatement<any, any, any>,
            currentAssociationTableOrAlias
          ),
          { negate: true }
        )
      )
    }

    if (association.andAny) {
      join = join.on((eb: ExpressionBuilder<any, any>) =>
        eb.or(
          (association.andAny as WhereStatement<any, any, any>[]).map(whereAnyStatement =>
            this.whereStatementToExpressionWrapper(
              eb,
              this.aliasWhereStatement(whereAnyStatement, currentAssociationTableOrAlias),
              { disallowSimilarityOperator: false }
            )
          )
        )
      )
    }

    if (association.selfAnd) {
      join = join.on((eb: ExpressionBuilder<any, any>) =>
        this.whereStatementToExpressionWrapper(
          eb,
          this.rawifiedSelfOnClause({
            associationAlias: association.as,
            selfAlias: previousAssociationTableOrAlias,
            selfAndClause: association.selfAnd as any,
          })
        )
      )
    }

    if (association.selfAndNot) {
      join = join.on((eb: ExpressionBuilder<any, any>) =>
        this.whereStatementToExpressionWrapper(
          eb,
          this.rawifiedSelfOnClause({
            associationAlias: association.as,
            selfAlias: previousAssociationTableOrAlias,
            selfAndClause: association.selfAndNot as any,
          }),
          { negate: true }
        )
      )
    }

    return join
  }

  private throwUnlessAllRequiredWhereClausesProvided(
    association: HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>,
    namespace: string,
    joinAndStatements: RelaxedJoinAndStatement<any, any>
  ) {
    const andClause = association.and!
    const columnsRequiringAndStatements = Object.keys(andClause).reduce((agg, column) => {
      if (andClause[column] === DreamConst.required) agg.push(column)
      return agg
    }, [] as string[])

    const missingRequiredWhereStatements = columnsRequiringAndStatements.filter(
      column => (joinAndStatements[namespace] as any)?.and?.[column] === undefined
    )

    if (missingRequiredWhereStatements.length)
      throw new MissingRequiredAssociationAndClause(association, missingRequiredWhereStatements[0])
  }

  private conditionallyApplyDefaultScopesDependentOnAssociation({
    join,
    tableNameOrAlias,
    association,
  }: {
    join: JoinBuilder<any, any>
    tableNameOrAlias: string
    association: AssociationStatement
  }) {
    let scopesQuery = new Query<DreamInstance>(this.dreamInstance)
    const associationClass = association.modelCB() as typeof Dream
    const associationScopes = associationClass['scopes'].default

    for (const scope of associationScopes) {
      if (
        !shouldBypassDefaultScope(scope.method, {
          bypassAllDefaultScopes: this.query['bypassAllDefaultScopes'],
          defaultScopesToBypass: [
            ...this.query['defaultScopesToBypass'],
            ...(association.withoutDefaultScopes || []),
          ],
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

    if (scopesQuery['whereStatements'].length) {
      join = join.on((eb: ExpressionBuilder<any, any>) =>
        eb.and(
          scopesQuery['whereStatements'].flatMap(whereStatement =>
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

  /**
   * @internal
   *
   * Applies a preload statement
   */
  private async applyOnePreload(
    this: PostgresQueryDriver<DreamInstance>,
    associationName: string,
    dreams: Dream | Dream[],
    onStatement: RelaxedPreloadOnStatement<any, any> = {}
  ) {
    if (!Array.isArray(dreams)) dreams = [dreams] as Dream[]

    const dream = dreams.find(dream => dream['getAssociationMetadata'](associationName))!
    if (!dream) return

    const { name, alias } = extractAssociationMetadataFromAssociationName(associationName)

    const association = dream['getAssociationMetadata'](name)
    if (association === undefined) throw new UnexpectedUndefined()

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

    const hydrationData: any[][] = await associationDataScope['_connection'](this.connectionOverride)
      .innerJoin(associationName, (onStatement || {}) as JoinAndStatements<any, any, any, any>)
      .pluck(...columnsToPluck)

    const preloadedDreamsAndWhatTheyPointTo: PreloadedDreamsAndWhatTheyPointTo[] = hydrationData.map(
      pluckedData => {
        const attributes = {} as any
        dreamClassToHydrateColumns.forEach(
          (columnName, index) =>
            (attributes[protectAgainstPollutingAssignment(columnName)] = pluckedData[index])
        )

        const hydratedDream = this.dbResultToDreamInstance(attributes, dreamClassToHydrate)

        throughColumnsToHydrate.forEach(
          (throughAssociationColumn, index) =>
            ((hydratedDream as any).preloadedThroughColumns[throughAssociationColumn] =
              pluckedData[dreamClassToHydrateColumns.length + index])
        )

        return {
          dream: hydratedDream,
          pointsToPrimaryKey: pluckedData.at(-1),
        }
      }
    )

    this.hydrateAssociation(dreams, association, preloadedDreamsAndWhatTheyPointTo)

    return preloadedDreamsAndWhatTheyPointTo.map(obj => obj.dream)
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
    this: PostgresQueryDriver<DreamInstance>,
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
      const field = association.foreignKeyTypeField()
      return dream[field] === associatedDreamClass['stiBaseClassOrOwnClassName'] || dream[field] === null
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
      bypassAllDefaultScopesExceptOnAssociations?: boolean | undefined
      defaultScopesToBypassExceptOnAssociations?: AllDefaultScopeNames<DreamInstance>[] | undefined
    } = {}
  ): Query<InstanceType<T>, DefaultQueryTypeOptions<DreamInstance>> {
    const associationQuery = dreamClass.query().clone({
      passthroughOnStatement: this.query['passthroughOnStatement'],
      bypassAllDefaultScopes: this.query['bypassAllDefaultScopes'],
      bypassAllDefaultScopesExceptOnAssociations,
      defaultScopesToBypass: this.query['defaultScopesToBypass'],
      defaultScopesToBypassExceptOnAssociations,
    })

    return (this.dreamTransaction ? associationQuery.txn(this.dreamTransaction) : associationQuery) as Query<
      InstanceType<T>,
      DefaultQueryTypeOptions<DreamInstance>
    >
  }

  private conditionallyAttachSimilarityColumnsToSelect(
    this: PostgresQueryDriver<DreamInstance>,
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
    this: PostgresQueryDriver<DreamInstance>,
    kyselyQuery: UpdateQueryBuilder<DreamInstance['DB'], any, any, any>
  ) {
    const similarityBuilder = this.similarityStatementBuilder()
    if (similarityBuilder.hasSimilarityClauses) {
      kyselyQuery = similarityBuilder.update(kyselyQuery)
    }
    return kyselyQuery
  }
}

function getSourceAssociation(dream: Dream | typeof Dream | undefined, sourceName: string) {
  if (!dream) return
  if (!sourceName) return
  return (
    (dream as Dream)['getAssociationMetadata'](sourceName) ||
    (dream as Dream)['getAssociationMetadata'](pluralize.singular(sourceName))
  )
}
