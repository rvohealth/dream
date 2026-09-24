import { EventEmitter } from 'node:events'
import pg from 'pg'
import KyselyQueryDriver from '../../../../src/dream/QueryDriver/Kysely.js'
import PostgresQueryDriver from '../../../../src/dream/QueryDriver/Postgres.js'
import DreamApp, { type DreamDbConfig } from '../../../../src/dream-app/index.js'
import MysqlQueryDriver from '../../../../test-app/app/conf/mysql/MysqlQueryDriver.js'
import loadMysqlClient from '../../../../test-app/app/conf/mysql/loadMysqlClient.js'
import loadPgClient from '../../../../src/dream/QueryDriver/helpers/pg/loadPgClient.js'

function credentials(password: DreamDbConfig['password']): DreamDbConfig {
  return { user: 'user', password, host: 'localhost', name: 'dream_test', port: 5432, ssl: false }
}

function pgClientParameters(client: pg.Client): { password: unknown; database: string } {
  return (client as pg.Client & { connectionParameters: { password: unknown; database: string } })
    .connectionParameters
}

// Drive node-postgres through its real authentication handlers without relying
// on the local server's pg_hba.conf. Only the wire connection is controlled.
class PasswordAuthenticationConnection extends EventEmitter {
  public static instances: PasswordAuthenticationConnection[] = []
  public sentPasswords: string[] = []
  public stream = { destroy: vi.fn() }
  public _connecting = false

  constructor() {
    super()
    PasswordAuthenticationConnection.instances.push(this)
  }

  connect() {
    this._connecting = true
    queueMicrotask(() => this.emit('connect'))
  }

  startup() {
    this.emit('authenticationCleartextPassword')
  }

  password(value: string) {
    this.sentPasswords.push(value)
    queueMicrotask(() => this.emit('readyForQuery'))
  }

  end() {
    queueMicrotask(() => this.emit('end'))
  }
}

type AuthenticatedPoolClient = pg.PoolClient & {
  authenticationConnection: PasswordAuthenticationConnection
}

function controlledPool(password: DreamDbConfig['password']) {
  const on = vi.spyOn(pg.Pool.prototype, 'on')
  KyselyQueryDriver.dialectProvider('default', 'primary')(credentials(password))
  const pool = on.mock.instances.at(-1) as pg.Pool
  const controlledPoolClient = pool as pg.Pool & { Client: typeof pg.Client }
  const PoolClient = controlledPoolClient.Client
  class PasswordAuthenticationClient extends PoolClient {
    public readonly authenticationConnection: PasswordAuthenticationConnection

    constructor(config: pg.ClientConfig) {
      const connection = new PasswordAuthenticationConnection()
      // pg-pool hides password as a non-enumerable option; retain it explicitly.
      super({ ...config, password: config.password, connection } as pg.ClientConfig)
      this.authenticationConnection = connection
    }
  }
  controlledPoolClient.Client = PasswordAuthenticationClient
  return pool
}

