import { resolvePostgresPoolOptions } from '../../../../src/dream/QueryDriver/Kysely.js'
import { SingleDbCredential } from '../../../../src/dream-app/index.js'

// The resolver returns ONLY the pg passthrough keys the app explicitly set,
// so spreading it into `new pg.Pool({...})` is behavior-neutral when nothing
// is configured (pg keeps its own defaults) and forwards exactly what was set
// otherwise. This is the backward-compatibility contract: a pre-existing
// credential (no passthrough fields) must yield `{}`.

function cred(overrides: Partial<SingleDbCredential>): SingleDbCredential {
  return {
    user: 'u',
    password: 'p',
    host: 'h',
    name: 'n',
    port: 5432,
    ...overrides,
  }
}

describe('resolvePostgresPoolOptions', () => {
  it('returns {} when no passthrough fields are set (backward compatible)', () => {
    expect(resolvePostgresPoolOptions(cred({}))).toEqual({})
  })

  it('omits unset keys entirely (not present as undefined)', () => {
    const result = resolvePostgresPoolOptions(cred({ connectionTimeoutMillis: 5000 }))
    expect(result).toEqual({ connectionTimeoutMillis: 5000 })
    expect('idleTimeoutMillis' in result).toBe(false)
    expect('application_name' in result).toBe(false)
  })

  it('forwards every supported passthrough field that is set', () => {
    const conf = cred({
      application_name: 'myapp',
      keepAlive: true,
      keepAliveInitialDelayMillis: 5000,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      maxLifetimeSeconds: 600,
      max: 20,
      maxUses: 7500,
      allowExitOnIdle: true,
      statement_timeout: 10000,
      query_timeout: 10000,
      lock_timeout: 3000,
      idle_in_transaction_session_timeout: 10000,
      options: '-c search_path=tenant_1',
    })
    expect(resolvePostgresPoolOptions(conf)).toEqual({
      application_name: 'myapp',
      keepAlive: true,
      keepAliveInitialDelayMillis: 5000,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      maxLifetimeSeconds: 600,
      max: 20,
      maxUses: 7500,
      allowExitOnIdle: true,
      statement_timeout: 10000,
      query_timeout: 10000,
      lock_timeout: 3000,
      idle_in_transaction_session_timeout: 10000,
      options: '-c search_path=tenant_1',
    })
  })

  it('does not expose connectionString (it would override Dream db name / ssl)', () => {
    // @ts-expect-error connectionString is intentionally not part of SingleDbCredential
    const result = resolvePostgresPoolOptions(cred({ connectionString: 'postgres://x/y' }))
    expect('connectionString' in result).toBe(false)
  })

  it('treats explicit 0 / false as set (distinct from unset)', () => {
    expect(resolvePostgresPoolOptions(cred({ connectionTimeoutMillis: 0, keepAlive: false }))).toEqual({
      connectionTimeoutMillis: 0,
      keepAlive: false,
    })
  })

  it('does not expose pg `min` (node-pg pool ignores it — would be a silent no-op)', () => {
    // @ts-expect-error min is intentionally not part of SingleDbCredential
    const result = resolvePostgresPoolOptions(cred({ min: 2 }))
    expect('min' in result).toBe(false)
  })
})
