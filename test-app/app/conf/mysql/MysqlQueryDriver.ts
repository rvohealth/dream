import { MysqlDialect, OrderByItemBuilder, sql } from 'kysely'
import { createPool } from 'mysql2'
import DreamCLI from '../../../../src/cli/index.js'
import { isPrimitiveDataType } from '../../../../src/db/dataTypes.js'
import DreamApp, { SingleDbCredential } from '../../../../src/dream-app/index.js'
import Dream from '../../../../src/Dream.js'
import DreamTransaction from '../../../../src/dream/DreamTransaction.js'
import executeDatabaseQuery from '../../../../src/dream/internal/executeDatabaseQuery.js'
import { GenericDbType } from '../../../../src/dream/QueryDriver/Base.js'
import KyselyQueryDriver from '../../../../src/dream/QueryDriver/Kysely.js'
import CalendarDate from '../../../../src/helpers/CalendarDate.js'
import camelize from '../../../../src/helpers/camelize.js'
import {
  SchemaBuilderAssociationData,
  SchemaBuilderColumnData,
  SchemaBuilderInformationSchemaRow,
} from '../../../../src/helpers/cli/ASTBuilder.js'
import { DateTime } from '../../../../src/helpers/DateTime.js'
import EnvInternal from '../../../../src/helpers/EnvInternal.js'
import namespaceColumn from '../../../../src/helpers/namespaceColumn.js'
import sqlAttributes from '../../../../src/helpers/sqlAttributes.js'
import { DbConnectionType } from '../../../../src/types/db.js'
import { OrderDir } from '../../../../src/types/dream.js'
import createMysqlDb from './createMysqlDb.js'
import dropMysqlDb from './dropMysqlDb.js'
import loadMysqlClient from './loadMysqlClient.js'

export default class MysqlQueryDriver<DreamInstance extends Dream> extends KyselyQueryDriver<DreamInstance> {
  public static override dialectProvider(connectionName: string, dbConnectionType: DbConnectionType) {
    return (connectionConf: SingleDbCredential) =>
      new MysqlDialect({
        pool: createPool({
          user: connectionConf.user || '',
          password: connectionConf.password || '',
          database: DreamApp.getOrFail().dbName(connectionName, dbConnectionType),
          host: connectionConf.host || 'localhost',
          port: connectionConf.port || 5432,
          // ssl: connectionConf.useSsl ? defaultMysqlSslConfig(connectionConf) : false,
          // typeCast(field, next) {},
        }),
      })
  }

