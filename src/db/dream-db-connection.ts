import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import Dreamconf from '../helpers/dreamconf'
import { DbConnectionConfig } from '../helpers/path/types'
import ConnectionConfRetriever from './connection-conf-retriever'
import { DbConnectionType } from './types'

const connections = {} as { [key: string]: Kysely<any> }

export default class DreamDbConnection {
  public static getConnection<DB>(connectionType: DbConnectionType, dreamconf: Dreamconf): Kysely<DB> {
    const connection = connections[connectionType]
    if (connection) return connection

    const connectionConf = new ConnectionConfRetriever(dreamconf).getConnectionConf(connectionType)

    const dbConn = new Kysely<DB>({
      log: process.env.DEBUG === '1' ? ['query'] : undefined,
      dialect: new PostgresDialect({
        pool: new Pool({
          user: process.env[connectionConf.user] || '',
          password: process.env[connectionConf.password] || '',
          database: process.env[connectionConf.name],
          host: process.env[connectionConf.host] || 'localhost',
          port: process.env[connectionConf.port] ? parseInt(process.env[connectionConf.port]!) : 5432,
          ssl: connectionConf.use_ssl
            ? process.env[connectionConf.use_ssl] === '1'
              ? sslConfig(connectionConf)
              : false
            : false,
        }),
      }),
      plugins: [new CamelCasePlugin({ underscoreBetweenUppercaseLetters: true })],
    })

    connections[connectionType] = dbConn

    return dbConn
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function sslConfig(connectionConf: DbConnectionConfig) {
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
