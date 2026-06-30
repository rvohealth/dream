import type DreamApp from '../dream-app/index.js'
import type { TestDatabaseLockSession } from '../dream/QueryDriver/Base.js'

/**
 * Per-live-worker test-database pool. Each worker claims a free database from a
 * pre-created pool by holding a process-lifetime, auto-releasing lock; the
 * adapter-specific lock primitive lives behind the query-driver seam
 * ({@link TestDatabaseLockSession}), so this module stays driver-agnostic.
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
 * by taking a lock on a dedicated, long-lived connection (the
 * {@link TestDatabaseLockSession}, supplied by the default connection's query
 * driver). The lock auto-releases the instant the worker's connection drops on
 * process exit, so a reused vitest slot can never collide: the new worker
 * probes for and claims a *different* free database, and only ever reuses an
 * index whose previous owner has genuinely exited.
 *
 * The pool is `<base>` (index 1, unsuffixed) plus `<base>_2 .. <base>_K`,
 * pre-created at `db:migrate` / `db:reset` time as `TEMPLATE <base>` clones.
 * Pool size `K = 2 * max(1, parallelTests) + margin` covers N active workers
 * plus up to N still-terminating workers, with margin for transient overlap.
 *
 * The lock primitive itself — and its key derivation — is the driver's
 * concern: Postgres maps `(namespace, index)` to a two-`int4` advisory lock,
 * MySQL to a `GET_LOCK` name. This orchestrator only ever speaks the neutral
 * `(namespace, index)` contract.
 */

// Extra databases beyond `2 * max(1, parallelTests)` to absorb transient
// overlap (e.g. several workers terminating at once on a slow machine).
const POOL_MARGIN = 2

// How long to keep re-probing for a free database when every pool index is
// momentarily claimed, before failing loud. A lingering worker's lock frees
// within milliseconds of its process exiting, so this only ever waits out a
// brief handoff window.
const WAIT_FOR_FREE_TIMEOUT_MS = 5_000
const WAIT_FOR_FREE_POLL_INTERVAL_MS = 50

interface PoolState {
  // The claimed pool index (1 = base/unsuffixed, i>1 = `<base>_i`), or null
  // until the first claim completes.
  index: number | null
  // In-flight claim, so concurrent callers (e.g. parallel `truncate` of two
  // connections in a single `beforeEach`) share one claim rather than racing.
  claimPromise: Promise<number> | null
  // The dedicated lock session holding the claim for this worker's lifetime.
  // Never released during the run — if it dropped mid-run the lock would free
  // and another worker could claim the same database, reintroducing the
  // collision. The OS closes its connection (releasing the lock) on process
  // exit.
  lockSession: TestDatabaseLockSession | null
}

// Module-level singleton: one per Node process === one per vitest worker. A
// fresh worker process starts with a clean slate and claims its own index.
const state: PoolState = {
  index: null,
  claimPromise: null,
  lockSession: null,
}

/**
 * The number of databases in the pre-created pool (including the unsuffixed
 * base at index 1). Shared by the CLI pool-creation / drop loops and the claim
 * probe so they always agree on the index range.
 */
export function testDatabasePoolSize(parallelTests: number | undefined): number {
  const n = normalizeTestDatabaseParallelism(parallelTests)
  return 2 * Math.max(1, n) + POOL_MARGIN
}

/**
 * Normalize configured test parallelism to the minimum safe pool width input.
 * Even a serial vitest run can overlap old/new worker processes, so missing,
 * invalid, zero, or fractional-below-one values all mean "one active worker",
 * not "disable the per-live-worker database pool".
 */
export function normalizeTestDatabaseParallelism(parallelTests: number | undefined): number {
  return typeof parallelTests === 'number' && Number.isFinite(parallelTests) && parallelTests > 0
    ? Math.max(1, Math.floor(parallelTests))
    : 1
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

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    const timer = setTimeout(resolve, ms)
    timer.unref?.()
  })
}

/**
 * Claim a free pool database for this worker (idempotent). On first call it
 * opens the default driver's dedicated lock session, probes
 * {@link TestDatabaseLockSession.tryAcquire} across the pool indexes until one
 * succeeds, and caches the claimed index for the rest of the process.
 * Subsequent calls (and concurrent callers) return the same index.
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

  // The base db name doubles as the lock namespace: the driver hashes it into
  // its own lock key so two apps sharing one server reserve disjoint indexes.
  const baseName = creds.name
  const poolSize = testDatabasePoolSize(dreamApp.parallelTests)
  const driver = dreamApp.dbConnectionQueryDriverClass('default')

  const session = await driver.openTestDatabaseLockSession('default')
  state.lockSession = session

  const deadline = nowMs() + WAIT_FOR_FREE_TIMEOUT_MS
  for (;;) {
    for (let index = 1; index <= poolSize; index++) {
      if (await session.tryAcquire(baseName, index)) return index
    }

    if (nowMs() >= deadline) break
    await delay(WAIT_FOR_FREE_POLL_INTERVAL_MS)
  }

  // Genuine exhaustion: every pool index is held and none freed within the
  // wait window. Fail loud with concrete remediation rather than hanging or
  // silently sharing a database.
  await session.release().catch(() => undefined)
  state.lockSession = null
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
 * close the lock session so a test can exercise the claim machinery in
 * isolation. Not part of the public API.
 *
 * @internal
 */
export async function __resetTestDatabaseClaimForSpec(): Promise<void> {
  const session = state.lockSession
  state.index = null
  state.claimPromise = null
  state.lockSession = null
  if (session) await session.release().catch(() => undefined)
}
