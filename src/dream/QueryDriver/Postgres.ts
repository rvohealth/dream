// after building for esm, importing pg using the following:
//
//  import * as pg from 'pg'
//
// will crash. This is difficult to discover, since it only happens
// when being imported from our esm build.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pg from 'pg'

import { sql } from 'kysely'
import DreamCLI from '../../cli/index.js'
import { isPrimitiveDataType } from '../../db/dataTypes.js'
import DreamApp from '../../dream-app/index.js'
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
  parsePostgresDecimal,
  parsePostgresTime,
  parsePostgresTimeTz,
} from '../../helpers/customPgParsers.js'
import EnvInternal from '../../helpers/EnvInternal.js'
import createDb from './helpers/pg/createDb.js'
import _dropDb from './helpers/pg/dropDb.js'
import loadPgClient from './helpers/pg/loadPgClient.js'
import KyselyQueryDriver from './Kysely.js'

const pgTypes = pg.types

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

    pgTypes.setTypeParser(pgTypes.builtins.TIMESTAMPTZ, parsePostgresDatetime)

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
        { logPrefix: '  ├ [db]', logPrefixColor: 'cyan' }
      )
      await client.query(`DROP DATABASE IF EXISTS ${replicaTestWorkerDatabaseName};`)
      await client.query(`CREATE DATABASE ${replicaTestWorkerDatabaseName} TEMPLATE ${dbConf.name};`)
    }

    for (let i = 2; i <= parallelTests; i++) {
      const workerDatabaseName = `${dbConf.name}_${i}`

      DreamCLI.logger.logContinueProgress(
        `creating duplicate test database ${workerDatabaseName} for concurrent tests...`,
        { logPrefix: '  ├ [db]', logPrefixColor: 'cyan' }
      )
      await client.query(`DROP DATABASE IF EXISTS ${workerDatabaseName};`)
      await client.query(`CREATE DATABASE ${workerDatabaseName} TEMPLATE ${dbConf.name};`)
    }
    await client.end()

    DreamCLI.logger.logEndProgress()
  }
}
