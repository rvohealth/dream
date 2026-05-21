import { resolvePostgresSsl } from '../../../../src/dream/QueryDriver/Kysely.js'
import { DreamDbConfig } from '../../../../src/dream-app/index.js'

// `pg.Pool` accepts a full `tls.ConnectionOptions` on its `ssl` field.
// Dream's resolver picks what value to pass through. The legacy
// `useSsl: true` fallback yields `{ rejectUnauthorized: false }` (encrypted
// but unauthenticated) for back-compat; new code should set `ssl` directly
// to opt into verified TLS. (R-027)

// Helper builds a credential with both TLS directives unset so each test
// can set just the field under test. `resolvePostgresSsl` is exercised
// directly here (not through `app.set('db', ...)`), so the setter's
// "must specify ssl or useSsl" throw doesn't apply.
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

describe('resolvePostgresSsl', () => {
  describe('without an explicit ssl field', () => {
    it('falls back to { rejectUnauthorized: false } when useSsl is true', () => {
      expect(resolvePostgresSsl(cred({ useSsl: true }))).toEqual({ rejectUnauthorized: false })
    })
  })

  describe('with an explicit ssl field', () => {
    it('passes a full tls.ConnectionOptions object straight through', () => {
      const ssl = { rejectUnauthorized: true, ca: 'CA-PEM-BUNDLE-CONTENTS' }
      expect(resolvePostgresSsl(cred({ ssl }))).toBe(ssl)
    })

    it('passes { rejectUnauthorized: true } for verified TLS via system CA', () => {
      expect(resolvePostgresSsl(cred({ ssl: { rejectUnauthorized: true } }))).toEqual({
        rejectUnauthorized: true,
      })
    })

    it('returns false when ssl is explicitly false', () => {
      expect(resolvePostgresSsl(cred({ ssl: false }))).toBe(false)
    })

    it('takes precedence over useSsl: true', () => {
      const ssl = { rejectUnauthorized: true }
      expect(resolvePostgresSsl(cred({ useSsl: true, ssl }))).toBe(ssl)
    })
  })
})
