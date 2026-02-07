// after building for esm, importing pg using the following:
//
//  import * as pg from 'pg'
//
// will crash. This is difficult to discover, since it only happens
// when being imported from our esm build.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pg from 'pg'

import {
  AliasedExpression,
  DeleteQueryBuilder,
  ExpressionBuilder,
  ExpressionWrapper,
  JoinBuilder,
  Kysely,
  ComparisonOperatorExpression as KyselyComparisonOperatorExpression,
  Transaction as KyselyTransaction,
  OrderByItemBuilder,
  PostgresDialect,
  SelectQueryBuilder,
  sql,
  SqlBool,
  Updateable,
  UpdateQueryBuilder,
} from 'kysely'
import pluralize from 'pluralize-esm'
import { CliFileWriter } from '../../cli/CliFileWriter.js'
import DreamCLI from '../../cli/index.js'
import { DialectProviderCb } from '../../db/DreamDbConnection.js'
import {
  CHECK_VIOLATION,
  COLUMN_OVERFLOW,
  INVALID_INPUT_SYNTAX,
  NOT_NULL_VIOLATION,
  pgErrorType,
} from '../../db/errors.js'
import syncDbTypesFiles from '../../db/helpers/syncDbTypesFiles.js'
import { default as _db } from '../../db/index.js'
import associationToGetterSetterProp from '../../decorators/field/association/associationToGetterSetterProp.js'
import PackageManager from '../../dream-app/helpers/PackageManager.js'
import DreamApp, { SingleDbCredential } from '../../dream-app/index.js'
import Dream from '../../Dream.js'
import ArrayTargetIncompatibleWithThroughAssociation from '../../errors/associations/ArrayTargetIncompatibleWithThroughAssociation.js'
import CannotJoinPolymorphicBelongsToError from '../../errors/associations/CannotJoinPolymorphicBelongsToError.js'
import JoinAttemptedOnMissingAssociation from '../../errors/associations/JoinAttemptedOnMissingAssociation.js'
import MissingRequiredAssociationAndClause from '../../errors/associations/MissingRequiredAssociationAndClause.js'
import MissingRequiredPassthroughForAssociationAndClause from '../../errors/associations/MissingRequiredPassthroughForAssociationAndClause.js'
import MissingThroughAssociation from '../../errors/associations/MissingThroughAssociation.js'
import MissingThroughAssociationSource from '../../errors/associations/MissingThroughAssociationSource.js'
import ThroughAssociationConditionsIncompatibleWithThroughAssociationSource from '../../errors/associations/ThroughAssociationConditionsIncompatibleWithThroughAssociationSource.js'
import CannotNegateSimilarityClause from '../../errors/CannotNegateSimilarityClause.js'
import CannotPassUndefinedAsAValueToAWhereClause from '../../errors/CannotPassUndefinedAsAValueToAWhereClause.js'
import CheckConstraintViolation from '../../errors/db/CheckConstraintViolation.js'
import ColumnOverflow from '../../errors/db/ColumnOverflow.js'
import DataTypeColumnTypeMismatch from '../../errors/db/DataTypeColumnTypeMismatch.js'
import NotNullViolation from '../../errors/db/NotNullViolation.js'
import UnexpectedUndefined from '../../errors/UnexpectedUndefined.js'
import camelize from '../../helpers/camelize.js'
import { SchemaBuilderInformationSchemaRow } from '../../helpers/cli/ASTBuilder.js'
import ASTGlobalSchemaBuilder from '../../helpers/cli/ASTGlobalSchemaBuilder.js'
import ASTSchemaBuilder from '../../helpers/cli/ASTSchemaBuilder.js'
import generateMigration from '../../helpers/cli/generateMigration.js'
import compact from '../../helpers/compact.js'
import EnvInternal from '../../helpers/EnvInternal.js'
import groupBy from '../../helpers/groupBy.js'
import isEmpty from '../../helpers/isEmpty.js'
import maybeNamespacedColumnNameToColumnName from '../../helpers/maybeNamespacedColumnNameToColumnName.js'
import namespaceColumn from '../../helpers/namespaceColumn.js'
import normalizeUnicode from '../../helpers/normalizeUnicode.js'
import objectPathsToArrays from '../../helpers/objectPathsToArrays.js'
import pascalize from '../../helpers/pascalize.js'
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
import { DbConnectionType, LegacyCompatiblePrimaryKeyType } from '../../types/db.js'
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
  SqlCommandType,
  TableOrAssociationName,
} from '../../types/dream.js'
import {
  DefaultQueryTypeOptions,
  JoinTypes,
  PreloadedDreamsAndWhatTheyPointTo,
  QueryToKyselyDBType,
  QueryToKyselyTableNamesType,
} from '../../types/query.js'
import CalendarDate from '../../utils/datetime/CalendarDate.js'
import { DateTime } from '../../utils/datetime/DateTime.js'
import { DreamConst, primaryKeyTypes } from '../constants.js'
import DreamTransaction from '../DreamTransaction.js'
import throughAssociationHasOptionsBesidesThroughAndSource from '../internal/associations/throughAssociationHasOptionsBesidesThroughAndSource.js'
import associationStringToNameAndAlias from '../internal/associationStringToNameAndAlias.js'
import executeDatabaseQuery from '../internal/executeDatabaseQuery.js'
import orderByDirection from '../internal/orderByDirection.js'
import shouldBypassDefaultScope from '../internal/shouldBypassDefaultScope.js'
import SimilarityBuilder from '../internal/similarity/SimilarityBuilder.js'
import softDeleteDream from '../internal/softDeleteDream.js'
import sqlResultToDreamInstance from '../internal/sqlResultToDreamInstance.js'
import Query from '../Query.js'
import QueryDriverBase from './Base.js'
import checkForNeedToBeRunMigrations from './helpers/kysely/checkForNeedToBeRunMigrations.js'
import foreignKeyTypeFromPrimaryKey from './helpers/kysely/foreignKeyTypeFromPrimaryKey.js'
import runMigration from './helpers/kysely/runMigration.js'

export default class KyselyQueryDriver<DreamInstance extends Dream> extends QueryDriverBase<DreamInstance> {
  // ATTENTION FRED
  // stop trying to make this async. You never learn...
  //
  // if you are attempting to leverage a kysely-based connection using a different driver,
  // you would want to extend this KyselyQueryDriver class, and then change this method
  // to return a custom kysely instance, tailored to the specific database connection
  // you are attempting to support. By default, dream is postgres-only, so our internal _db
  // function will return a kysely instance, tightly coupled to a postgres-specific connection.
  public dbFor(
    sqlCommandType: SqlCommandType
  ): Kysely<DreamInstance['DB']> | KyselyTransaction<DreamInstance['DB']> {
    const constructor = this.constructor as typeof KyselyQueryDriver
    return constructor.dbFor(
      this.dreamInstance.connectionName,
      this.dbConnectionType(sqlCommandType),
      this.dreamTransaction
    )
  }

