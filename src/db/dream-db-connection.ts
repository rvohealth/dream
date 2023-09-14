import { Kysely, PostgresDialect, CamelCasePlugin } from 'kysely'
import ConnectionConfRetriever from './connection-conf-retriever'
import { DbConnectionType } from './types'
import { Pool } from 'pg'
import Dreamconf from '../../shared/dreamconf'

const connections = {} as any

export default class DreamDbConnection {
  public static getConnection<DB extends any>(
    connectionType: DbConnectionType,
    dreamconf: Dreamconf
  ): Kysely<DB> {
    const connection = connections[connectionType]
    if (connection) return connection

    const connectionConf = new ConnectionConfRetriever(dreamconf).getConnectionConf(connectionType)

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
      plugins: [new CamelCasePlugin({ underscoreBetweenUppercaseLetters: true })],
    })

    connections[connectionType] = dbConn

    return dbConn
  }
}
