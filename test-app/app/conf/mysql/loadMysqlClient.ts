import * as mysql from 'mysql2'
import { DreamApp } from '../../../../src/index.js'

export default function loadMysqlClient({
  connectionName,
  useSystemDb,
  // TODO: maybe harden connectionName type
}: {
  connectionName: string
  useSystemDb?: boolean
}): mysql.Connection {
  const dreamconf = DreamApp.getOrFail()
  const creds = dreamconf.dbCredentialsFor(connectionName)?.primary
  if (!creds) throw new Error(`failed to load db credentials for connection: ${connectionName}`)

  const connection = mysql.createConnection({
    host: creds.host || 'localhost',
    port: creds.port,
    ...(useSystemDb ? {} : { database: creds.name }),
    user: useSystemDb ? process.env.DB_USER_ROOT_MYSQL || creds.user : creds.user,
    password: creds.password,
  })
  connection.connect()
  return connection
}
