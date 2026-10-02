import { Transaction } from 'kysely'
import withConcurrentWriterRetry, {
  MAX_CONCURRENT_WRITER_ATTEMPTS,
} from '../../../../src/dream/internal/withConcurrentWriterRetry.js'
import PostgresQueryDriver from '../../../../src/dream/QueryDriver/Postgres.js'
import SortableCascadeChild from '../../../../test-app/app/models/SortableCascadeChild.js'
import SortableCascadeOwner from '../../../../test-app/app/models/SortableCascadeOwner.js'
import User from '../../../../test-app/app/models/User.js'

describe('withConcurrentWriterRetry', () => {
  let ownerId: SortableCascadeOwner['id']

  beforeEach(async () => {
    ownerId = (await SortableCascadeOwner.create()).id
  })

  // one row per position given; the deferrable unique constraint on
  // (owner_id, position) accepts or refuses them only at COMMIT
  async function insertChildren(kyselyTransaction: Transaction<any>, positions: number[]) {
    for (const position of positions) {
      await kyselyTransaction
        .insertInto('sortable_cascade_children')
        .values({ owner_id: ownerId, label: 'a', position, created_at: new Date(), updated_at: new Date() })
        .execute()
    }
  }

  it('runs the callback again when the transaction’s COMMIT is refused by a unique constraint', async () => {
    let attempts = 0

    const result = await withConcurrentWriterRetry(SortableCascadeChild, async txn => {
      attempts++
      await insertChildren(txn.kyselyTransaction, attempts === 1 ? [1, 1] : [1])
      return 'done'
    })

    expect(result).toEqual('done')
    expect(attempts).toEqual(2)
    expect(await SortableCascadeChild.count()).toEqual(1)
  })

  it('runs the callback again when the transaction was aborted by a deadlock', async () => {
    const deadlock = new Error('deadlock detected')
    vi.spyOn(PostgresQueryDriver, 'isDeadlock').mockImplementation(error => error === deadlock)
    let attempts = 0

    const result = await withConcurrentWriterRetry(SortableCascadeChild, () => {
      attempts++
      return attempts === 1 ? Promise.reject(deadlock) : Promise.resolve('done')
    })

    expect(result).toEqual('done')
    expect(attempts).toEqual(2)
  })

  it('does not run the callback again when the callback throws anything else', async () => {
    let attempts = 0

    await expect(
      withConcurrentWriterRetry(SortableCascadeChild, () => {
        attempts++
        return Promise.reject(new Error('raised by the callback'))
      })
    ).rejects.toThrow('raised by the callback')

    expect(attempts).toEqual(1)
  })

  it('does not run the callback again when a statement inside it raises a unique violation', async () => {
    let attempts = 0

    await expect(
      withConcurrentWriterRetry(SortableCascadeChild, async txn => {
        attempts++
        await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
      })
    ).rejects.toThrow(/duplicate key value/)

    expect(attempts).toEqual(1)
    expect(await User.count()).toEqual(0)
  })

  it('lets the refusal escape once every attempt has failed', async () => {
    let attempts = 0

    await expect(
      withConcurrentWriterRetry(SortableCascadeChild, async txn => {
        attempts++
        await insertChildren(txn.kyselyTransaction, [1, 1])
      })
    ).rejects.toThrow(/duplicate key value/)

    expect(attempts).toEqual(MAX_CONCURRENT_WRITER_ATTEMPTS)
    expect(await SortableCascadeChild.count()).toEqual(0)
  })
})
