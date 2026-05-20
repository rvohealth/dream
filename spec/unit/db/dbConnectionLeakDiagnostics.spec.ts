// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pg from 'pg'

import DreamApp from '../../../src/dream-app/index.js'
import {
  installDbConnectionLeakDiagnosticsIfEnabled,
  reportLeakedDbConnections,
} from '../../../src/db/dbConnectionLeakDiagnostics.js'

// The diagnostic is gated on `debuglog('dream').enabled`, which Node resolves
// once from NODE_DEBUG at first call and caches for the process lifetime (the
// same convention/limitation as Psychic's `debuglog('psychic')`). It therefore
// cannot be toggled at runtime, so these specs assert the *safety* contract for
// the default (disabled) path — the production-relevant case: it must never
// patch pg or log unless NODE_DEBUG=dream was set for the process. The enabled
// path (logs the acquire stack of a leaked client) is validated against the
// real shutdown-hang reproduction; mocking pg.Pool's async connect here would
// only test the mock.
describe('db connection leak diagnostics (disabled by default)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const Pool = (pg as any).Pool
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const pristineConnect = Pool.prototype.connect

  it('does not patch pg.Pool.prototype.connect (no NODE_DEBUG=dream in the test process)', () => {
    installDbConnectionLeakDiagnosticsIfEnabled()
    installDbConnectionLeakDiagnosticsIfEnabled() // idempotent / safe to repeat
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(Pool.prototype.connect).toBe(pristineConnect)
  })

  it('reportLeakedDbConnections is a silent no-op when disabled', () => {
    const spy = vi.spyOn(DreamApp, 'logWithLevel').mockImplementation(() => undefined)
    reportLeakedDbConnections('primary:default')
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