  /**
   * create the database. Must respond to the NODE_ENV value.
   */
  public static override async dbCreate(connectionName: string) {
    const dreamApp = DreamApp.getOrFail()
    const primaryDbConf = dreamApp.dbConnectionConfig(connectionName, 'primary')

    DreamCLI.logger.logStartProgress(`creating ${primaryDbConf.name}...`)
    await createMysqlDb(connectionName, 'primary')
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
    await dropMysqlDb(connectionName, 'primary')
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

  public static override async duplicateDatabase(connectionName: string) {
    const dreamApp = DreamApp.getOrFail()
    const parallelTests = dreamApp.parallelTests
    if (!parallelTests) return

    DreamCLI.logger.logStartProgress(`duplicating db for parallel tests...`)
    const dbConf = dreamApp.dbConnectionConfig(connectionName, 'primary')
    const client = loadMysqlClient({ useSystemDb: true, connectionName })

    if (EnvInternal.boolean('DREAM_CORE_DEVELOPMENT') && connectionName === 'default') {
      const replicaTestWorkerDatabaseName = `replica_test_${dbConf.name}`
      DreamCLI.logger.logContinueProgress(
        `creating fake replica test database ${replicaTestWorkerDatabaseName}...`,
        { logPrefix: '  ├ [db]', logPrefixColor: 'cyan' }
      )

      await duplicateMysqlDatabase(dbConf.name, replicaTestWorkerDatabaseName, connectionName)
    }

    for (let i = 2; i <= parallelTests; i++) {
      const workerDatabaseName = `${dbConf.name}_${i}`

      DreamCLI.logger.logContinueProgress(
        `creating duplicate test database ${workerDatabaseName} for concurrent tests...`,
        { logPrefix: '  ├ [db]', logPrefixColor: 'cyan' }
      )
      await duplicateMysqlDatabase(dbConf.name, workerDatabaseName, connectionName)
    }
    client.end()

    DreamCLI.logger.logEndProgress()
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
    associationData: { [key: string]: SchemaBuilderAssociationData }
  ): Promise<{ [key: string]: SchemaBuilderColumnData }> {
    const db = this.dbFor(connectionName, 'primary')
    // const sqlQuery = sql`SELECT column_name, udt_name::regtype, is_nullable, data_type FROM information_schema.columns WHERE table_name = ${tableName}`
    const sqlQuery = sql`SELECT column_name as column_name, column_type AS udt_name, is_nullable as is_nullable, data_type as data_type FROM information_schema.columns WHERE table_name = ${tableName}`
    const columnToDBTypeMap = await sqlQuery.execute(db)
    const rows = columnToDBTypeMap.rows as SchemaBuilderInformationSchemaRow[]

    const columnData: {
      [key: string]: SchemaBuilderColumnData
    } = {}
    rows.forEach(row => {
      const isEnum = ['USER-DEFINED', 'ARRAY'].includes(row.dataType) && !isPrimitiveDataType(row.udtName)
      const isArray = ['ARRAY'].includes(row.dataType)
      const associationMetadata = associationData[row.columnName]

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

  public static override get syncDialect(): string {
    return 'mysql'
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

    if (dream.isPersisted) {
      const query = db
        .updateTable(dream.table)
        .set(sqlifiedAttributes as any)
        .where(namespaceColumn(dream['_primaryKey'], dream.table), '=', dream.primaryKeyValue())

      await executeDatabaseQuery(
        // NOTE: this is actually different from postgres, mysql does not support
        // calls to .returning(), so I am commenting it out
        // query.returning([...dream.columns()] as any),
        query,
        'executeTakeFirstOrThrow'
      )

      // mysql doesn't support "returning", so we do a separate
      // request here to reload data. This is not necessary
      // during an update at all, and only necessary during
      // create to capture the insert id. Doing this anyways,
      // since it is the easiest path to congruent behavior
      // with the postgres driver, but if I were using this
      // IRL i would adapt or remove this block and find
      // a different way to return the data
      const data = await db
        .selectFrom(dream.table)
        .selectAll()
        .where(dream['_primaryKey'], '=', dream.primaryKeyValue())
        .executeTakeFirstOrThrow()
      return data
    } else {
      const query = db
        .insertInto(dream.table)
        // NOTE: this is actually different from postgres, mysql does not support
        // calls to .returning(), so I am commenting it out. It would normally
        // go after the values call.
        // .returning([...dream.columns()] as any)
        .values(sqlifiedAttributes as any)
      const res = await executeDatabaseQuery(query, 'executeTakeFirstOrThrow')

      // mysql doesn't support "returning", so we do a separate
      // request here to reload data. This is not necessary
      // during an update at all, and only necessary during
      // create to capture the insert id. Doing this anyways,
      // since it is the easiest path to congruent behavior
      // with the postgres driver, but if I were using this
      // IRL i would adapt or remove this block and find
      // a different way to return the data
      const id = res.insertId
      const data = await db
        .selectFrom(dream.table)
        .selectAll()
        .where(dream['_primaryKey'], '=', id)
        .executeTakeFirstOrThrow()
      return data
    }
  }

  public static override serializeDbType(type: GenericDbType, val: any) {
    const mysqlSafeDatetimeFormat = 'yyyy-MM-dd HH:mm:ss'
    switch (type) {
      case 'datetime':
        if (val instanceof DateTime) {
          return val.toFormat(mysqlSafeDatetimeFormat)
        } else if (val instanceof CalendarDate) {
          return val.toDateTime()?.toFormat(mysqlSafeDatetimeFormat)
        }
        throw new Error(`unrecognized value found when trying to serialize for mysql datetime: ${val}`)

      case 'date':
        if (val instanceof DateTime || val instanceof CalendarDate) {
          return val.toSQL()
        }
        throw new Error(`unrecognized value found when trying to serialize for mysql date: ${val}`)

      default:
        return val
    }
  }

  public override orderByDirection(
    direction: OrderDir | null
  ): (obj: OrderByItemBuilder) => OrderByItemBuilder {
    switch (direction) {
      case 'asc':
      case null:
        return obj => obj.asc()
      // return sql`column_with_nulls IS NULL DESC, column_with_nulls ASC`

      case 'desc':
        return obj => obj.desc()
      // return sql`column_with_nulls IS NULL DESC, column_with_nulls DESC`

      default: {
        // protection so that if a new OrderDir is ever added, this will throw a type error at build time
        const _never: never = direction
        throw new Error(`Unhandled OrderDir: ${_never as string}`)
      }
    }
  }
}

// NOTE: this is code was generated by AI, and just barely gets what we need
// for our bare-bones test case. If you are thinking of copying this mysql
// adapter for any reason, I would re-approach this bit. I simply prompted my
// AI to try to give me something similar to what the postgres `TEMPLATE` api
// provides, since that is what we use to duplicate postgres databases.
async function duplicateMysqlDatabase(
  sourceDbName: string,
  targetDbName: string,
  connectionName: string
): Promise<void> {
  const client = loadMysqlClient({ useSystemDb: true, connectionName })

  return new Promise((resolve, reject) => {
    // First drop the target database if it exists, then create it
    client.query(`DROP DATABASE IF EXISTS ${targetDbName};`, dropErr => {
      if (dropErr) {
        client.end()
        reject(dropErr)
        return
      }

      client.query(`CREATE DATABASE ${targetDbName};`, createErr => {
        if (createErr) {
          client.end()
          reject(createErr)
          return
        }

        // Use mysqldump to export source database and import to target database
        // This is a simplified approach - in production you'd want to use proper mysqldump
        // For now, we'll copy table structure and data manually
        client.query(`SHOW TABLES FROM ${sourceDbName};`, (showErr, tables) => {
          if (showErr) {
            client.end()
            reject(showErr)
            return
          }

          if (!Array.isArray(tables) || tables.length === 0) {
            client.end()
            resolve()
            return
          }

          let completedTables = 0
          const tableNames = tables.map((row: any) => Object.values(row)[0] as string)

          tableNames.forEach(tableName => {
            // Copy table structure
            client.query(
              `CREATE TABLE ${targetDbName}.${tableName} LIKE ${sourceDbName}.${tableName};`,
              createTableErr => {
                if (createTableErr) {
                  client.end()
                  reject(createTableErr)
                  return
                }

                // Copy table data
                client.query(
                  `INSERT INTO ${targetDbName}.${tableName} SELECT * FROM ${sourceDbName}.${tableName};`,
                  insertErr => {
                    if (insertErr) {
                      client.end()
                      reject(insertErr)
                      return
                    }

                    completedTables++
                    if (completedTables === tableNames.length) {
                      client.end()
                      resolve()
                    }
                  }
                )
              }
            )
          })
        })
      })
    })
  })
}
