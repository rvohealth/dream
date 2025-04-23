// after building for esm, importing pg using the following:
//
//  import * as pg from 'pg'
//
// will crash. This is difficult to discover, since it only happens
// when being imported from our esm build.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pg from 'pg'

import DreamApp from '../../dream-app/index.js'

export default async function loadPgClient({ useSystemDb }: { useSystemDb?: boolean } = {}) {
  const dreamconf = DreamApp.getOrFail()
  const creds = dreamconf.dbCredentials.primary

  const client = new pg.Client({
    host: creds.host || 'localhost',
    port: creds.port,
    database: useSystemDb ? 'postgres' : creds.name,
    user: creds.user,
    password: creds.password,
  })
  await client.connect()
  return client
}
