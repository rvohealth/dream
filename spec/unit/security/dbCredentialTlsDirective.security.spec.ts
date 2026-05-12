import DreamApp, { SingleDbCredential } from '../../../src/dream-app/index.js'
import MissingDbSslDirective from '../../../src/errors/dream-app/MissingDbSslDirective.js'

// `app.set('db', ...)` validates that each SingleDbCredential expresses an
// explicit TLS directive — either `ssl` (object or false) or the deprecated
// `useSsl: true`. Omitting both used to silently disable TLS; the setter now
// throws so the safety question is a deliberate decision at the call site.

function credential(overrides: Partial<SingleDbCredential>): SingleDbCredential {
  return {
    user: 'u',
    password: 'p',
    host: 'h',
    name: 'n',
    port: 5432,
    ...overrides,
  }
}

describe('app.set("db", ...) TLS directive validation', () => {
  it('throws when neither ssl nor useSsl is set on the primary credential', () => {
    const dreamApp = DreamApp.getOrFail()
    expect(() => {
      dreamApp.set('db', { primary: credential({}) })
    }).toThrow(MissingDbSslDirective)
  })

  it('throws when neither ssl nor useSsl is set on the replica credential', () => {
    const dreamApp = DreamApp.getOrFail()
    expect(() => {
      dreamApp.set('db', {
        primary: credential({ ssl: false }),
        replica: credential({}),
      })
    }).toThrow(MissingDbSslDirective)
  })

  it('accepts ssl: false as an explicit TLS-off directive', () => {
    const dreamApp = DreamApp.getOrFail()
    expect(() => {
      dreamApp.set('db', { primary: credential({ ssl: false }) })
    }).not.toThrow()
  })

  it('accepts ssl as a TlsConnectionOptions object', () => {
    const dreamApp = DreamApp.getOrFail()
    expect(() => {
      dreamApp.set('db', { primary: credential({ ssl: { rejectUnauthorized: true } }) })
    }).not.toThrow()
  })

  it('accepts the deprecated useSsl: true', () => {
    const dreamApp = DreamApp.getOrFail()
    expect(() => {
      dreamApp.set('db', { primary: credential({ useSsl: true }) })
    }).not.toThrow()
  })

  it('throws when useSsl is explicitly false and ssl is unset', () => {
    const dreamApp = DreamApp.getOrFail()
    expect(() => {
      dreamApp.set('db', { primary: credential({ useSsl: false }) })
    }).toThrow(MissingDbSslDirective)
  })
})
