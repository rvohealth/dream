// after building for esm, importing pg using the following:
//
//  import * as pg from 'pg'
//
// will crash. This is difficult to discover, since it only happens
// when being imported from our esm build.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pg from 'pg'

import type DreamApp from '../dream-app/index.js'

/**
 * Per-live-worker test-database pool, claimed via a Postgres session-level
 * advisory lock.
 *
 * ## Why this exists
 *
 * Under vitest (`pool: 'forks'`, `isolate: true`) `VITEST_POOL_ID` is a
 * *reusable slot id* (1..maxWorkers) that vitest frees and reassigns across
 * worker processes. vitest does not await `runner.stop()` before reusing a
 * slot, so a retired-but-still-terminating worker overlaps the new worker that
 * reused its slot. When the test database is keyed off that reusable slot
 * (`<base>_<VITEST_POOL_ID>`), the two overlapping processes share one
 * database, and the newcomer's `beforeEach(truncate)` wipes the other's
 * in-flight rows -> records vanish mid-test -> intermittent failures.
 *
 * ## The fix
 *
 * Tie database ownership to *process liveness* instead of vitest's slot
 * accounting. Each live worker claims a free database from a pre-created pool
 * by taking a Postgres advisory lock on a dedicated, long-lived connection.
 * The lock auto-releases the instant the worker's connection drops on process
 * exit (Postgres sees EOF on the idle backend within milliseconds for a local
 * kill), so a reused vitest slot can never collide: the new worker probes for
 * and claims a *different* free database, and only ever reuses an index whose
 * previous owner has genuinely exited.
 *
 * The pool is `<base>` (index 1, unsuffixed) plus `<base>_2 .. <base>_K`,
 * pre-created at `db:migrate` / `db:reset` time as `TEMPLATE <base>` clones.
 * Pool size `K = 2 * max(1, parallelTests) + margin` covers N active workers
 * plus up to N still-terminating workers, with margin for transient overlap.
 *
 * ## Lock-key namespace
 *
 * Postgres advisory locks are global to the cluster (not scoped to a
 * database), so a single dedicated connection — to the `postgres` maintenance
 * database — can reserve a pool index for the whole cluster. We use the
 * two-`int4` form `pg_try_advisory_lock(key1, key2)`, which occupies a lock
 * space distinct from the single-`bigint` form `pg_advisory_lock(bigint)` that
 * application code typically uses, so a claim can never clash with an
 * app-level advisory lock. `key1` folds a hash of the base database name into
 * a fixed dream-pool namespace constant so that two different apps sharing one
 * Postgres cluster reserve disjoint index spaces; `key2` is the pool index.
 */

// Fixed dream-pool namespace constant for the advisory-lock `key1`. Chosen to
// sit high in the int4 range and be recognizable in `pg_locks` (classid/objid)
// when debugging. XORed with a per-database-name hash below.
const DREAM_TEST_POOL_LOCK_NAMESPACE = 0x44_52_4d_00 | 0 // "DRM\0"

// Extra databases beyond `2 * max(1, parallelTests)` to absorb transient
// overlap (e.g. several workers terminating at once on a slow machine).
const POOL_MARGIN = 2

// How long to keep re-probing for a free database when every pool index is
// momentarily claimed, before failing loud. A lingering worker's lock frees
// within milliseconds of its process exiting, so this only ever waits out a
// brief handoff window.
const WAIT_FOR_FREE_TIMEOUT_MS = 5_000
const WAIT_FOR_FREE_POLL_INTERVAL_MS = 50

// Aggressive TCP keepalive on the dedicated lock-holding connection. Insurance
// for remote / CI Postgres and abrupt kills where a FIN might be lost: it lets
// Postgres reap the dead backend (and release the lock) even when the OS never
// delivered a clean socket close. For a local kill the lock releases on EOF
// regardless of this.
const LOCK_CONNECTION_KEEPALIVE_INITIAL_DELAY_MS = 1_000

interface PoolState {
  // The claimed pool index (1 = base/unsuffixed, i>1 = `<base>_i`), or null
  // until the first claim completes.
  index: number | null
  // In-flight claim, so concurrent callers (e.g. parallel `truncate` of two
  // connections in a single `beforeEach`) share one claim rather than racing.
  claimPromise: Promise<number> | null
  // The dedicated connection holding the advisory lock for this worker's
  // lifetime. Never returned to a pool and never closed during the run — if it
  // dropped mid-run the lock would free and another worker could claim the same
  // database, reintroducing the collision. The OS closes it (releasing the
  // lock) when the process exits.
  lockClient: any
}

// Module-level singleton: one per Node process === one per vitest worker. A
// fresh worker process starts with a clean slate and claims its own index.
const state: PoolState = {
  index: null,
  claimPromise: null,
  lockClient: null,
}

/**
 * The number of databases in the pre-created pool (including the unsuffixed
 * base at index 1). Shared by the CLI pool-creation / drop loops and the claim
 * probe so they always agree on the index range.
 */
export function testDatabasePoolSize(parallelTests: number | undefined): number {
  const n =
    typeof parallelTests === 'number' && Number.isFinite(parallelTests) && parallelTests > 0
      ? Math.floor(parallelTests)
      : 1
  return 2 * Math.max(1, n) + POOL_MARGIN
}

