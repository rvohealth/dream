import { Kysely, PostgresDialect } from 'kysely'
import { DB } from '../sync/schema'
import ConnectionConfRetriever from './connection-conf-retriever'
import { DbConnectionType } from './types'
import { Pool } from 'pg'
import Benchmark from '../../shared/helpers/benchmark'
import debug from '../../shared/helpers/debug'

const connections = {} as any

export default class DreamDbConnection {
  public static getConnection(connectionType: DbConnectionType) {
    const connection = connections[connectionType]
    if (connection) return connection

    const connectionConf = new ConnectionConfRetriever().getConnectionConf(connectionType)

    const benchmark = new Benchmark()
    benchmark.start()
    benchmark.mark('BEGINNING CONNECT TO DB...')
    const pool = new Pool({
      user: process.env[connectionConf.user] || '',
      password: process.env[connectionConf.password] || '',
      database: process.env[connectionConf.name],
      host: process.env[connectionConf.host] || 'localhost',
      port: process.env[connectionConf.port] ? parseInt(process.env[connectionConf.port]!) : 5432,
      ssl: connectionConf.use_ssl ? process.env[connectionConf.use_ssl] === '1' : false,
      query_timeout: 60000,
      // max: process.env.MAX_DB_CONNECTIONS ? parseInt(process.env.MAX_DB_CONNECTIONS!) : 10,
      // idleTimeoutMillis: 60 * 60 * 24 * 1000,
    })

    const dbConn = new Kysely<DB>({
      dialect: new PostgresDialect({
        pool,
        onCreateConnection: async () => {
          console.log('NUMBER OF DB CONNECTIONS: ', pool.totalCount)
          benchmark.mark('ENDING CONNECT TO DB...')
        },
      }),
    })

    connections[connectionType] = dbConn

    return dbConn
  }
}
