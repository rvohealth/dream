import ConnectionConfRetriever from '../../db/ConnectionConfRetriever'
import { DbConnectionType } from '../../db/types'
import EnvInternal from '../EnvInternal'
import loadPgClient from './loadPgClient'

export default async function createDb(connection: DbConnectionType, dbName?: string | null) {
  // this was only ever written to clear the db between tests or in development,
  // so there is no way to drop in production
  if (EnvInternal.isProduction) return false

  const connectionRetriever = new ConnectionConfRetriever()
  const dbConf = connectionRetriever.getConnectionConf(connection)

  dbName ||= dbConf.name || null
  if (!dbName)
    throw new Error(
      'Must either pass a dbName to the create function, or else ensure that DB_NAME is set in the env'
    )

  const client = await loadPgClient({ useSystemDb: true })
  await client.query(`CREATE DATABASE ${dbName};`)
  await client.end()
}
