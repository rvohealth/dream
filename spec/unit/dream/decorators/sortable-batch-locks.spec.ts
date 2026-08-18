import { sql } from 'kysely'
import acquireStabilizedSortableBatchLocks, {
  MAX_SORTABLE_BATCH_SCOPE_LOCKS,
} from '../../../../src/decorators/field/sortable/helpers/acquireStabilizedSortableBatchLocks.js'
import { takeCachedSortableRow } from '../../../../src/decorators/field/sortable/helpers/sortableRowCache.js'
import DreamTransaction from '../../../../src/dream/DreamTransaction.js'
import SortableBatchRequiresTooManyScopeLocks from '../../../../src/errors/SortableBatchRequiresTooManyScopeLocks.js'
import testDb from '../../../helpers/testDb.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import TextScopedSortableModel from '../../../../test-app/app/models/TextScopedSortableModel.js'

// one row per sort scope, inserted in one statement: going through the model
// would take a lock and compute a position for every one of them
async function insertOnePerScope(count: number) {
  await sql`
    insert into text_scoped_sortable_models (scope_a, scope_b, position, created_at, updated_at)
    select 'scope-' || i, 'b', 1, now(), now()
    from generate_series(1, ${count}::int) as i
  `.execute(testDb('default', 'primary'))

  return await TextScopedSortableModel.query().order('id').pluck('id')
}

function preflight(txn: DreamTransaction<any>, primaryKeyValues: unknown[]) {
  return acquireStabilizedSortableBatchLocks(
    TextScopedSortableModel.txn(txn).queryInstance().dreamInstance,
    txn,
    primaryKeyValues
  )
}

describe('the locked-batch sortable scope-lock preflight', () => {
  context('the bound on how many scope locks it will take', () => {
    it('counts the keys the transaction already holds, so the batches of a caller-owned transaction cannot walk past it one batch at a time', async () => {
      const ids = await insertOnePerScope(MAX_SORTABLE_BATCH_SCOPE_LOCKS + 1)

      await ApplicationModel.transaction(async txn => {
        // 600 keys: comfortably inside the bound on its own
        await preflight(txn, ids.slice(0, 600))

        // 401 more, and the 600 taken above are still held — advisory locks
        // live until the transaction ends
        await expect(preflight(txn, ids.slice(600))).rejects.toThrow(SortableBatchRequiresTooManyScopeLocks)
      })
    }, 30000)

    it('reports the number of keys the transaction would have been left holding', async () => {
      const ids = await insertOnePerScope(MAX_SORTABLE_BATCH_SCOPE_LOCKS + 1)

      await ApplicationModel.transaction(async txn => {
        await preflight(txn, ids.slice(0, 600))

        await expect(preflight(txn, ids.slice(600))).rejects.toThrow(
          new RegExp(`holding ${MAX_SORTABLE_BATCH_SCOPE_LOCKS + 1} sort scope locks`)
        )
      })
    }, 30000)
  })

  context('the rows it stashes for the per-record work that follows', () => {
    it('stashes the rows read under the locks once it has converged', async () => {
      const record = await TextScopedSortableModel.create({ scopeA: 'a', scopeB: 'b' })

      await ApplicationModel.transaction(async txn => {
        await preflight(txn, [record.id])

        expect(takeCachedSortableRow(txn, 'text_scoped_sortable_models', record.id)).toMatchObject({
          position: 1,
        })
      })
    })

    it('stashes nothing when it refuses the batch, so a caller that catches the refusal finds no unprotected row', async () => {
      const ids = await insertOnePerScope(MAX_SORTABLE_BATCH_SCOPE_LOCKS + 1)

      await ApplicationModel.transaction(async txn => {
        await expect(preflight(txn, ids)).rejects.toThrow(SortableBatchRequiresTooManyScopeLocks)

        expect(takeCachedSortableRow(txn, 'text_scoped_sortable_models', ids[0])).toBeUndefined()
      })
    }, 30000)
  })
})
