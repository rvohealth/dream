import { sql } from 'kysely'
import acquireStabilizedSortableBatchLocks from '../../../../src/decorators/field/sortable/helpers/acquireStabilizedSortableBatchLocks.js'
import { takeCachedSortableRow } from '../../../../src/decorators/field/sortable/helpers/sortableRowCache.js'
import DreamTransaction from '../../../../src/dream/DreamTransaction.js'
import DreamApp from '../../../../src/dream-app/index.js'
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
  let priorLimit: number

  beforeEach(() => {
    priorLimit = DreamApp.getOrFail().sortableMaxScopeLocksPerTransaction
    DreamApp.getOrFail().set('sortableMaxScopeLocksPerTransaction', 3)
  })

  afterEach(() => {
    DreamApp.getOrFail().set('sortableMaxScopeLocksPerTransaction', priorLimit)
  })

  context('the bound on how many scope locks it will take', () => {
    it('counts the keys the transaction already holds, so the batches of a caller-owned transaction cannot walk past it one batch at a time', async () => {
      const ids = await insertOnePerScope(4)

      await ApplicationModel.transaction(async txn => {
        await preflight(txn, ids.slice(0, 2))

        await expect(preflight(txn, ids.slice(2))).rejects.toThrow(
          'would make this transaction hold 4 distinct Sortable scope locks'
        )
      })
    })

    it('reports the number of keys the transaction would have been left holding', async () => {
      const ids = await insertOnePerScope(4)

      await ApplicationModel.transaction(async txn => {
        await preflight(txn, ids.slice(0, 2))

        await expect(preflight(txn, ids.slice(2))).rejects.toThrow('configured limit is 3')
      })
    })
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
      const ids = await insertOnePerScope(4)

      await ApplicationModel.transaction(async txn => {
        await expect(preflight(txn, ids)).rejects.toThrow(
          'would make this transaction hold 4 distinct Sortable scope locks'
        )

        expect(takeCachedSortableRow(txn, 'text_scoped_sortable_models', ids[0])).toBeUndefined()
      })
    })
  })
})