  // if you are attempting to leverage a kysely-based connection using a different driver,
  // you would want to extend this KyselyQueryDriver class, and then change this method
  // to return a custom kysely instance, tailored to the specific database connection
  // you are attempting to support. By default, dream is postgres-only, so our internal _db
  // function will return a kysely instance, tightly coupled to a postgres-specific connection.
  public static dbFor<I extends Dream>(
    connectionName: string,
    dbConnectionType: DbConnectionType,
    dreamTransaction?: DreamTransaction<I> | null
  ): Kysely<I['DB']> | KyselyTransaction<I['DB']> {
    if (dreamTransaction?.kyselyTransaction) return dreamTransaction?.kyselyTransaction
    return _db<I>(
      connectionName || 'default',
      dbConnectionType,
      this.dialectProvider(connectionName, dbConnectionType)
    )
  }

  public static dialectProvider(
    connectionName: string,
    dbConnectionType: DbConnectionType
  ): DialectProviderCb {
    return (connectionConf: SingleDbCredential) =>
      new PostgresDialect({
        pool: new pg.Pool({
          user: connectionConf.user || '',
          password: connectionConf.password || '',
          database: DreamApp.getOrFail().dbName(connectionName, dbConnectionType),
          host: connectionConf.host || 'localhost',
          port: connectionConf.port || 5432,
          ssl: connectionConf.useSsl ? defaultPostgresSslConfig(connectionConf) : false,
        }),
      })
  }

  public static override async ensureAllMigrationsHaveBeenRun(connectionName: string) {
    const migrationsNeedToBeRun = await checkForNeedToBeRunMigrations({
      connectionName,
      dialectProvider: this.dialectProvider(connectionName, 'primary'),
    })

    if (migrationsNeedToBeRun) throw new Error(`Migrations need to be run on ${connectionName} database`)
  }

  /**
   * migrate the database. Must respond to the NODE_ENV value.
   */
  public static override async migrate(connectionName: string) {
    const dreamApp = DreamApp.getOrFail()
    const primaryDbConf = dreamApp.dbConnectionConfig(connectionName, 'primary')
    DreamCLI.logger.logStartProgress(`migrating ${primaryDbConf.name}...`)

    await runMigration({
      connectionName,
      mode: 'migrate',
      dialectProvider: this.dialectProvider(connectionName, 'primary'),
    })
    DreamCLI.logger.logEndProgress()

    await this.duplicateDatabase(connectionName)
  }

  /**
   * rollback the database. Must respond to the NODE_ENV value.
   */
  public static override async rollback(opts: { connectionName: string; steps: number }) {
    const dreamApp = DreamApp.getOrFail()
    const primaryDbConf = dreamApp.dbConnectionConfig(opts.connectionName || 'default', 'primary')
    DreamCLI.logger.logStartProgress(`rolling back ${primaryDbConf.name}...`)

    let step = opts.steps
    while (step > 0) {
      await runMigration({
        connectionName: opts.connectionName,
        mode: 'rollback',
        dialectProvider: this.dialectProvider(opts.connectionName, 'primary'),
      })
      step -= 1
    }
    DreamCLI.logger.logEndProgress()

    await this.duplicateDatabase(opts.connectionName)
  }

  /**
   * This should build a new migration file in the migrations folder
   * of your application. This will then need to be read and run
   * whenever the `migrate` method is called. The filename should
   * contain a timestamp at the front of the filename, so that it
   * is sorted by date in the file tree, and, more importantly, so
   * they can be run in order by your migration runner.
   */
  public static override async generateMigration(
    connectionName: string,
    migrationName: string,
    columnsWithTypes: string[]
  ) {
    await generateMigration({ migrationName, columnsWithTypes, connectionName })
  }

  /**
   * defines the syncing behavior for dream and psychic,
   * which is run whenever the `sync` command is called.
   * */
  public static override async sync(
    connectionName: string,
    onSync: () => Promise<void> | void,
    options: { schemaOnly?: boolean } = {}
  ) {
    try {
      if (!options?.schemaOnly) {
        await DreamCLI.logger.logProgress(
          `introspecting db for connection: ${connectionName}...`,
          async () => {
            // this calls kysely-codegen under the hood
            await syncDbTypesFiles(connectionName)
          }
        )
      }

      const newSchemaBuilder = new ASTSchemaBuilder(connectionName)

      await DreamCLI.logger.logProgress(
        `building dream schema for connection ${connectionName}...`,
        async () => {
          await newSchemaBuilder.build()
        }
      )

      if (newSchemaBuilder.hasForeignKeyError && !options?.schemaOnly) {
        await DreamCLI.logger.logProgress(
          'triggering resync to correct for foreign key errors...',

          async () => {
            // TODO: make this customizable to enable dream apps to separate
            const cliCmd = EnvInternal.boolean('DREAM_CORE_DEVELOPMENT') ? 'dream' : 'psy'

            await DreamCLI.spawn(PackageManager.runCmd(`${cliCmd} sync --schema-only`), {
              onStdout: str => {
                DreamCLI.logger.logContinueProgress(`${str}`, {
                  logPrefix: '  ├ [resync]',
                  logPrefixColor: 'blue',
                })
              },
            })
          }
        )
      }

      await new ASTGlobalSchemaBuilder().build()

      if (!options?.schemaOnly) {
        // intentionally leaving logs off here, since it allows other
        // onSync handlers to determine their own independent logging approach
        await onSync()
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)

      await DreamCLI.logger.logProgress('[dream] sync failed, reverting file contents...', async () => {
        await CliFileWriter.revert()
      })
    }
  }

  public static override get syncDialect(): string {
    return 'postgres'
  }

  /**
   * @internal
   *
   * returns the foreign key type based on the primary key received.
   * gives the driver the opportunity to switch i.e. bigserial to bigint.
   */
  public static override foreignKeyTypeFromPrimaryKey(primaryKey: LegacyCompatiblePrimaryKeyType) {
    return foreignKeyTypeFromPrimaryKey(primaryKey)
  }

  /**
   * @internal
   *
   * used to return the computed primary key type based
   * on the primaryKeyType set in the DreamApp class.
   */
  public static override primaryKeyType() {
    const dreamconf = DreamApp.getOrFail()

    switch (dreamconf.primaryKeyType) {
      case 'bigint':
      case 'bigserial':
      case 'uuid7':
      case 'uuid4':
      case 'uuid':
      case 'integer':
        return dreamconf.primaryKeyType

      default: {
        // protection so that if a new EncryptAlgorithm is ever added, this will throw a type error at build time
        const _never: never = dreamconf.primaryKeyType
        throw new Error(`
  ATTENTION!

    unrecognized primary key type "${_never as string}" found in .dream.yml.
    please use one of the allowed primary key types:
      ${primaryKeyTypes.join(', ')}
        `)
      }
    }
  }

