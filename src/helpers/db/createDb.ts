import loadPgClient from './loadPgClient'
import { DbConnectionType } from '../../db/types'
import ConnectionConfRetriever from '../../db/connection-conf-retriever'

export default async function createDb(connection: DbConnectionType, dbName?: string | null) {
  // this was only ever written to clear the db between tests or in development,
  // so there is no way to drop in production
  if (process.env.NODE_ENV === 'production') return false

  const connectionRetriever = new ConnectionConfRetriever()
  const dbConf = connectionRetriever.getConnectionConf(connection)

  dbName ||= process.env[dbConf.name] || null

  if (!dbName)
    throw `Must either pass a dbName to the create function, or else ensure that DB_NAME is set in the env`

  const client = await loadPgClient({ useSystemDb: true })
  await client.query(`CREATE DATABASE ${dbName};`)
}
