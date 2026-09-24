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

describe('database password providers', () => {
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
