import { Client } from 'pg'
import { getCachedDreamconfOrFail } from '../../dreamconf/cache'

export default async function loadPgClient({ useSystemDb }: { useSystemDb?: boolean } = {}) {
  const dreamconf = getCachedDreamconfOrFail()
  const creds = dreamconf.dbCredentials.primary

  const client = new Client({
    host: creds.host || 'localhost',
    port: creds.port,
    database: useSystemDb ? 'postgres' : creds.name,
    user: creds.user,
    password: creds.password,
  })
  await client.connect()
  return client
}
