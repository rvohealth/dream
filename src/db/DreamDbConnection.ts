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
import DreamApplication, { KyselyLogEvent, SingleDbCredential } from '../dream-application/index.js'
import { DbConnectionType } from '../types/db.js'
import ConnectionConfRetriever from './ConnectionConfRetriever.js'

let connections = {} as { [key: string]: Kysely<any> }

export default class DreamDbConnection {
  public static getConnection<DB>(connectionType: DbConnectionType): Kysely<DB> {
    const dreamApp = DreamApplication.getOrFail()
    const connectionName = dreamApp.getConnectionTypeName(connectionType)
    const connection = connections[connectionName]
    if (connection) {
      return connection
    }

    const connectionConf = new ConnectionConfRetriever().getConnectionConf(connectionType)

    const dbConn = new Kysely<DB>({
      log(event) {
        const dreamApp = DreamApplication.getOrFail()
        dreamApp.specialHooks.dbLog.forEach(fn => {
          fn(event as KyselyLogEvent)
        })
      },

      dialect: new PostgresDialect({
        pool: new pg.Pool({
          user: connectionConf.user || '',
          password: connectionConf.password || '',
          database: dreamApp.getDatabaseName(connectionConf.name),
          host: connectionConf.host || 'localhost',
          port: connectionConf.port || 5432,
          ssl: connectionConf.useSsl ? sslConfig(connectionConf) : false,
        }),
      }),
      plugins: [new CamelCasePlugin({ underscoreBetweenUppercaseLetters: true })],
    })

    connections[dreamApp.getConnectionTypeName(connectionType)] = dbConn

    return dbConn
  }

  public static async dropAllConnections() {
    for (const key of Object.keys(connections)) {
      await connections[key]?.destroy()
      delete connections[key]
    }
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
  await Promise.all(Object.values(connections).map(conn => conn.destroy()))
  connections = {}
}