/**
 * The database name for a pool index given the un-suffixed base name. Index 1
 * is the base itself (no suffix); higher indexes are `<base>_<index>`. This is
 * the single naming rule, used by both the claim path and the CLI loops.
 */
export function testDatabaseNameForIndex(baseName: string, index: number): string {
  return index <= 1 ? baseName : `${baseName}_${index}`
}

/**
 * Sync read of the already-claimed pool index, or null if no claim has
 * completed yet in this process. `DreamApp.dbName()` (synchronous, called when
 * Kysely builds a pool) relies on the claim having been awaited earlier in the
 * worker — `DreamApp.init()` awaits {@link claimTestDatabase} before the first
 * connection is built, and `truncate` awaits it too — so by the time any
 * connection resolves its database name the index is populated.
 */
export function claimedTestDatabaseIndexOrNull(): number | null {
  return state.index
}

function int32Hash(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(i)) | 0
  }
  return hash
}

function advisoryLockKey1(baseName: string): number {
  // Stays within int4 via the `| 0` coercions.
  return (DREAM_TEST_POOL_LOCK_NAMESPACE ^ int32Hash(baseName)) | 0
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    const timer = setTimeout(resolve, ms)
    timer.unref?.()
  })
}

/**
 * Claim a free pool database for this worker (idempotent). On first call it
 * opens the dedicated lock connection, probes `pg_try_advisory_lock` across the
 * pool indexes until one succeeds, and caches the claimed index for the rest of
 * the process. Subsequent calls (and concurrent callers) return the same index.
 *
 * Throws a loud, actionable error if the pool is genuinely exhausted after the
 * wait-for-free window — telling the reader to recreate the pool with
 * `<packageManager> psy db:reset`.
 */
export async function claimTestDatabase(dreamApp: DreamApp): Promise<number> {
  if (state.index !== null) return state.index
  if (state.claimPromise) return state.claimPromise

  state.claimPromise = performClaim(dreamApp)
  try {
    state.index = await state.claimPromise
    return state.index
  } finally {
    state.claimPromise = null
  }
}

async function performClaim(dreamApp: DreamApp): Promise<number> {
  const creds = dreamApp.dbCredentialsFor('default')?.primary ?? dreamApp.dbCredentialsFor('default')?.replica
  if (!creds?.name)
    throw new Error(
      '[dream] cannot claim a test database: the "default" connection has no resolvable primary db name'
    )

  const baseName = creds.name
  const poolSize = testDatabasePoolSize(dreamApp.parallelTests)
  const key1 = advisoryLockKey1(baseName)

  const client = new pg.Client({
    host: creds.host || 'localhost',
    port: creds.port,
    // The maintenance database always exists and we are not locking it —
    // advisory locks are cluster-wide.
    database: 'postgres',
    user: creds.user,
    password: creds.password,
    keepAlive: true,
    keepAliveInitialDelayMillis: LOCK_CONNECTION_KEEPALIVE_INITIAL_DELAY_MS,
  })
  await client.connect()
  state.lockClient = client

  const deadline = nowMs() + WAIT_FOR_FREE_TIMEOUT_MS
  for (;;) {
    for (let index = 1; index <= poolSize; index++) {
      const result = await client.query('SELECT pg_try_advisory_lock($1::int4, $2::int4) AS locked', [
        key1,
        index,
      ])
      if (result.rows[0]?.locked === true) return index
    }

    if (nowMs() >= deadline) break
    await delay(WAIT_FOR_FREE_POLL_INTERVAL_MS)
  }

  // Genuine exhaustion: every pool index is held and none freed within the
  // wait window. Fail loud with concrete remediation rather than hanging or
  // silently sharing a database.
  await client.end().catch(() => undefined)
  state.lockClient = null
  throw new Error(
    `[dream] test-database pool exhausted: all ${poolSize} databases in the "${baseName}" ` +
      `pool are claimed by live workers and none freed within ${WAIT_FOR_FREE_TIMEOUT_MS}ms. ` +
      `This usually means the pool is undersized for the current parallelism, or stale locks are ` +
      `lingering. Recreate the pool with:\n\n    ${dbResetCommand(dreamApp)}\n\n` +
      `If it recurs under heavy parallelism, raise DREAM_PARALLEL_TESTS (which widens the pool).`
  )
}

function dbResetCommand(dreamApp: DreamApp): string {
  switch (dreamApp.packageManager) {
    case 'npm':
      return 'npm run psy db:reset'
    case 'yarn':
      return 'yarn psy db:reset'
    case 'bun':
      return 'bun run psy db:reset'
    case 'deno':
      return 'deno task psy db:reset'
    case 'pnpm':
    default:
      return 'pnpm psy db:reset'
  }
}

function nowMs(): number {
  // Date.now() rather than performance.now(); we only need coarse wall-clock
  // for the wait-for-free deadline.
  return Date.now()
}

/**
 * Test-only escape hatch for dream's own spec suite: release the claim and
 * close the lock connection so a test can exercise the claim machinery in
 * isolation. Not part of the public API.
 *
 * @internal
 */
export async function __resetTestDatabaseClaimForSpec(): Promise<void> {
  const client = state.lockClient
  state.index = null
  state.claimPromise = null
  state.lockClient = null
  if (client) await client.end().catch(() => undefined)
}
