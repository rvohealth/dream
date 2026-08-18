// after building for esm, importing pg using the following:
//
//  import * as pg from 'pg'
//
// will crash. This is difficult to discover, since it only happens
// when being imported from our esm build.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pg from 'pg'

import { sql, type SelectQueryBuilder } from 'kysely'
import DreamCLI from '../../cli/index.js'
import { isPrimitiveDataType } from '../../db/dataTypes.js'
import { LOCK_NOT_AVAILABLE, pgErrorType } from '../../db/errors.js'
import DreamApp from '../../dream-app/index.js'
import SortableScopeLockWaitTimedOut from '../../errors/SortableScopeLockWaitTimedOut.js'
import Dream from '../../Dream.js'
import camelize from '../../helpers/camelize.js'
import {
  SchemaBuilderAssociationData,
  SchemaBuilderColumnData,
  SchemaBuilderInformationSchemaRow,
} from '../../helpers/cli/ASTBuilder.js'
import {
  findCitextArrayOid,
  findCorrespondingArrayOid,
  findEnumArrayOids,
  parsePostgresBigint,
  parsePostgresDate,
  parsePostgresDatetime,
  parsePostgresDatetimeTz,
  parsePostgresDecimal,
  parsePostgresTime,
  parsePostgresTimeTz,
} from '../../helpers/customPgParsers.js'
import { testDatabasePoolSize } from '../../db/testDatabasePool.js'
import EnvInternal from '../../helpers/EnvInternal.js'
import createDb from './helpers/pg/createDb.js'
import _dropDb from './helpers/pg/dropDb.js'
import loadPgClient from './helpers/pg/loadPgClient.js'
import DreamTransaction from '../DreamTransaction.js'
import KyselyQueryDriver from './Kysely.js'
import type { TestDatabaseLockSession } from './Base.js'

const pgTypes = pg.types

// Fixed dream-pool namespace constant for the advisory-lock `key1`. Chosen to
// sit high in the int4 range and be recognizable in `pg_locks` (classid/objid)
// when debugging. XORed with a per-namespace hash below so two apps sharing one
// Postgres cluster reserve disjoint index spaces.
const DREAM_TEST_POOL_LOCK_NAMESPACE = 0x44_52_4d_00 | 0 // "DRM\0"

// Aggressive TCP keepalive on the dedicated lock-holding connection. Insurance
// for remote / CI Postgres and abrupt kills where a FIN might be lost: it lets
// Postgres reap the dead backend (and release the lock) even when the OS never
// delivered a clean socket close. For a local kill the lock releases on EOF
// regardless of this.
const LOCK_CONNECTION_KEEPALIVE_INITIAL_DELAY_MS = 1_000

function int32Hash(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(i)) | 0
  }
  return hash
}

function advisoryLockKey1(namespace: string): number {
  // Stays within int4 via the `| 0` coercions.
  return (DREAM_TEST_POOL_LOCK_NAMESPACE ^ int32Hash(namespace)) | 0
}

export default class PostgresQueryDriver<
  DreamInstance extends Dream,
