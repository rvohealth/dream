// after building for esm, importing pg using the following:
//
//  import * as pg from 'pg'
//
// will crash. This is difficult to discover, since it only happens
// when being imported from our esm build.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pg from 'pg'

import DreamApp from '../../../../dream-app/index.js'

export class PasswordProviderPoolClient extends pg.Client {
  public override connect(): Promise<void>
  public override connect(callback: (err: Error) => void): void
  public override connect(callback?: (err: Error) => void): Promise<void> | void {
    if (callback) {
      super.connect(err => {
        if (err) this.destroyConnectionStream()
        callback(err)
      })
    } else {
      return super.connect().catch(err => {
        this.destroyConnectionStream()
        throw err
      })
    }
  }

  private destroyConnectionStream() {
    // pg reports a rejected password provider without closing its socket.
    ;(this as pg.Client & { connection?: pg.Connection }).connection?.stream.destroy()
  }
}

export default async function loadPgClient({
  connectionName,
  useSystemDb,
}: {
  connectionName: string
  useSystemDb?: boolean
}) {
  const dreamconf = DreamApp.getOrFail()
  const creds = dreamconf.dbCredentialsFor(connectionName)?.primary
  if (!creds) throw new Error(`failed to load db credentials for connection: ${connectionName}`)

  const client = new pg.Client({
    host: creds.host || 'localhost',
    port: creds.port,
    database: useSystemDb ? 'postgres' : creds.name,
    user: creds.user,
    password: creds.password,
  })
  try {
    await client.connect()
  } catch (err) {
    await client.end().catch(() => undefined)
    throw err
  }
  return client
}
