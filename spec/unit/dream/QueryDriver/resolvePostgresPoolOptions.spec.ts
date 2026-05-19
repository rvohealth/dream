import { resolvePostgresPoolTimeouts } from '../../../../src/dream/QueryDriver/Kysely.js'
import { SingleDbCredential } from '../../../../src/dream-app/index.js'

// The resolver returns ONLY the timeout keys the app explicitly set, so
// spreading it into `new pg.Pool({...})` is behavior-neutral when nothing is
// configured (pg keeps its own defaults) and forwards exactly what was set
// otherwise. This is the backward-compatibility contract: a pre-existing
// credential (no timeout fields) must yield `{}`.

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

describe('resolvePostgresPoolTimeouts', () => {
  it('returns {} when no timeout fields are set (backward compatible)', () => {
    expect(resolvePostgresPoolTimeouts(cred({}))).toEqual({})
  })

  it('omits unset keys entirely (not present as undefined)', () => {
    const result = resolvePostgresPoolTimeouts(cred({ connectionTimeoutMillis: 5000 }))
    expect(result).toEqual({ connectionTimeoutMillis: 5000 })
    expect('idleTimeoutMillis' in result).toBe(false)
    expect('statement_timeout' in result).toBe(false)
  })

  it('forwards every timeout field that is set', () => {
    expect(
      resolvePostgresPoolTimeouts(
        cred({
          connectionTimeoutMillis: 5000,
          idleTimeoutMillis: 30000,
          maxLifetimeSeconds: 600,
          max: 20,
          statement_timeout: 10000,
          query_timeout: 10000,
        })
      )
    ).toEqual({
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      maxLifetimeSeconds: 600,
      max: 20,
      statement_timeout: 10000,
      query_timeout: 10000,
    })
  })

  it('treats an explicit 0 as set (distinct from unset)', () => {
    expect(resolvePostgresPoolTimeouts(cred({ connectionTimeoutMillis: 0 }))).toEqual({
      connectionTimeoutMillis: 0,
    })
  })
})
