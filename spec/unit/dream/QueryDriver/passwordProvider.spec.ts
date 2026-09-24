import pg from 'pg'
import KyselyQueryDriver from '../../../../src/dream/QueryDriver/Kysely.js'
import DreamApp, { type DreamDbConfig } from '../../../../src/dream-app/index.js'
import MysqlQueryDriver from '../../../../test-app/app/conf/mysql/MysqlQueryDriver.js'
import loadMysqlClient from '../../../../test-app/app/conf/mysql/loadMysqlClient.js'

function credentials(password: DreamDbConfig['password']): DreamDbConfig {
  return { user: 'user', password, host: 'localhost', name: 'dream_test', port: 5432, ssl: false }
}

describe('database password providers', () => {
  it('passes an unresolved provider through to the PostgreSQL pool', async () => {
    const provider = vi.fn(() => Promise.resolve('new-token'))
    const on = vi.spyOn(pg.Pool.prototype, 'on')

    KyselyQueryDriver.dialectProvider('default', 'primary')(credentials(provider))

    const pool = on.mock.instances.at(-1) as pg.Pool
    expect(pool.options.password).toBe(provider)
    expect(provider).not.toHaveBeenCalled()
    await pool.end()
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
