import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import DreamApplication, { SingleDbCredential } from '../dream-application'
import { envBool } from '../helpers/envHelpers'
import ConnectionConfRetriever from './ConnectionConfRetriever'
import { DbConnectionType } from './types'

const connections = {} as { [key: string]: Kysely<any> }

export default class DreamDbConnection {
  public static getConnection<DB>(connectionType: DbConnectionType): Kysely<DB> {
    const connectionName = getConnectionTypeName(connectionType)
    const connection = connections[connectionName]
    if (connection) {
      return connection
    }

    const connectionConf = new ConnectionConfRetriever().getConnectionConf(connectionType)

    const dbConn = new Kysely<DB>({
      log: envBool('DEBUG') ? ['query', 'error'] : undefined,
      dialect: new PostgresDialect({
        pool: new Pool({
          user: connectionConf.user || '',
          password: connectionConf.password || '',
          database: getDatabaseName(connectionConf.name),
          host: connectionConf.host || 'localhost',
          port: connectionConf.port || 5432,
          ssl: connectionConf.useSsl ? sslConfig(connectionConf) : false,
        }),
      }),
      plugins: [new CamelCasePlugin({ underscoreBetweenUppercaseLetters: true })],
    })

    connections[getConnectionTypeName(connectionType)] = dbConn

    return dbConn
  }

  public static async dropAllConnections() {
    for (const key of Object.keys(connections)) {
      await connections[key].destroy()
      delete connections[key]
    }
  }
}

function getConnectionTypeName(connectionType: DbConnectionType): string {
  return parallelDatabasesEnabled() ? `${connectionType}_${process.env.JEST_WORKER_ID}` : connectionType
}

function getDatabaseName(dbName: string): string {
  return parallelDatabasesEnabled() ? `${dbName}_${process.env.JEST_WORKER_ID}` : dbName
}

function parallelDatabasesEnabled(): boolean {
  return (
    !!DreamApplication.getOrFail().parallelTests &&
    !Number.isNaN(Number(process.env.JEST_WORKER_ID)) &&
    Number(process.env.JEST_WORKER_ID) > 1
  )
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
}
