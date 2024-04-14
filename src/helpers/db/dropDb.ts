import loadPgClient from './loadPgClient'
import { DbConnectionType } from '../../db/types'
import ConnectionConfRetriever from '../../db/connection-conf-retriever'
import loadDreamconfFile from '../path/loadDreamconfFile'

export default async function dropDb(connection: DbConnectionType, dbName?: string | null) {
  // this was only ever written to clear the db between tests or in development,
  // so there is no way to drop in production
  if (process.env.NODE_ENV === 'production') return false

  const connectionRetriever = new ConnectionConfRetriever(await loadDreamconfFile())
  const dbConf = connectionRetriever.getConnectionConf(connection)

  dbName ||= process.env[dbConf.name] || null
  if (!dbName)
    throw `Must either pass a dbName to the drop function, or else ensure that DB_NAME is set in the env`

  const client = await loadPgClient({ useSystemDb: true })
  await client.query(`DROP DATABASE IF EXISTS ${dbName};`)
}