  /**
   * destroys a dream, possibly implementing soft delete if reallyDestroy is false
   * and the record being deleted implements soft delete.
   *
   * @param dream - the dream instance you wish to destroy
   * @param txn - a transaction to encapsulate, consistently provided by underlying dream mechanisms
   * @param reallyDestroy - whether or not to reallyDestroy. If false, soft delete will be attempted when relevant
   */
  public static override async destroyDream(
    dream: Dream,
    txn: DreamTransaction<Dream>,
    reallyDestroy: boolean
  ) {
    if (shouldSoftDelete(dream, reallyDestroy)) {
      await softDeleteDream(dream, txn)
    } else if (!dream['_preventDeletion']) {
      await txn.kyselyTransaction
        .deleteFrom(dream.table as any)
        .where(dream['_primaryKey'], '=', dream.primaryKeyValue())
        .execute()
    }
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
  public override toKysely<
    QueryType extends 'select' | 'delete' | 'update',
    DbType = QueryToKyselyDBType<Query<DreamInstance>>,
    TableNames = QueryToKyselyTableNamesType<Query<DreamInstance>>,
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
        return this.buildSelect() as ToKyselyReturnType

      case 'delete':
        return this.buildDelete() as ToKyselyReturnType

      case 'update':
        return this.buildUpdate({}) as ToKyselyReturnType

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
   * Builds a new DreamTransaction instance, provides
   * the instance to the provided callback.
   *
   * ```ts
   * await ApplicationModel.transaction(async txn => {
   *   const user = await User.txn(txn).create({ email: 'how@yadoin' })
   *   await Pet.txn(txn).create({ user })
   * })
   * ```
   *
   * @param callback - A callback function to call. The transaction provided to the callback can be passed to subsequent database calls within the transaction callback
   * @returns void
   */
  public static override async transaction<
    DreamInstance extends Dream,
    CB extends (txn: DreamTransaction<DreamInstance>) => unknown,
    RetType extends ReturnType<CB>,
  >(dreamInstance: DreamInstance, callback: CB): Promise<RetType> {
    const dreamTransaction = new DreamTransaction()
    let callbackResponse: RetType = undefined as RetType

    await this.dbFor(dreamInstance.connectionName || 'default', 'primary')
      .transaction()
      .execute(async kyselyTransaction => {
        dreamTransaction.kyselyTransaction = kyselyTransaction
        callbackResponse = (await (callback as (txn: DreamTransaction<DreamInstance>) => Promise<unknown>)(
          dreamTransaction
        )) as RetType
      })

    await dreamTransaction.runAfterCommitHooks(dreamTransaction)

    return callbackResponse
  }

  /**
   * @internal
   *
   * this is used by getColumnData to serialize enums
   */
  public static enumType(row: SchemaBuilderInformationSchemaRow) {
    const enumName = pascalize(row.udtName.replace(/\[\]$/, ''))
    return enumName
  }

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
  public override async takeOne(this: KyselyQueryDriver<DreamInstance>): Promise<DreamInstance | null> {
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

      const driverClass = this.constructor as typeof KyselyQueryDriver
      return (await new driverClass(query)['executeJoinLoad']())[0] || null
    }

    const kyselyQuery = new (this.constructor as typeof KyselyQueryDriver)(this.query.limit(1)).buildSelect()
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
   * @internal
   *
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
  public override async takeAll(
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
  public override async max(columnName: string): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { max } = this.dbFor('select').fn
    let kyselyQuery = new (this.constructor as typeof KyselyQueryDriver)(this.query).buildSelect({
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
  public override async min(columnName: string): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { min } = this.dbFor('select').fn
    let kyselyQuery = new (this.constructor as typeof KyselyQueryDriver)(this.query).buildSelect({
      bypassSelectAll: true,
      bypassOrder: true,
    })

    kyselyQuery = kyselyQuery.select(min(columnName as any) as any)
    const data = await executeDatabaseQuery(kyselyQuery, 'executeTakeFirstOrThrow')

    return data.min
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
  public override async sum(columnName: string): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { sum } = this.dbFor('select').fn
    let kyselyQuery = new (this.constructor as typeof KyselyQueryDriver)(this.query).buildSelect({
      bypassSelectAll: true,
      bypassOrder: true,
    })

    kyselyQuery = kyselyQuery.select(sum(columnName as any) as any)
    const data = await executeDatabaseQuery(kyselyQuery, 'executeTakeFirstOrThrow')
    return data.sum === null ? null : parseFloat(data.sum)
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
  public override async avg(columnName: string): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { avg } = this.dbFor('select').fn
    let kyselyQuery = new (this.constructor as typeof KyselyQueryDriver)(this.query).buildSelect({
      bypassSelectAll: true,
      bypassOrder: true,
    })

    kyselyQuery = kyselyQuery.select(avg(columnName as any) as any)
    const data = await executeDatabaseQuery(kyselyQuery, 'executeTakeFirstOrThrow')
    return data.avg
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
  public override async count() {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { count } = this.dbFor('select').fn
    const distinctColumn = this.query['distinctColumn']
    const query = this.query.clone({ distinctColumn: null })

    let kyselyQuery = new (this.constructor as typeof KyselyQueryDriver)(query).buildSelect({
      bypassSelectAll: true,
      bypassOrder: true,
    })

    const countClause = distinctColumn
      ? count(sql`DISTINCT ${distinctColumn}`)
      : count(query['namespaceColumn'](query.dreamInstance['_primaryKey']))

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
  public override async pluck(...fields: DreamColumnNames<DreamInstance>[]): Promise<any[]> {
    let kyselyQuery = new (this.constructor as typeof KyselyQueryDriver)(this.query).buildSelect({
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
  public override nestedSelect<
    SimpleFieldType extends keyof DreamColumnNames<DreamInstance>,
    PluckThroughFieldType,
  >(
    this: KyselyQueryDriver<DreamInstance>,
    selection: SimpleFieldType | PluckThroughFieldType
  ): SelectQueryBuilder<any, any, any> {
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
  public override async delete(): Promise<number> {
    const deletionResult = await executeDatabaseQuery(this.buildDelete(), 'executeTakeFirst')
    return Number(deletionResult?.numDeletedRows || 0)
  }

  /**
   * executes provided query instance as an update query.
   * @returns the number of updated rows
   */
  public override async update(attributes: DreamTableSchema<DreamInstance>): Promise<number> {
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
  public static override async saveDream(dream: Dream, txn: DreamTransaction<Dream> | null = null) {
    const connectionName = (dream as any).connectionName || 'default'

    const db = txn?.kyselyTransaction ?? this.dbFor(connectionName, 'primary')

    const sqlifiedAttributes = sqlAttributes(dream)

    try {
      if (dream.isPersisted) {
        const query = db
          .updateTable(dream.table)
          .set(sqlifiedAttributes as any)
          .where(namespaceColumn(dream['_primaryKey'], dream.table), '=', dream.primaryKeyValue())
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
    } catch (error) {
      switch (pgErrorType(error)) {
        case COLUMN_OVERFLOW:
          throw new ColumnOverflow({
            dream,
            error: error instanceof Error ? error : new Error('database column overflow'),
          })

        case INVALID_INPUT_SYNTAX:
          throw new DataTypeColumnTypeMismatch({
            dream,
            error: error instanceof Error ? error : new Error('database column type error'),
          })

        case NOT_NULL_VIOLATION:
          throw new NotNullViolation({
            dream,
            error: error instanceof Error ? error : new Error('not null violation'),
          })

        case CHECK_VIOLATION:
          throw new CheckConstraintViolation({
            dream,
            error: error instanceof Error ? error : new Error('check constraint violation'),
          })
      }

      throw error
    }
  }

  public dbConnectionType(sqlCommandType: SqlCommandType): DbConnectionType {
    if (this.dreamTransaction) return 'primary'

    switch (sqlCommandType) {
      case 'select':
        return this.connectionOverride || (this.isReplicaSafe() ? 'replica' : 'primary')

      default:
        return 'primary'
    }
  }

  private isReplicaSafe(): boolean {
    return this.innerJoinDreamClasses.reduce(
      (accumulator, dreamClass) => accumulator && dreamClass['replicaSafe'],
      this.dreamClass['replicaSafe']
    )
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
  public override sql() {
    const kyselyQuery = this.buildSelect()
    return kyselyQuery.compile()
  }

  private buildDelete(this: KyselyQueryDriver<DreamInstance>): DeleteQueryBuilder<any, any, any> {
    const kyselyQuery = this.dbFor('delete').deleteFrom(
      this.query['baseSqlAlias'] as unknown as AliasedExpression<any, any>
    )

    const results = this.attachLimitAndOrderStatementsToNonSelectQuery(kyselyQuery as any)
    return new (this.constructor as typeof KyselyQueryDriver)(results.clone).buildCommon(results.kyselyQuery)
  }

  private buildSelect(
    this: KyselyQueryDriver<DreamInstance>,
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
      kyselyQuery = new (this.constructor as typeof KyselyQueryDriver)(query).buildSelect({
        bypassSelectAll: true,
      })
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
          this.orderByDirection(orderStatement.direction)
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

  public orderByDirection(direction: OrderDir | null): (obj: OrderByItemBuilder) => OrderByItemBuilder {
    return orderByDirection(direction)
  }

  private buildUpdate(
    attributes: Updateable<DreamInstance['table']>
  ): UpdateQueryBuilder<any, any, any, any> {
    let kyselyQuery = this.dbFor('update').updateTable(
      this.query['tableName'] as DreamInstance['table']
    ) as UpdateQueryBuilder<any, any, any, any>

    kyselyQuery = kyselyQuery.set(attributes as any)

    kyselyQuery = this.conditionallyAttachSimilarityColumnsToUpdate(kyselyQuery)

    const results = this.attachLimitAndOrderStatementsToNonSelectQuery(kyselyQuery as any)
    return new (this.constructor as typeof KyselyQueryDriver)(results.clone).buildCommon(results.kyselyQuery)
  }

  /**
   * @internal
   *
   * Used to hydrate dreams with the provided associations
   */
  public override hydrateAssociation(
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
        .filter(dream => dream.primaryKeyValue() === preloadedDreamAndWhatItPointsTo.pointsToPrimaryKey)
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
  public override async hydratePreload(this: KyselyQueryDriver<DreamInstance>, dream: Dream) {
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
    T extends KyselyQueryDriver<DreamInstance>,
    QueryType extends UpdateQueryBuilder<any, any, any, any> | DeleteQueryBuilder<any, any, any>,
  >(this: T, kyselyQuery: QueryType): { kyselyQuery: QueryType; clone: Query<DreamInstance> } {
    if (this.query['limitStatement'] || this.query['orderStatements'].length) {
      kyselyQuery = (kyselyQuery as any).where((eb: ExpressionBuilder<any, any>) => {
        const subquery = this.query.nestedSelect(this.dreamInstance['_primaryKey'])

        return eb(this.dreamInstance['_primaryKey'], 'in', subquery)
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

    let kyselyQuery = new (this.constructor as typeof KyselyQueryDriver)(query).buildSelect({
      bypassSelectAll: true,
    })

    const aliasToDreamClassesMap = {
      [this.query['baseSqlAlias']]: this.dreamClass,
      ...this.joinStatementsToDreamClassesMap(this.query['leftJoinStatements']),
    }

    const associationAliasToColumnAliasMap: Record<string, Record<string, string>> = {}
    const aliasToAssociationsMap = this.joinStatementsToAssociationsMap(this.query['leftJoinStatements'])

    const aliases = Object.keys(aliasToDreamClassesMap)

    let nextColumnAliasCounter = 0

    aliases.forEach((aliasOrExpression: string) => {
      const { name, alias: _alias } = associationStringToNameAndAlias(aliasOrExpression)
      const alias = _alias || name

      associationAliasToColumnAliasMap[alias] ||= {}
      const aliasedDreamClass = aliasToDreamClassesMap[alias]
      if (aliasedDreamClass === undefined) throw new UnexpectedUndefined()

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

      aliasToDreamIdMap[protectAgainstPollutingAssignment(currentAlias)]?.set(primaryKeyValue, dream)
    }

    const dream = aliasToDreamIdMap[currentAlias].get(primaryKeyValue)

    Object.keys(leftJoinStatements).forEach(nextAlias => {
      const { name: associationName, alias: _alias } = associationStringToNameAndAlias(nextAlias)
      const alias = _alias || associationName

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
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
  >(this: KyselyQueryDriver<DreamInstance>, kyselyQuery: QueryType): QueryType {
    this.checkForQueryViolations()

    const query = this.conditionallyApplyDefaultScopes()

    if (!isEmpty(query['innerJoinStatements'])) {
      kyselyQuery = this.recursivelyJoin({
        query: kyselyQuery,
        joinStatement: query['innerJoinStatements'],
        joinAndStatements: query['innerJoinAndStatements'],
        dreamClass: query['dreamClass'],
        // As recursivelyJoin progresses through the chain of associations that
        // the developer has inclued in a join statement (e.g. `leftJoinPreload('hello as ho', 'world as wd')`),
        // previousTableAlias will be modified so that the join statement can properly reference
        // what we are joining on. When an `associationQuery` is the start of a join, then `baseSqlAlias` is set,
        // this is passed into the very beginning of recursivelyJoin.
        previousTableAlias: this.query['baseSqlAlias'],
        joinType: 'inner',
      })
    }

    if (!isEmpty(query['leftJoinStatements'])) {
      kyselyQuery = this.recursivelyJoin({
        query: kyselyQuery,
        joinStatement: query['leftJoinStatements'],
        joinAndStatements: query['leftJoinAndStatements'],
        dreamClass: query['dreamClass'],
        // As recursivelyJoin progresses through the chain of associations that
        // the developer has inclued in a join statement (e.g. `leftJoinPreload('hello as ho', 'world as wd')`),
        // previousTableAlias will be modified so that the join statement can properly reference
        // what we are joining on. When an `associationQuery` is the start of a join, then `baseSqlAlias` is set,
        // this is passed into the very beginning of recursivelyJoin.
        previousTableAlias: this.query['baseSqlAlias'],
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
    const isNotNullStatement = eb(a, 'is not', null)
    const compactedC = compact(c)

    if (compactedC.length) return eb.and([eb(a, 'not in', compactedC), isNotNullStatement])
    return isNotNullStatement
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
      const column = maybeNamespacedColumnNameToColumnName(attr)
      if ((this.query['passthroughOnStatement'] as any)[column] === undefined)
        throw new MissingRequiredPassthroughForAssociationAndClause(column)
      val = (this.query['passthroughOnStatement'] as any)[column]
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
    DB extends DreamInstance['DB'],
    Schema extends DreamInstance['schema'],
  >({
    query,
    joinStatement,
    joinAndStatements,
    dreamClass,
    previousTableAlias,
    joinType,
  }: {
    query: QueryType
    joinStatement: RelaxedJoinStatement
    joinAndStatements: RelaxedJoinAndStatement<any, any>
    dreamClass: typeof Dream
    previousTableAlias: string
    joinType: 'inner' | 'left'
  }): QueryType {
    for (const associationString of Object.keys(joinStatement)) {
      const joinAndStatement = joinAndStatements[associationString] as RelaxedJoinAndStatement<DB, Schema>

      const { association, alias } = associationStringToAssociationAndMaybeAlias({
        dreamClass,
        associationString,
      })

      const results = this.applyOneJoin({
        query,
        dreamClass,
        association,
        previousTableAlias,
        explicitAlias: alias,
        joinAndStatement,
        joinType,
        previousThroughAssociation: undefined,
        dreamClassThroughAssociationWantsToHydrate: undefined,
      })

      query = results.query

      /**
       * If the returned association links to multiple models, then it is a polymorphic BelongsTo association,
       * and we can only join through a polymorphic BelongsTo association when the association included in
       * the join statement is a `through` association that clamps the types on the other side of the polymorphic
       * BelongsTo down to a single Dream model. So if an array, use the associated type of the association
       * included in the join statement.
       */
      const nextDreamClass = Array.isArray(results.association.modelCB())
        ? association.modelCB()
        : results.association.modelCB()

      query = this.recursivelyJoin({
        query,
        joinStatement: joinStatement[associationString] as RelaxedJoinStatement,
        joinAndStatements: joinAndStatement,
        dreamClass: nextDreamClass as typeof Dream,
        previousTableAlias: alias || association.as,
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
      const { name, alias: _alias } = associationStringToNameAndAlias(associationName)
      const alias = _alias || name
      const association = dreamClass['getAssociationMetadata'](name)
      if (association === undefined) throw new UnexpectedUndefined()

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

  private checkForQueryViolations(this: KyselyQueryDriver<DreamInstance>) {
    const invalidWhereNotClauses = this.similarityStatementBuilder().whereNotStatementsWithSimilarityClauses()
    if (invalidWhereNotClauses.length) {
      const invalidWhereNotClause = invalidWhereNotClauses[0]

      if (invalidWhereNotClause === undefined) throw new UnexpectedUndefined()

      const { tableName, columnName, opsStatement } = invalidWhereNotClause
      throw new CannotNegateSimilarityClause(tableName, columnName, opsStatement.value)
    }
  }

  private similarityStatementBuilder(this: KyselyQueryDriver<DreamInstance>) {
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
    this: KyselyQueryDriver<DreamInstance>,
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

      if (nestedDreams.length) {
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
   * Recursively traverse the through association chain until we reach a non-through association.
   * The non-through association is the association that joins the model with the through
   * association's intended source (the model that it wants to pull into scope). The non-through
   * association is added to the query, and then the process continues with the source on the other
   * side of that association, which may itself be a through association, resulting in another
   * recursive call to joinsBridgeThroughAssociations.
   *
   * A chain of through associations on a single Dream model class may be used to join through
   * several other models. For example, given the following:
   *
   * ```
   * model MyModel
   *   @deco.HasOne('OtherModel')
   *   public otherModel
   *
   *   @deco.HasOne('A', { through: 'otherModel', source: 'a' })
   *   public myA
   *
   *   @deco.HasOne('B', { through: 'myA', source: 'b' })
   *   public myB
   *
   * model OtherModel
   *   @deco.HasOne('AToOtherModelJoinModel')
   *   public aToOtherModelJoinModel
   *
   *   @deco.HasOne('A', { through: 'aToOtherModelJoinModel' })
   *   public a
   *
   * model AToOtherModelJoinModel
   *   @deco.BelongsTo('A')
   *   public a
   *
   *   @deco.BelongsTo('OtherModel
   *   public otherModel
   *
   * model A
   *   @deco.HasOne('B')
   *   public b
   * ```
   *
   * Then `MyModel.leftJoinPreload('myB')` is processed as follows:
   * - `applyOneJoin` is called with the `myB` association
   *   - `joinsBridgeThroughAssociations` is called with the `myB` association
   *     - `joinsBridgeThroughAssociations` is called with the `myA` association
   *       - `addAssociationJoinStatementToQuery` is called with the `otherModel` association
   *       - `applyOneJoin` is called with the `a` association from OtherModel
   *         - `joinsBridgeThroughAssociations` is called with the `a` association from OtherModel
   *           // throw ThroughAssociationConditionsIncompatibleWithThroughAssociationSource if
   *           // myA in MyModel defines conditions, distinct, or order
   *           - `addAssociationJoinStatementToQuery` is called with the `aToOtherModelJoinModel` association
   *           - `applyOneJoin` is called with the `a` association from AToOtherModelJoinModel with conditions (if present) on `a` defined on OtherModel
   *             - `addAssociationJoinStatementToQuery` is called with the `myA` association
   *     - `applyOneJoin` is called with the `b` association from A with conditions (if present) from `myB` defined on MyModel
   *       - `addAssociationJoinStatementToQuery` is called with the `myB` association
   */

  private joinsBridgeThroughAssociations<
    QueryType extends
      | SelectQueryBuilder<any, any, any>
      | UpdateQueryBuilder<any, any, any, any>
      | DeleteQueryBuilder<any, any, any>,
  >({
    query,
    dreamClassTheAssociationIsDefinedOn,
    throughAssociation,
    /**
     * If the join statement includes an explicit alias, e.g.,
     * `leftJoinPreload('hello as ho', 'world as wd')`
     * then explicitAlias is set (e.g., to 'ho' the first time that `recursivelyJoin`
     * calls this method and to 'ho' the second time `recursivelyJoin` is called)
     * If only implicit aliasing happens (based on association name)
     * (e.g. `leftJoinPreload('hello', 'world')`), then explicitAlias is null
     */
    explicitAlias,
    /**
     * previousTableAlias is always set
     */
    previousTableAlias,
    joinAndStatement,
    joinType,
  }: {
    query: QueryType
    dreamClassTheAssociationIsDefinedOn: typeof Dream
    throughAssociation: HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>
    explicitAlias: string | undefined
    previousTableAlias: string
    joinAndStatement: RelaxedJoinAndStatement<any, any>
    joinType: JoinTypes
  }): {
    query: QueryType
    association: AssociationStatement
  } {
    /**
     * `through` associations always point to other associations on the same model
     * they are defined on. So when we want to find an association referenced by a
     * through association, we look on the same model as the through association
     */
    const associationReferencedByThroughAssociation = dreamClassTheAssociationIsDefinedOn[
      'getAssociationMetadata'
    ](throughAssociation.through)

    if (!associationReferencedByThroughAssociation) {
      // Type protection on association declarations should protect against this ever actually being reached
      throw new MissingThroughAssociation({
        dreamClass: dreamClassTheAssociationIsDefinedOn,
        association: throughAssociation,
      })
    }

    let recursiveResult: {
      query: QueryType
      association: AssociationStatement
    }

    const addingNestedThroughAssociation =
      associationReferencedByThroughAssociation.type !== 'BelongsTo' &&
      associationReferencedByThroughAssociation.through

    if (addingNestedThroughAssociation) {
      /**
       * This new association is itself a through association, so we recursively
       * call joinsBridgeThroughAssociations.
       */
      recursiveResult = this.joinsBridgeThroughAssociations({
        query,
        /**
         * `through` associations always point to other associations on the same model
         * they are defined on. So when this association is a through association,
         * we can simply pass the dreamClassAssociationDefinedIn we already have
         */
        dreamClassTheAssociationIsDefinedOn,
        throughAssociation: associationReferencedByThroughAssociation,
        explicitAlias: undefined,
        previousTableAlias,
        joinAndStatement: {},
        joinType,
      })

      //
    } else {
      /**
       * We have reached the association at the end of the through chain, the final
       * association that we pass _through_ to reach the model class on which the
       * _source_ association of the through association is found. That source
       * association will be added to the query as the next step at the end of this
       * method.
       */

      recursiveResult = this.addAssociationJoinStatementToQuery({
        query,
        dreamClass: dreamClassTheAssociationIsDefinedOn,
        association: associationReferencedByThroughAssociation,
        /**
         * The explicit alias is reserved for the final association, not intermediary join tables
         */
        explicitAlias: undefined,
        previousTableAlias,
        selfTableAlias: previousTableAlias,
        /**
         * The joinAndStatement is reserved for the final association, not intermediary join tables
         */
        joinAndStatement: {},
        previousThroughAssociation: undefined,
        joinType,
        dreamClassThroughAssociationWantsToHydrate: undefined,
      })
    }

    const dreamClassWithSourceAssociation =
      associationReferencedByThroughAssociation.modelCB() as typeof Dream

    if (Array.isArray(dreamClassWithSourceAssociation))
      throw new ArrayTargetIncompatibleWithThroughAssociation({
        dreamClass: dreamClassTheAssociationIsDefinedOn,
        association: throughAssociation,
      })

    const sourceAssociation = getSourceAssociation(dreamClassWithSourceAssociation, throughAssociation.source)
    if (!sourceAssociation)
      throw new MissingThroughAssociationSource({
        dreamClass: dreamClassTheAssociationIsDefinedOn,
        association: throughAssociation,
        throughClass: dreamClassWithSourceAssociation,
      })

    /**
     * When the source is a polymorphic BelongsTo association, use the target of the through
     * association to determine which class to target.
     */
    const dreamClassThroughAssociationWantsToHydrate = Array.isArray(sourceAssociation.modelCB())
      ? throughAssociation.modelCB()
      : undefined

    /**
     * Add the source that `sourceAssociation` points to. Note that since joinsBridgeThroughAssociations
     * is recursive, it may have added other through associations to the query in between when this
     * particular method call started and now.
     */

    return this.applyOneJoin({
      query: recursiveResult.query,
      dreamClass: dreamClassWithSourceAssociation,
      association: sourceAssociation,
      // since joinsBridgeThroughAssociations passes undefined to explicitAlias recursively, we know this is only set on the
      // first call to joinsBridgeThroughAssociations, which corresponds to the outermoset through association and therefore
      // the last source association to be added to the statement (because joinsBridgeThroughAssociations was called
      // recursively and therefore may have added other through associations and their sources prior to reaching this point)
      explicitAlias,
      previousTableAlias: recursiveResult.association.as,
      selfTableAlias:
        (throughAssociation.selfAnd ?? throughAssociation.selfAndNot)
          ? previousTableAlias
          : recursiveResult.association.as,
      // since joinsBridgeThroughAssociations passes {} to joinAndStatement recursively, we know this is only set on the
      // first call to joinsBridgeThroughAssociations, which corresponds to the outermoset through association and therefore
      // the last source association to be added to the statement (because joinsBridgeThroughAssociations was called
      // recursively and therefore may have added other through associations and their sources prior to reaching this point)
      joinAndStatement,
      previousThroughAssociation: throughAssociation,
      joinType,
      dreamClassThroughAssociationWantsToHydrate,
    })
  }

  private applyOneJoin<
    QueryType extends
      | SelectQueryBuilder<any, any, any>
      | UpdateQueryBuilder<any, any, any, any>
      | DeleteQueryBuilder<any, any, any>,
  >({
    query,
    dreamClass,
    association,
    /**
     * If the join statement includes an explicit alias, e.g.,
     * `leftJoinPreload('hello as ho', 'world as wd')`
     * then explicitAlias is set (e.g., to 'ho' the first time that `recursivelyJoin`
     * calls this method and to 'ho' the second time `recursivelyJoin` is called)
     * If only implicit aliasing happens (based on association name)
     * (e.g. `leftJoinPreload('hello', 'world')`), then explicitAlias is null
     */
    explicitAlias,
    /**
     * previousTableAlias is always set
     */
    previousTableAlias,
    selfTableAlias = previousTableAlias,
    joinAndStatement = {},
    previousThroughAssociation,
    joinType,
    dreamClassThroughAssociationWantsToHydrate,
  }: {
    query: QueryType
    dreamClass: typeof Dream
    association:
      | HasOneStatement<any, any, any, any>
      | HasManyStatement<any, any, any, any>
      | BelongsToStatement<any, any, any, any>
    explicitAlias: string | undefined
    previousTableAlias: string
    selfTableAlias?: string
    joinAndStatement?: RelaxedJoinAndStatement<any, any>
    previousThroughAssociation:
      | HasOneStatement<any, any, any, any>
      | HasManyStatement<any, any, any, any>
      | undefined

    joinType: JoinTypes
    dreamClassThroughAssociationWantsToHydrate: typeof Dream | undefined
  }): {
    query: QueryType
    association: AssociationStatement
  } {
    if (association.type !== 'BelongsTo' && association.through) {
      if (throughAssociationHasOptionsBesidesThroughAndSource(previousThroughAssociation)) {
        throw new ThroughAssociationConditionsIncompatibleWithThroughAssociationSource({
          dreamClass,
          association,
        })
      }

      return this.joinsBridgeThroughAssociations({
        query,
        dreamClassTheAssociationIsDefinedOn: dreamClass,
        throughAssociation: association,
        explicitAlias,
        previousTableAlias,
        joinAndStatement,
        joinType,
      })
    }

    return this.addAssociationJoinStatementToQuery({
      query,
      dreamClass,
      association,
      explicitAlias,
      previousTableAlias,
      selfTableAlias,
      joinAndStatement,
      previousThroughAssociation,
      joinType,
      dreamClassThroughAssociationWantsToHydrate,
    })
  }

  private addAssociationJoinStatementToQuery<
    QueryType extends
      | SelectQueryBuilder<any, any, any>
      | UpdateQueryBuilder<any, any, any, any>
      | DeleteQueryBuilder<any, any, any>,
  >({
    query,
    dreamClass,
    association,
    /**
     * If the join statement includes an explicit alias, e.g.,
     * `leftJoinPreload('hello as ho', 'world as wd')`
     * then explicitAlias is set (e.g., to 'ho' the first time that `recursivelyJoin`
     * calls this method and to 'ho' the second time `recursivelyJoin` is called)
     * If only implicit aliasing happens (based on association name)
     * (e.g. `leftJoinPreload('hello', 'world')`), then explicitAlias is null
     */
    explicitAlias,
    /**
     * previousTableAlias is always set
     */
    previousTableAlias,
    selfTableAlias,
    joinAndStatement,
    previousThroughAssociation,
    joinType,
    dreamClassThroughAssociationWantsToHydrate,
  }: {
    query: QueryType
    dreamClass: typeof Dream
    association:
      | HasOneStatement<any, any, any, any>
      | HasManyStatement<any, any, any, any>
      | BelongsToStatement<any, any, any, any>
    explicitAlias: string | undefined
    previousTableAlias: string
    selfTableAlias: string
    joinAndStatement: RelaxedJoinAndStatement<any, any>
    previousThroughAssociation:
      | HasOneStatement<any, any, any, any>
      | HasManyStatement<any, any, any, any>
      | undefined

    joinType: JoinTypes
    dreamClassThroughAssociationWantsToHydrate: typeof Dream | undefined
  }): {
    query: QueryType
    association: AssociationStatement
  } {
    const currentTableAlias = explicitAlias ?? association.as

    if (previousThroughAssociation?.type === 'HasMany') {
      if ((query as SelectQueryBuilder<any, any, any>)?.distinctOn && previousThroughAssociation.distinct) {
        query = (query as SelectQueryBuilder<any, any, any>).distinctOn(
          this.distinctColumnNameForAssociation({
            association: previousThroughAssociation,
            tableNameOrAlias: currentTableAlias,
            foreignKey: previousThroughAssociation.primaryKey(),
          }) as string
        ) as QueryType
      }

      if (previousThroughAssociation?.order) {
        query = this.applyOrderStatementForAssociation({
          query,
          association: previousThroughAssociation,
          tableNameOrAlias: currentTableAlias,
        })
      }
    }

    if (association.type === 'BelongsTo') {
      if (!dreamClassThroughAssociationWantsToHydrate && Array.isArray(association.modelCB()))
        throw new CannotJoinPolymorphicBelongsToError({
          dreamClass,
          association,
          innerJoinStatements: this.query['innerJoinStatements'],
          leftJoinStatements: this.query['leftJoinStatements'],
        })

      const to = (dreamClassThroughAssociationWantsToHydrate ?? (association.modelCB() as typeof Dream)).table
      const joinTableExpression =
        snakeify(currentTableAlias) === to ? currentTableAlias : `${to} as ${currentTableAlias}`

      query = (query as any)[(joinType === 'inner' ? 'innerJoin' : 'leftJoin') as 'innerJoin'](
        joinTableExpression,
        (join: JoinBuilder<any, any>) => {
          join = join.onRef(
            this.namespaceColumn(association.foreignKey(), previousTableAlias),
            '=',
            this.namespaceColumn(
              association.primaryKey(undefined, {
                associatedClassOverride: dreamClassThroughAssociationWantsToHydrate,
              }),
              currentTableAlias
            )
          )

          if (previousThroughAssociation) {
            if (dreamClassThroughAssociationWantsToHydrate) {
              join = join.on((eb: ExpressionBuilder<any, any>) =>
                this.whereStatementToExpressionWrapper(
                  eb,
                  this.aliasWhereStatement(
                    {
                      [association.foreignKeyTypeField()]:
                        dreamClassThroughAssociationWantsToHydrate.sanitizedName,
                    } as WhereStatement<any, any, any>,
                    previousThroughAssociation.through!
                  )
                )
              )
            }

            join = this.applyAssociationAndStatementsToJoinStatement({
              join,
              association: previousThroughAssociation,
              currentTableAlias,
              selfTableAlias,
              joinAndStatement,
            })
          }

          join = this.conditionallyApplyDefaultScopesDependentOnAssociation({
            join,
            tableNameOrAlias: currentTableAlias,
            association,
            throughAssociatedClassOverride: dreamClassThroughAssociationWantsToHydrate,
          })

          join = this.applyJoinAndStatement(join, joinAndStatement, currentTableAlias)

          return join
        }
      )
    } else {
      const to = association.modelCB().table
      const joinTableExpression =
        snakeify(currentTableAlias) === to ? currentTableAlias : `${to} as ${currentTableAlias}`

      query = (query as any)[(joinType === 'inner' ? 'innerJoin' : 'leftJoin') as 'innerJoin'](
        joinTableExpression,
        (join: JoinBuilder<any, any>) => {
          join = join.onRef(
            this.namespaceColumn(association.primaryKey(), previousTableAlias),
            '=',
            this.namespaceColumn(association.foreignKey(), currentTableAlias)
          )

          if (association.polymorphic) {
            join = join.on((eb: ExpressionBuilder<any, any>) =>
              this.whereStatementToExpressionWrapper(
                eb,
                this.aliasWhereStatement(
                  {
                    [association.foreignKeyTypeField()]: dreamClassThroughAssociationWantsToHydrate
                      ? dreamClassThroughAssociationWantsToHydrate.referenceTypeString
                      : dreamClass.referenceTypeString,
                  } as any,
                  currentTableAlias
                )
              )
            )
          }

          if (previousThroughAssociation) {
            join = this.applyAssociationAndStatementsToJoinStatement({
              join,
              association: previousThroughAssociation,
              currentTableAlias,
              selfTableAlias,
              joinAndStatement,
            })
          }

          join = this.applyAssociationAndStatementsToJoinStatement({
            join,
            association,
            currentTableAlias,
            selfTableAlias,
            joinAndStatement,
          })

          join = this.conditionallyApplyDefaultScopesDependentOnAssociation({
            join,
            tableNameOrAlias: currentTableAlias,
            association,
            throughAssociatedClassOverride: dreamClassThroughAssociationWantsToHydrate,
          })

          join = this.applyJoinAndStatement(join, joinAndStatement, currentTableAlias)

          return join
        }
      )

      if (association.type === 'HasMany') {
        if (association.order) {
          query = this.applyOrderStatementForAssociation({
            query,
            tableNameOrAlias: currentTableAlias,
            association,
          })
        }

        if ((query as SelectQueryBuilder<any, any, any>).distinctOn && association.distinct) {
          query = (query as SelectQueryBuilder<any, any, any>).distinctOn(
            this.distinctColumnNameForAssociation({
              association,
              tableNameOrAlias: currentTableAlias,
              foreignKey: association.foreignKey(),
            }) as string
          ) as QueryType
        }
      }
    }

    return {
      query,
      association,
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
    currentTableAlias,
    selfTableAlias,
    association,
    joinAndStatement,
  }: {
    join: JoinBuilder<any, any>
    currentTableAlias: string
    selfTableAlias: string
    association: HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>
    joinAndStatement: RelaxedJoinAndStatement<any, any>
  }) {
    if (association.and) {
      this.throwUnlessAllRequiredWhereClausesProvided(association, currentTableAlias, joinAndStatement)

      join = join.on((eb: ExpressionBuilder<any, any>) =>
        this.whereStatementToExpressionWrapper(
          eb,
          this.aliasWhereStatement(association.and as WhereStatement<any, any, any>, currentTableAlias),
          { disallowSimilarityOperator: false }
        )
      )
    }

    if (association.andNot) {
      join = join.on((eb: ExpressionBuilder<any, any>) =>
        this.whereStatementToExpressionWrapper(
          eb,
          this.aliasWhereStatement(association.andNot as WhereStatement<any, any, any>, currentTableAlias),
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
              this.aliasWhereStatement(whereAnyStatement, currentTableAlias),
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
            selfAlias: selfTableAlias,
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
            selfAlias: selfTableAlias,
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
      column => (joinAndStatements as any)?.and?.[column] === undefined
    )

    if (missingRequiredWhereStatements.length)
      throw new MissingRequiredAssociationAndClause(association, missingRequiredWhereStatements[0])
  }

  private conditionallyApplyDefaultScopesDependentOnAssociation({
    join,
    tableNameOrAlias,
    association,
    throughAssociatedClassOverride,
  }: {
    join: JoinBuilder<any, any>
    tableNameOrAlias: string
    association: AssociationStatement
    throughAssociatedClassOverride: typeof Dream | undefined
  }) {
    let scopesQuery = new Query<DreamInstance>(this.dreamInstance)
    const associationClass = throughAssociatedClassOverride ?? (association.modelCB() as typeof Dream)
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
   * Polymorphic BelongsTo. Since polymorphic associations may point to multiple tables,
   * preload by loading each target class separately.
   *
   * Used to preload polymorphic belongs to associations
   */
  private async preloadPolymorphicBelongsTo(
    this: KyselyQueryDriver<DreamInstance>,
    association: BelongsToStatement<any, any, any, string>,
    associatedModels: (typeof Dream)[],
    dreams: Dream[]
  ) {
    return compact(
      await Promise.all(
        associatedModels.map(associatedModel =>
          this.preloadPolymorphicAssociationModel(dreams, association, associatedModel)
        )
      )
    ).flat()
  }

  private async preloadPolymorphicAssociationModel(
    dreams: Dream[],
    association: BelongsToStatement<any, any, any, string>,
    associatedDreamClass: typeof Dream
  ) {
    const relevantAssociatedModels = dreams.filter((dream: any) => {
      const field = association.foreignKeyTypeField()
      return dream[field] === associatedDreamClass.referenceTypeString || dream[field] === null
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

      //////////////////////////////////////////////////////////////////////////////////////////////
      // Associate each loaded association with each dream based on primary key and foreign key type
      //////////////////////////////////////////////////////////////////////////////////////////////
      for (const loadedAssociation of loadedAssociations) {
        dreams
          .filter(
            (dream: any) =>
              dream[association.foreignKeyTypeField()] === loadedAssociation.referenceTypeString &&
              dream[association.foreignKey()] === association.primaryKeyValue(loadedAssociation)
          )
          .forEach((dream: any) => {
            dream[association.as] = loadedAssociation
          })
      }

      ///////////////////////////////////////////////////////////////////////////////////////////////////
      // end: Associate each loaded association with each dream based on primary key and foreign key type
      ///////////////////////////////////////////////////////////////////////////////////////////////////

      return loadedAssociations
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
    this: KyselyQueryDriver<DreamInstance>,
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
    this: KyselyQueryDriver<DreamInstance>,
    kyselyQuery: UpdateQueryBuilder<DreamInstance['DB'], any, any, any>
  ) {
    const similarityBuilder = this.similarityStatementBuilder()
    if (similarityBuilder.hasSimilarityClauses) {
      kyselyQuery = similarityBuilder.update(kyselyQuery)
    }
    return kyselyQuery
  }

  /**
   * @internal
   *
   * Applies a preload statement
   */
  private async applyOnePreload(
    this: KyselyQueryDriver<DreamInstance>,
    associationNameAndMaybeAlias: string,
    dreams: Dream | Dream[],
    onStatement: RelaxedPreloadOnStatement<any, any> = {}
  ): Promise<Dream[]> {
    if (!Array.isArray(dreams)) dreams = [dreams] as Dream[]

    const { name: associationName } = associationStringToNameAndAlias(associationNameAndMaybeAlias)
    dreams = dreams.filter(dream => dream.hasAssociation(associationName))

    const groupedDreams = groupBy(dreams, dream => dream.sanitizedConstructorName)

    return (
      await Promise.all(
        Object.keys(groupedDreams).map(key =>
          this._applyOnePreload(associationNameAndMaybeAlias, groupedDreams[key]!, onStatement)
        )
      )
    ).flat()
  }

  private async _applyOnePreload(
    this: KyselyQueryDriver<DreamInstance>,
    associationName: string,
    dreams: Dream[],
    onStatement: RelaxedPreloadOnStatement<any, any> = {}
  ): Promise<Dream[]> {
    if (!dreams.length) return []
    const dream = dreams[0]!

    const { name, alias: _alias } = associationStringToNameAndAlias(associationName)
    const alias = _alias || name

    const association = dream['getAssociationMetadata'](name)
    if (association === undefined) throw new UnexpectedUndefined()

    const dreamClass = dream.constructor as typeof Dream
    const dreamClassToHydrate = association.modelCB() as typeof Dream

    if (Array.isArray(dreamClassToHydrate)) {
      const preloadedPolymorphicBelongsTos = await this.preloadPolymorphicBelongsTo(
        association as BelongsToStatement<any, any, any, string>,
        dreamClassToHydrate,
        dreams
      )

      return preloadedPolymorphicBelongsTos
    }

    const dreamClassToHydrateColumns = [...dreamClassToHydrate.columns()]

    const columnsToPluck = dreamClassToHydrateColumns.map(column =>
      this.namespaceColumn(column.toString(), alias)
    ) as any[]

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
      [dreamClass.primaryKey]: dreams.map(obj => obj.primaryKeyValue()),
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

        return {
          dream: hydratedDream,
          pointsToPrimaryKey: pluckedData.at(-1),
        }
      }
    )

    this.hydrateAssociation(dreams, association, preloadedDreamsAndWhatTheyPointTo)

    return preloadedDreamsAndWhatTheyPointTo.map(obj => obj.dream)
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

const associationStringToAssociationAndMaybeAlias = function ({
  dreamClass,
  associationString,
}: {
  dreamClass: typeof Dream
  associationString: string
}): {
  association:
    | HasOneStatement<any, any, any, any>
    | HasManyStatement<any, any, any, any>
    | BelongsToStatement<any, any, any, any>
  alias: string | undefined
} {
  const { name, alias: _alias } = associationStringToNameAndAlias(associationString)
  const alias = _alias || name

  const association = dreamClass['getAssociationMetadata'](name)

  if (!association) {
    throw new JoinAttemptedOnMissingAssociation({
      dreamClass,
      associationName: associationString,
    })
  }

  return {
    association,
    alias,
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function defaultPostgresSslConfig(connectionConf: SingleDbCredential) {
  // TODO: properly configure (https://rvohealth.atlassian.net/browse/PDTC-2914)
  return {
    rejectUnauthorized: false,
    // ca: fs.readFileSync('/path/to/server-certificates/root.crt').toString(),
    // key: fs.readFileSync('/path/to/client-key/postgresql.key').toString(),
    // cert: fs.readFileSync('/path/to/client-certificates/postgresql.crt').toString(),
  }
}

function shouldSoftDelete(dream: Dream, reallyDestroy: boolean) {
  const dreamClass = dream.constructor as typeof Dream
  return dreamClass['softDelete'] && !reallyDestroy
}
