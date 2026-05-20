// after building for esm, importing pg using the following:
//
//  import * as pg from 'pg'
//
// will crash. This is difficult to discover, since it only happens
// when being imported from our esm build.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pg from 'pg'

import { debuglog } from 'node:util'
import DreamApp from '../dream-app/index.js'

/**
 * Opt-in connection-leak diagnostics.
 *
 * `closeAllConnectionsForConnectionName` bounds the shutdown drain, but when it
 * times out it can only say *that* a pooled client was held past shutdown, not
 * *where* it was acquired. Finding the offending query then means hand-patching
 * `pg` — exactly the multi-hour spelunk this is meant to delete.
 *
 * Enable with `NODE_DEBUG=dream` (the same `node:util` debug-channel
 * convention Psychic uses for `NODE_DEBUG=psychic`). Dev/CI only — it patches
 * `pg.Pool.prototype.connect` process-wide and retains references to
 * checked-out clients, so it is never installed unless explicitly asked for.
 * When the close timeout fires, the acquire stack of every still-checked-out
 * client is logged.
 *
 * Like the rest of the ecosystem's `debuglog` usage, the channel is resolved
 * once by Node on first call and cached for the process lifetime — this is a
 * process-level switch, not a runtime toggle.
 */

// Resolved once at module load (Node caches the channel), mirroring
// `const debugEnabled = debuglog('psychic').enabled` in Psychic.
const dreamDebugEnabled = debuglog('dream').enabled

interface CheckedOutClient {
  stack: string
  since: number
}

// Map (not WeakMap) so entries can be enumerated at report time. Entries are
// deleted on release, so only genuinely-leaked clients accumulate, and only
// when diagnostics are explicitly enabled.
const checkedOutClients = new Map<object, CheckedOutClient>()

const INSTALLED = Symbol.for('dream:dbLeakDiagnosticsInstalled')
let enabled = false

function track(client: object | undefined, stack: string | undefined): void {
  if (!client) return
  checkedOutClients.set(client, { stack: stack ?? '(no stack captured)', since: Date.now() })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = client as any
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (c.__dreamReleasePatched) return
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const originalRelease = c.release
  if (typeof originalRelease !== 'function') return
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  c.__dreamReleasePatched = true
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  c.release = function patchedRelease(...args: unknown[]) {
    checkedOutClients.delete(client)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return originalRelease.apply(this, args)
  }
}

/**
 * Idempotent. Patches `pg.Pool.prototype.connect` to stamp the caller's stack
 * onto each leased client. No-op unless `DREAM_DB_LEAK_DIAGNOSTICS` is set.
 */
export function installDbConnectionLeakDiagnosticsIfEnabled(): void {
  if (!dreamDebugEnabled) return
  enabled = true

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  const Pool = (pg as any).Pool
  if (!Pool?.prototype) return
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (Pool.prototype[INSTALLED]) return
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  Pool.prototype[INSTALLED] = true

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
  const originalConnect = Pool.prototype.connect
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  Pool.prototype.connect = function patchedConnect(cb?: unknown) {
    const acquireStack = new Error('db connection acquired here').stack

    if (typeof cb === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
      return originalConnect.call(this, (err: unknown, client: object | undefined, release: unknown) => {
        track(client, acquireStack)
        // `track()` replaces `client.release` with an untracking wrapper.
        // Callback-style users call the 3rd `release` arg, which pg captured
        // *before* that swap — so hand them the wrapped one instead, or a
        // correctly-released client would be reported as a false leak.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        const wrappedRelease = client ? (client as any).release : release
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        ;(cb as (e: unknown, c: unknown, r: unknown) => void)(err, client, wrappedRelease)
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return originalConnect.call(this).then((client: object) => {
      track(client, acquireStack)
      return client
    })
  }
}

/**
 * If diagnostics are enabled, log the acquire stack of every client still
 * checked out. Called from the shutdown-drain timeout path.
 */
export function reportLeakedDbConnections(label: string): void {
  if (!enabled || checkedOutClients.size === 0) return

  const now = Date.now()
  const report = Array.from(checkedOutClients.values())
    .map((entry, i) => `  [#${i}] held ${now - entry.since}ms\n${entry.stack}`)
    .join('\n\n')

  DreamApp.logWithLevel(
    'warn',
    `[dream] connection-leak diagnostics: ${checkedOutClients.size} pg client(s) still checked out ` +
      `when "${label}" hit the close timeout. Acquired at:\n\n${report}`
  )
}
