import { Client } from 'pg'
import loadDBConfig from '../loadDBConfig'

export default async function loadPgClient({ useSystemDb }: { useSystemDb?: boolean } = {}) {
  const data = await loadDBConfig()
  const client = new Client({
    host: data.host || 'localhost',
    port: data.port,
    database: useSystemDb ? 'postgres' : data.name,
    user: data.user,
    password: data.password,
  })
  await client.connect()
  return client
}
