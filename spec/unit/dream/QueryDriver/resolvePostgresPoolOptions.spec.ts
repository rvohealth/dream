import { DreamDbConfig } from '../../../../src/dream-app/index.js'

// Verify that DreamDbConfig.pg accepts the pg passthrough fields we care
// about, and that the type-level exclusions (connectionString, min, the
// Dream-managed fields) are not present.

function cred(overrides: Partial<DreamDbConfig>): DreamDbConfig {
  return {
    user: 'u',
    password: 'p',
    host: 'h',
    name: 'n',
    port: 5432,
    ...overrides,
  }
}

describe('DreamDbConfig.pg passthrough', () => {
  it('accepts supported pg options', () => {
    const c = cred({
      pg: {
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
      },
    })
    expect(c.pg?.application_name).toBe('myapp')
    expect(c.pg?.connectionTimeoutMillis).toBe(5000)
  })

  it('does not expose connectionString at the type level', () => {
    // @ts-expect-error connectionString is intentionally omitted from pg passthrough
    void cred({ pg: { connectionString: 'postgres://x/y' } })
  })

  it('does not expose min at the type level', () => {
    // @ts-expect-error min is intentionally omitted (node-pg silently ignores it)
    void cred({ pg: { min: 2 } })
  })

  it('does not expose Dream-managed fields at the type level', () => {
    // @ts-expect-error user is managed by Dream
    void cred({ pg: { user: 'x' } })
  })

  it('is omittable entirely (backward compatible)', () => {
    const c = cred({})
    expect(c.pg).toBeUndefined()
  })
})
