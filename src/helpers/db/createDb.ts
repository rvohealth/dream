import DreamApp from '../../dream-app/index.js'
import { DbConnectionType } from '../../types/db.js'
import EnvInternal from '../EnvInternal.js'
import loadPgClient from './loadPgClient.js'

export default async function createDb(connection: DbConnectionType, dbName?: string | null) {
  // this was only ever written to clear the db between tests or in development,
  // so there is no way to drop in production
  if (EnvInternal.isProduction) return false

  const dreamApp = DreamApp.getOrFail()
  const dbConf = dreamApp.dbConnectionConfig(connection)

  dbName ||= dbConf.name || null
  if (!dbName)
    throw new Error(
      'Must either pass a dbName to the create function, or else ensure that DB_NAME is set in the env'
    )

  const client = await loadPgClient({ useSystemDb: true })
  await client.query(`CREATE DATABASE ${dbName};`)
  await client.end()
}
