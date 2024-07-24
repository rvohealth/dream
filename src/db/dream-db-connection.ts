import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import Dreamconf, { SingleDbCredential } from '../dreamconf'
import ConnectionConfRetriever from './connection-conf-retriever'
import { DbConnectionType } from './types'

const connections = {} as { [key: string]: Kysely<any> }

export default class DreamDbConnection {
  public static getConnection<DB>(connectionType: DbConnectionType, dreamconf: Dreamconf): Kysely<DB> {
    const connection = connections[connectionType]
    if (connection) return connection

    const connectionConf = new ConnectionConfRetriever(dreamconf).getConnectionConf(connectionType)

    const dbConn = new Kysely<DB>({
      log: process.env.DEBUG === '1' ? ['query', 'error'] : undefined,
      dialect: new PostgresDialect({
        pool: new Pool({
          user: connectionConf.user || '',
          password: connectionConf.password || '',
          database: connectionConf.name,
          host: connectionConf.host || 'localhost',
          port: connectionConf.port || 5432,
          ssl: connectionConf.useSsl ? sslConfig(connectionConf) : false,
        }),
      }),
      plugins: [new CamelCasePlugin({ underscoreBetweenUppercaseLetters: true })],
    })

    connections[connectionType] = dbConn

    return dbConn
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
}
