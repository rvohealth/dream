import { resolvePostgresSsl } from '../../../../src/dream/QueryDriver/Kysely.js'
import { SingleDbCredential } from '../../../../src/dream-app/index.js'

// `pg.Pool` accepts a full `tls.ConnectionOptions` on its `ssl` field.
// Dream's resolver picks what value to pass through. The legacy
// `useSsl: true` fallback yields `{ rejectUnauthorized: false }` (encrypted
// but unauthenticated) for back-compat; new code should set `ssl` directly
// to opt into verified TLS. (R-027)

function cred(overrides: Partial<SingleDbCredential>): SingleDbCredential {
  return {
    user: 'u',
    password: 'p',
    host: 'h',
    name: 'n',
    port: 5432,
    useSsl: false,
    ...overrides,
  }
}

describe('resolvePostgresSsl', () => {
  describe('without an explicit ssl field', () => {
    it('returns false when useSsl is false', () => {
      // cred's default is useSsl: false
      expect(resolvePostgresSsl(cred({}))).toBe(false)
    })

    it('falls back to { rejectUnauthorized: false } when useSsl is true', () => {
      expect(resolvePostgresSsl(cred({ useSsl: true }))).toEqual({ rejectUnauthorized: false })
    })
  })

  describe('with an explicit ssl field', () => {
    it('passes ssl: true straight through (Node default verification)', () => {
      expect(resolvePostgresSsl(cred({ ssl: true }))).toBe(true)
    })

    it('passes ssl: false straight through', () => {
      expect(resolvePostgresSsl(cred({ ssl: false }))).toBe(false)
    })

    it('passes a full tls.ConnectionOptions object straight through', () => {
      const ssl = { rejectUnauthorized: true, ca: 'CA-PEM-BUNDLE-CONTENTS' }
      expect(resolvePostgresSsl(cred({ ssl }))).toBe(ssl)
    })

    it('takes precedence over useSsl: true', () => {
      // useSsl: true would have returned { rejectUnauthorized: false }; the
      // explicit ssl field overrides that.
      expect(resolvePostgresSsl(cred({ useSsl: true, ssl: false }))).toBe(false)

      const ssl = { rejectUnauthorized: true }
      expect(resolvePostgresSsl(cred({ useSsl: true, ssl }))).toBe(ssl)
    })
  })
})
