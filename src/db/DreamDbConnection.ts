// after building for esm, importing pg using the following:
//
//  import * as pg from 'pg'
//
// will crash. This is difficult to discover, since it only happens
// when being imported from our esm build.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pg from 'pg'

import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely'
import DreamApp, { KyselyLogEvent, SingleDbCredential } from '../dream-app/index.js'
import { DbConnectionType } from '../types/db.js'
import protectAgainstPollutingAssignment from '../helpers/protectAgainstPollutingAssignment.js'

let connections = {} as { [key: string]: { [key: string]: Kysely<any> } }

export default class DreamDbConnection {
  public static getConnection<DB>(connectionName: string, connectionType: DbConnectionType): Kysely<DB> {
    const dreamApp = DreamApp.getOrFail()
    const connectionTypeName = this.getConnectionTypeName(connectionType)
    const connection = connections[connectionName]?.[connectionTypeName]
    if (connection) {
      return connection
    }

    const connectionConf = dreamApp.dbConnectionConfig(connectionName, connectionType)

    const dbConn = new Kysely<DB>({
      log(event) {
        const dreamApp = DreamApp.getOrFail()
        dreamApp.specialHooks.dbLog.forEach(fn => {
          fn(event as KyselyLogEvent)
        })
      },

      dialect: new PostgresDialect({
        pool: new pg.Pool({
          user: connectionConf.user || '',
          password: connectionConf.password || '',
          database: dreamApp.dbName(connectionName, connectionType),
          host: connectionConf.host || 'localhost',
          port: connectionConf.port || 5432,
          ssl: connectionConf.useSsl ? sslConfig(connectionConf) : false,
        }),
      }),
      plugins: [new CamelCasePlugin({ underscoreBetweenUppercaseLetters: true })],
    })

    const protectedName = protectAgainstPollutingAssignment(connectionName)
    connections[protectedName] ||= {}
    connections[protectedName][this.getConnectionTypeName(connectionType)] = dbConn

    return dbConn
  }

  private static getConnectionTypeName(connectionType: DbConnectionType): string {
    return DreamApp.getOrFail().parallelDatabasesEnabled
      ? `${connectionType}_${process.env.VITEST_POOL_ID}`
      : connectionType
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function sslConfig(connectionConf: SingleDbCredential) {
  // TODO: properly configure (https://rvohealth.atlassian.net/browse/PDTC-2914)
  return {
    rejectUnauthorized: false,
    // ca: fs.readFileSync('/path/to/server-certificates/root.crt').toString(),
    // key: fs.readFileSync('/path/to/client-key/postgresql.key').toString(),
    // cert: fs.readFileSync('/path/to/client-certificates/postgresql.crt').toString(),
  }
}

export function dreamDbConnections() {
  return connections
}

export async function closeAllDbConnections() {
  const connectionNames = Object.keys(connections)
  for (const connectionName of connectionNames) {
    await closeAllConnectionsForConnectionName(connectionName)
  }
  connections = {}
}

export async function closeAllConnectionsForConnectionName(connectionName: string) {
  const protectedName = protectAgainstPollutingAssignment(connectionName)
  return await Promise.allSettled(
    Object.keys(connections[connectionName]!).map(async key => {
      const conn = connections[connectionName]![key]!
      await conn.destroy()
      delete connections[protectedName]![key]
    })
  )
}
