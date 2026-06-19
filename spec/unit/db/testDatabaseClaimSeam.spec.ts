import DreamApp from '../../../src/dream-app/index.js'
import type { TestDatabaseLockSession } from '../../../src/dream/QueryDriver/Base.js'

/**
 * Executable proof that the per-worker test-database claim seam
 * (`QueryDriverBase.openTestDatabaseLockSession` /
 * `TestDatabaseLockSession`) holds its contract for *both* supporting drivers.
 *
 * The suite's own claim routes through the Postgres default, so without this
 * spec the MySQL implementation would be dead code. Each case opens two
 * independent lock sessions and asserts the two properties the orchestrator
 * (`src/db/testDatabasePool.ts`) relies on: a held `(namespace, index)` is
 * mutually exclusive across sessions, and it becomes re-acquirable once the
 * holder releases.
 *
 * A distinct namespace is used so these probes never touch the index this
 * worker has already claimed for its live test database.
 */
describe('test-database claim seam (driver lock sessions)', () => {
  const drivers = [
    { label: 'postgres', connectionName: 'default' },
    { label: 'mysql', connectionName: 'mysql' },
  ] as const

  for (const { label, connectionName } of drivers) {
    context(label, () => {
      it('reports support for parallel test databases', () => {
        const driver = DreamApp.getOrFail().dbConnectionQueryDriverClass(connectionName)
        expect(driver.supportsParallelTestDatabases).toBe(true)
      })

      it('is mutually exclusive while held and re-acquirable after release', async () => {
        const driver = DreamApp.getOrFail().dbConnectionQueryDriverClass(connectionName)
        const namespace = `dream-seam-spec-${label}`
        const index = 1

        const first = await driver.openTestDatabaseLockSession(connectionName)
        let second: TestDatabaseLockSession | null = null

        try {
          // first claims the lock
          expect(await first.tryAcquire(namespace, index)).toBe(true)

          // a second session cannot take the same (namespace, index)
          second = await driver.openTestDatabaseLockSession(connectionName)
          expect(await second.tryAcquire(namespace, index)).toBe(false)

          // once first releases, second can claim it
          await first.release()
          expect(await second.tryAcquire(namespace, index)).toBe(true)
        } finally {
          await second?.release().catch(() => undefined)
          await first.release().catch(() => undefined)
        }
      })
    })
  }
})
