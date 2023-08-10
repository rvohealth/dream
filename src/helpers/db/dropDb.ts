import { Client } from 'pg'
import loadPgClient from './loadPgClient'
import { loadDbConfigYamlFile } from '../path'

export default async function dropDb(dbName?: string | null) {
  // this was only ever written to clear the db between tests or in development,
  // so there is no way to drop in production
  if (process.env.NODE_ENV === 'production') return false

  const dbConf = await loadDbConfigYamlFile()
  dbName ||= process.env[dbConf.name] || null
  if (!dbName)
    throw `Must either pass a dbName to the drop function, or else ensure that DB_NAME is set in the env`

  const client = await loadPgClient({ useSystemDb: true })
  await client.query(`DROP DATABASE IF EXISTS ${dbName};`)
}
