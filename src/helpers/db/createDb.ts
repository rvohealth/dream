import { Client } from 'pg'
import loadPgClient from './loadPgClient'

export default async function createDb(dbName: string | null = process.env.DB_NAME || null) {
  // this was only ever written to clear the db between tests or in development,
  // so there is no way to drop in production
  if (process.env.NODE_ENV === 'production') return false
  if (!dbName)
    throw `Must either pass a dbName to the create function, or else ensure that DB_NAME is set in the env`

  const client = await loadPgClient({ useSystemDb: true })
  await client.query(`CREATE DATABASE ${dbName};`)
}