describe('database password providers', () => {
  it('uses a fixed password when PostgreSQL requests authentication', async () => {
    const pool = controlledPool('fixed-password')
    try {
      const client = (await pool.connect()) as AuthenticatedPoolClient
      expect(client.authenticationConnection.sentPasswords).toEqual(['fixed-password'])
      client.release(true)
    } finally {
      await pool.end()
    }
  })

  it('uses synchronous and asynchronous provider results for new physical clients', async () => {
    const provider = vi
      .fn<() => string | Promise<string>>()
      .mockReturnValueOnce('first-token')
      .mockResolvedValueOnce('second-token')
    const pool = controlledPool(provider)

    try {
      const first = (await pool.connect()) as AuthenticatedPoolClient
      expect(first.authenticationConnection.sentPasswords).toEqual(['first-token'])
      first.release(true)

      const second = (await pool.connect()) as AuthenticatedPoolClient
      expect(second).not.toBe(first)
      expect(second.authenticationConnection.sentPasswords).toEqual(['second-token'])
      expect(provider).toHaveBeenCalledTimes(2)
      second.release(true)
    } finally {
      await pool.end()
    }
  })

  it('passes a provider rejection to the PostgreSQL connection caller', async () => {
    const failure = new Error('credential service unavailable')
    const provider = vi.fn(() => Promise.reject(failure))
    const pool = controlledPool(provider)

    try {
      await expect(pool.connect()).rejects.toBe(failure)
      expect(provider).toHaveBeenCalledOnce()
      expect(PasswordAuthenticationConnection.instances.at(-1)?.stream.destroy).toHaveBeenCalledOnce()
    } finally {
      await pool.end()
    }
  })

  it('passes an unresolved provider through to the PostgreSQL pool', async () => {
    const provider = vi.fn(() => Promise.resolve('new-token'))
    const on = vi.spyOn(pg.Pool.prototype, 'on')
    const ssl = { rejectUnauthorized: true, ca: 'CA certificate' }

    KyselyQueryDriver.dialectProvider('default', 'primary')({ ...credentials(provider), ssl })

    const pool = on.mock.instances.at(-1) as pg.Pool
    expect(pool.options.password).toBe(provider)
    expect(pool.options.database).toBe(DreamApp.getOrFail().dbName('default', 'primary'))
    expect(pool.options.ssl).toBe(ssl)
    expect(pool.listenerCount('error')).toBeGreaterThan(0)
    expect(provider).not.toHaveBeenCalled()
    await pool.end()
  })

  it('passes an unresolved provider to the direct PostgreSQL client', async () => {
    const provider = vi.fn(() => Promise.resolve('new-token'))
    const app = DreamApp.getOrFail()
    const original = app.dbCredentialsFor('default')!
    const connect = vi.spyOn(pg.Client.prototype, 'connect').mockResolvedValue()
    app.set('db', { ...original, primary: { ...original.primary, password: provider } })

    try {
      const client = await loadPgClient({ connectionName: 'default', useSystemDb: true })
      expect(connect).toHaveBeenCalledOnce()
      expect(pgClientParameters(client).password).toBe(provider)
      expect(pgClientParameters(client).database).toBe('postgres')
      expect(provider).not.toHaveBeenCalled()
    } finally {
      app.set('db', original)
    }
  })

  it('closes a direct PostgreSQL client after its password provider rejects', async () => {
    const failure = new Error('credential service unavailable')
    const app = DreamApp.getOrFail()
    const original = app.dbCredentialsFor('default')!
    vi.spyOn(pg.Client.prototype, 'connect').mockRejectedValue(failure)
    const end = vi.spyOn(pg.Client.prototype, 'end').mockResolvedValue()
    app.set('db', { ...original, primary: { ...original.primary, password: () => Promise.reject(failure) } })

    try {
      await expect(loadPgClient({ connectionName: 'default' })).rejects.toBe(failure)
      expect(end).toHaveBeenCalledOnce()
    } finally {
      app.set('db', original)
    }
  })

  it('passes an unresolved provider to the test-database lock client', async () => {
    const provider = vi.fn(() => 'new-token')
    const app = DreamApp.getOrFail()
    const original = app.dbCredentialsFor('default')!
    const connect = vi.spyOn(pg.Client.prototype, 'connect').mockResolvedValue()
    vi.spyOn(pg.Client.prototype, 'end').mockResolvedValue()
    app.set('db', { ...original, primary: { ...original.primary, password: provider } })

    try {
      const session = await PostgresQueryDriver.openTestDatabaseLockSession('default')
      const client = connect.mock.instances.at(-1) as pg.Client
      expect(pgClientParameters(client).password).toBe(provider)
      expect(pgClientParameters(client).database).toBe('postgres')
      expect(provider).not.toHaveBeenCalled()
      await session.release()
    } finally {
      app.set('db', original)
    }
  })

  it('closes a test-database lock client after its password provider rejects', async () => {
    const failure = new Error('credential service unavailable')
    const app = DreamApp.getOrFail()
    const original = app.dbCredentialsFor('default')!
    vi.spyOn(pg.Client.prototype, 'connect').mockRejectedValue(failure)
    const end = vi.spyOn(pg.Client.prototype, 'end').mockResolvedValue()
    app.set('db', { ...original, primary: { ...original.primary, password: () => Promise.reject(failure) } })

    try {
      await expect(PostgresQueryDriver.openTestDatabaseLockSession('default')).rejects.toBe(failure)
      expect(end).toHaveBeenCalledOnce()
    } finally {
      app.set('db', original)
    }
  })

  it('rejects a provider at the MySQL pool boundary', () => {
    const provider = vi.fn(() => Promise.resolve('new-token'))

    expect(() => MysqlQueryDriver.dialectProvider('mysql', 'primary')(credentials(provider))).toThrow(
      'MySQL does not support a password provider'
    )
    expect(provider).not.toHaveBeenCalled()
  })

  it('rejects a provider at the MySQL direct-client boundary', () => {
    const provider = vi.fn(() => Promise.resolve('new-token'))
    const app = DreamApp.getOrFail()
    const original = app.dbCredentialsFor('mysql')!
    app.set('db', 'mysql', { ...original, primary: credentials(provider) })

    try {
      expect(() => loadMysqlClient({ connectionName: 'mysql' })).toThrow(
        'MySQL does not support a password provider'
      )
      expect(provider).not.toHaveBeenCalled()
    } finally {
      app.set('db', 'mysql', original)
    }
  })
})