> extends KyselyQueryDriver<DreamInstance> {
  /**
   * create the database. Must respond to the NODE_ENV value.
   */
  public static override async dbCreate(connectionName: string) {
    const dreamApp = DreamApp.getOrFail()
    const primaryDbConf = dreamApp.dbConnectionConfig(connectionName, 'primary')

    DreamCLI.logger.logStartProgress(`creating ${primaryDbConf.name}...`)
    await createDb(connectionName, 'primary')
    DreamCLI.logger.logEndProgress()

    // TODO: add support for creating replicas. Began doing it below, but it is very tricky,
    // and we don't need it at the moment, so kicking off for future development when we have more time
    // to flesh this out.
    // if (connectionRetriever.hasReplicaConfig(connectionName)) {
    //   const replicaDbConf = connectionRetriever.getConnectionConf('replica')
    //   console.log(`creating ${process.env[replicaDbConf.name]}`)
    //   await createDb('replica')
    // }
  }

  /**
   * delete the database. Must respond to the NODE_ENV value.
   */
  public static override async dbDrop(connectionName: string) {
    const dreamApp = DreamApp.getOrFail()
    const primaryDbConf = dreamApp.dbConnectionConfig(connectionName, 'primary')

    DreamCLI.logger.logStartProgress(`dropping ${primaryDbConf.name}...`)
    await _dropDb(connectionName, 'primary')
    DreamCLI.logger.logEndProgress()

    // TODO: add support for dropping replicas. Began doing it below, but it is very tricky,
    // and we don't need it at the moment, so kicking off for future development when we have more time
    // to flesh this out.
    // if (connectionRetriever.hasReplicaConfig(connectionName)) {
    //   const replicaDbConf = connectionRetriever.getConnectionConf('replica')
    //   console.log(`dropping ${process.env[replicaDbConf.name]}`)
    //   await _dropDb('replica')
    // }
  }

  /**
   * @internal
   *
   * this method is called when dream is initializing, and is used
   * to configure the database to utilize custom type parsers for
   * a variety of data types.
   *
   * @param connectionName - the name of the connection you are doing this for
   * @returns void
   */
  public static override async setDatabaseTypeParsers(connectionName: string) {
    const kyselyDb = this.dbFor(connectionName, 'primary')

    pgTypes.setTypeParser(pgTypes.builtins.DATE, parsePostgresDate)

    pgTypes.setTypeParser(pgTypes.builtins.TIMESTAMP, parsePostgresDatetime)

    pgTypes.setTypeParser(pgTypes.builtins.TIMESTAMPTZ, parsePostgresDatetimeTz)

    pgTypes.setTypeParser(pgTypes.builtins.TIME, parsePostgresTime)

    pgTypes.setTypeParser(pgTypes.builtins.TIMETZ, parsePostgresTimeTz)

    pgTypes.setTypeParser(pgTypes.builtins.NUMERIC, parsePostgresDecimal)

    pgTypes.setTypeParser(pgTypes.builtins.INT8, parsePostgresBigint)

    const textArrayOid = await findCorrespondingArrayOid(kyselyDb, pgTypes.builtins.TEXT)
    if (textArrayOid) {
      let oid: number | undefined

      const textArrayParser = pgTypes.getTypeParser(textArrayOid)

      function transformPostgresArray(
        transformer:
          | typeof parsePostgresDate
          | typeof parsePostgresDatetime
          | typeof parsePostgresTime
          | typeof parsePostgresTimeTz
          | typeof parsePostgresDecimal
          | typeof parsePostgresBigint
      ) {
        return (value: string) => (textArrayParser(value) as string[]).map(str => transformer(str))
      }

      const enumArrayOids = await findEnumArrayOids(kyselyDb)
      enumArrayOids.forEach((enumArrayOid: number) => pgTypes.setTypeParser(enumArrayOid, textArrayParser))

      oid = await findCitextArrayOid(kyselyDb)
      if (oid) pgTypes.setTypeParser(oid, textArrayParser)

      oid = await findCorrespondingArrayOid(kyselyDb, pgTypes.builtins.UUID)
      if (oid) pgTypes.setTypeParser(oid, textArrayParser)

      oid = await findCorrespondingArrayOid(kyselyDb, pgTypes.builtins.DATE)
      if (oid) pgTypes.setTypeParser(oid, transformPostgresArray(parsePostgresDate))

      oid = await findCorrespondingArrayOid(kyselyDb, pgTypes.builtins.TIMESTAMP)
      if (oid) pgTypes.setTypeParser(oid, transformPostgresArray(parsePostgresDatetime))

      oid = await findCorrespondingArrayOid(kyselyDb, pgTypes.builtins.TIMESTAMPTZ)
      if (oid) pgTypes.setTypeParser(oid, transformPostgresArray(parsePostgresDatetime))

      oid = await findCorrespondingArrayOid(kyselyDb, pgTypes.builtins.TIME)
      if (oid) pgTypes.setTypeParser(oid, transformPostgresArray(parsePostgresTime))

      oid = await findCorrespondingArrayOid(kyselyDb, pgTypes.builtins.TIMETZ)
      if (oid) pgTypes.setTypeParser(oid, transformPostgresArray(parsePostgresTimeTz))

      oid = await findCorrespondingArrayOid(kyselyDb, pgTypes.builtins.NUMERIC)
      if (oid) pgTypes.setTypeParser(oid, transformPostgresArray(parsePostgresDecimal))

      oid = await findCorrespondingArrayOid(kyselyDb, pgTypes.builtins.INT8)
      if (oid) pgTypes.setTypeParser(oid, transformPostgresArray(parsePostgresBigint))
    }
  }

  /**
   * @internal
   *
   * this is used by the SchemaBuilder to store column data permanently
   * within the types/dream.ts file.
   */
  public static override async getColumnData(
    connectionName: string,
    tableName: string,
    allTableAssociationData: { [key: string]: SchemaBuilderAssociationData }
  ): Promise<{ [key: string]: SchemaBuilderColumnData }> {
    const db = this.dbFor(connectionName, 'primary')
    const sqlQuery = sql`SELECT column_name, udt_name::regtype, is_nullable, data_type FROM information_schema.columns WHERE table_name = ${tableName}`
    const columnToDBTypeMap = await sqlQuery.execute(db)
    const rows = columnToDBTypeMap.rows as SchemaBuilderInformationSchemaRow[]

    const columnData: {
      [key: string]: SchemaBuilderColumnData
    } = {}
    rows.forEach(row => {
      const isEnum = ['USER-DEFINED', 'ARRAY'].includes(row.dataType) && !isPrimitiveDataType(row.udtName)
      const isArray = ['ARRAY'].includes(row.dataType)
      const associationMetadata = allTableAssociationData[row.columnName]

      columnData[camelize(row.columnName)] = {
        dbType: row.udtName,
        allowNull: row.isNullable === 'YES',
        enumType: isEnum ? this.enumType(row) : null,
        enumValues: isEnum ? `${this.enumType(row)}Values` : null,
        isArray,
        foreignKey: associationMetadata?.foreignKey || null,
      }
    })

    return Object.keys(columnData)
      .sort()
      .reduce(
        (acc, key) => {
          if (columnData[key] === undefined) return acc
          acc[key] = columnData[key]
          return acc
        },
        {} as { [key: string]: SchemaBuilderColumnData }
      )
  }

  public static override async duplicateDatabase(connectionName: string) {
    const dreamApp = DreamApp.getOrFail()
    const parallelTests = dreamApp.parallelTests
    if (!parallelTests) return

    DreamCLI.logger.logStartProgress(`duplicating db for parallel tests...`)
    const dbConf = dreamApp.dbConnectionConfig(connectionName, 'primary')
    const client = await loadPgClient({ useSystemDb: true, connectionName })

    if (EnvInternal.boolean('DREAM_CORE_DEVELOPMENT')) {
      const replicaTestWorkerDatabaseName = `replica_test_${dbConf.name}`
      DreamCLI.logger.logContinueProgress(
        `creating fake replica test database ${replicaTestWorkerDatabaseName}...`,
        { logPrefix: '  ├ [db]', logPrefixColor: 'greenBright' }
      )
      await client.query(`DROP DATABASE IF EXISTS ${replicaTestWorkerDatabaseName};`)
      await client.query(`CREATE DATABASE ${replicaTestWorkerDatabaseName} TEMPLATE ${dbConf.name};`)
    }

    // The pool spans `<base>` (the migration template, also claimable) plus
    // `<base>_2 .. <base>_K`. Each live test worker claims one member for its
    // lifetime via an advisory lock, so the pool must be wide enough to cover
    // active + still-terminating workers — see src/db/testDatabasePool.ts.
    const poolSize = testDatabasePoolSize(parallelTests)
    for (let i = 2; i <= poolSize; i++) {
      const workerDatabaseName = `${dbConf.name}_${i}`

      DreamCLI.logger.logContinueProgress(
        `creating duplicate test database ${workerDatabaseName} for concurrent tests...`,
        { logPrefix: '  ├ [db]', logPrefixColor: 'greenBright' }
      )
      await client.query(`DROP DATABASE IF EXISTS ${workerDatabaseName};`)
      await client.query(`CREATE DATABASE ${workerDatabaseName} TEMPLATE ${dbConf.name};`)
    }
    await client.end()

    DreamCLI.logger.logEndProgress()
  }

  /**
   * @internal
   *
   * Postgres implementation of the row-locking seam: appends
   * `FOR UPDATE OF "<tableAlias>"` to the select, so every row the statement
   * returns is exclusively locked until the enclosing transaction ends.
   *
   * Scoping the lock to the Query's own base table (rather than a bare
   * `FOR UPDATE`) means a query that joins other tables neither locks rows the
   * caller never asked about nor raises Postgres's "FOR UPDATE cannot be
   * applied to the nullable side of an outer join".
   *
   * This is a waiting lock: neither `NOWAIT` nor `SKIP LOCKED` is applied, so a
   * statement that collides with another transaction's lock blocks until that
   * transaction ends. Callers that cannot afford an unbounded wait should set a
   * `lock_timeout` on the connection; see the guarded-destroy notes on
   * `Query#destroy`.
   */
  public override applyRowLock(
    kyselyQuery: SelectQueryBuilder<any, any, any>,
    tableAlias: string
  ): SelectQueryBuilder<any, any, any> {
    return kyselyQuery.forUpdate(tableAlias)
  }

  public static override supportsAdvisoryTransactionLocks = true

  /**
   * @internal
   *
   * Postgres implementation of the transaction-scoped advisory lock seam.
   *
   * Uses the single-`bigint` form `pg_advisory_xact_lock(bigint)`, whose lock
   * space is distinct from the two-`int4` form the test-database pool claims
   * with (see {@link openTestDatabaseLockSession}), so an application lock can
   * never collide with a pool claim.
   *
   * Every key is taken in one statement, over `unnest` of the key array: a
   * function scan yields its rows in array order, so the caller's sorted
   * acquisition order — the thing that keeps two operations over the same
   * scopes from deadlocking — is preserved, while a batch that needs one key
   * per candidate record costs one round trip rather than N.
   *
   * The locks are held until the enclosing transaction ends, and are waiting
   * (no `NOWAIT`): a second transaction asking for the same key blocks at that
   * key's row until the holder commits or rolls back. Because they are
   * transaction-scoped there is nothing to release, and re-acquiring a key
   * within one transaction is a no-op rather than an error.
   *
   * The wait is bounded by `lock_timeout`, taken from
   * {@link DreamApp.sortableScopeLockTimeout} and applied to the acquisition
   * statement alone: the prior value is read in the same statement that sets
   * the bound and restored in the next one, so the transaction's row-lock waits
   * keep whatever the application configured. Postgres cancels the statement
   * with `55P03` when the bound elapses, and that is translated here into
   * {@link SortableScopeLockWaitTimedOut} so no Postgres error code escapes the
   * driver.
   *
   * A timeout of `0` means "no bound", which is what `lock_timeout` itself
   * means by it, and is sent as the bound rather than skipped: an application
   * whose connection carries a `lock_timeout` of its own would otherwise have
   * its acquisition cancelled by that bound, which is neither the unbounded
   * wait `0` asks for nor a cancellation this driver could translate.
   */
  public static override async acquireAdvisoryTransactionLocks(
    txn: DreamTransaction<Dream>,
    keys: bigint[]
  ): Promise<void> {
    if (!keys.length) return

    // the keys are passed as text and cast, since a JS bigint is not a value
    // the pg driver can bind directly
    const lockKeys = keys.map(key => key.toString())
    const timeoutMs = DreamApp.getOrFail().sortableScopeLockTimeout

    let priorLockTimeout: string

    try {
      // one statement, three things in a forced order: `bounded` selects from
      // `prior_setting`, so the prior value is read before the bound replaces
      // it, and both are `from` items, so both are scanned before the target
      // list takes a single lock. Merging them costs nothing where separate
      // statements would cost round trips inside the lock window.
      //
      // The returned column is aliased to a single word deliberately: result
      // keys come back camelized, and a one-word alias is the same either way
      const result = await sql<{ prior: string }>`
        with prior_setting as (select current_setting('lock_timeout') as value),
             bounded as (select set_config('lock_timeout', ${timeoutMs.toString()}, true) as value from prior_setting)
        select prior_setting.value as prior, pg_advisory_xact_lock(sortable_lock_keys.lock_key)
        from prior_setting, bounded, unnest(${lockKeys}::bigint[]) as sortable_lock_keys(lock_key)
      `.execute(txn.kyselyTransaction)

      priorLockTimeout = result.rows[0]!.prior
    } catch (error) {
      if (pgErrorType(error) === LOCK_NOT_AVAILABLE) throw new SortableScopeLockWaitTimedOut(timeoutMs)
      throw error
    }

    // `current_setting` returns the value with its unit ('0', '5s', '250ms'),
    // which is a form `set_config` accepts back unchanged
    await sql`select set_config('lock_timeout', ${priorLockTimeout}, true)`.execute(txn.kyselyTransaction)
  }

  public static override supportsParallelTestDatabases = true

  /**
   * @internal
   *
   * Postgres implementation of the per-worker test-database claim seam (see
   * {@link TestDatabaseLockSession} and `src/db/testDatabasePool.ts`).
   *
   * Postgres advisory locks are global to the cluster (not scoped to a single
   * database), so one dedicated connection — to the `postgres` maintenance
   * database — can reserve a pool index for the whole cluster. We use the
   * two-`int4` form `pg_try_advisory_lock(key1, key2)`, whose lock space is
   * distinct from the single-`bigint` form `pg_advisory_lock(bigint)` that
   * application code typically uses, so a claim can never clash with an
   * app-level advisory lock. `key1` folds a hash of the lock namespace (the
   * base database name) into a fixed dream-pool constant; `key2` is the pool
   * index. The lock auto-releases when the connection drops on process exit.
   */
  public static override async openTestDatabaseLockSession(
    connectionName: string
  ): Promise<TestDatabaseLockSession> {
    const dreamApp = DreamApp.getOrFail()
    const creds =
      dreamApp.dbCredentialsFor(connectionName)?.primary ?? dreamApp.dbCredentialsFor(connectionName)?.replica
    if (!creds?.name)
      throw new Error(
        `[dream] cannot open a test-database lock session: the "${connectionName}" connection has no resolvable primary db name`
      )

    const client = new pg.Client({
      host: creds.host || 'localhost',
      port: creds.port,
      // The maintenance database always exists and we never lock it —
      // advisory locks are cluster-wide.
      database: 'postgres',
      user: creds.user,
      password: creds.password,
      keepAlive: true,
      keepAliveInitialDelayMillis: LOCK_CONNECTION_KEEPALIVE_INITIAL_DELAY_MS,
    })
    await client.connect()

    return {
      async tryAcquire(namespace: string, index: number): Promise<boolean> {
        const result = await client.query('SELECT pg_try_advisory_lock($1::int4, $2::int4) AS locked', [
          advisoryLockKey1(namespace),
          index,
        ])
        return result.rows[0]?.locked === true
      },
      async release(): Promise<void> {
        await client.end().catch(() => undefined)
      },
    }
  }
}
