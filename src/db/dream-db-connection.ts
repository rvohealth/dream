import { Kysely, PostgresDialect } from 'kysely'
import { DB } from '../sync/schema'
import ConnectionConfRetriever from './connection-conf-retriever'
import { DbConnectionType } from './types'
import { Pool } from 'pg'

const connectionCache = {} as any

export default class DreamDbConnection {
  public static getConnection(connection: DbConnectionType) {
    const cachedConnection = connectionCache[process.env.NODE_ENV!]?.[connection]
    if (cachedConnection) return cachedConnection

    const connectionConf = new ConnectionConfRetriever().getConnectionConf(connection)

    const dbConn = new Kysely<DB>({
      dialect: new PostgresDialect({
        pool: new Pool({
          user: process.env[connectionConf.user] || '',
          password: process.env[connectionConf.password] || '',
          database: process.env[connectionConf.name],
          host: process.env[connectionConf.host] || 'localhost',
          port: process.env[connectionConf.port] ? parseInt(process.env[connectionConf.port]!) : 5432,
          ssl: connectionConf.use_ssl ? process.env[connectionConf.use_ssl] === '1' : false,
        }),
      }),
    })

    connectionCache[process.env.NODE_ENV!] ||= {}
    connectionCache[process.env.NODE_ENV!][connection] = dbConn

    return dbConn
  }
}
