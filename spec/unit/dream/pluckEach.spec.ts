import { Dream } from '../../../src'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import User from '../../../test-app/app/models/User'

describe('Dream#pluckEach', () => {
  let user1: User
  let user2: User
  beforeEach(async () => {
    user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
  })

  it('plucks the specified attributes and returns them as raw data', async () => {
    const ids: any[] = []
    await User.pluckEach('id', id => {
      ids.push(id)
    })
    expect(ids).toEqual([user1.id, user2.id])
  })

  context('with chunk size specified', () => {
    it('plucks the specified attributes and returns them as raw data', async () => {
      const ids: any[] = []
      await User.pluckEach(
        'id',
        id => {
          ids.push(id)
        },
        { batchSize: 1 }
      )
      expect(ids).toEqual([user1.id, user2.id])
    })
  })

  context('when encased in a transaction', () => {
    it('plucks the specified attributes and returns them as raw data', async () => {
      let user3: User | null = null
      let ids: any[] = []
      await ApplicationModel.transaction(async txn => {
        user3 = await User.txn(txn).create({ email: 'fred@txn', password: 'howyadoin' })
        await User.txn(txn).pluckEach('id', id => {
          ids.push(id)
        })
      })
      expect(ids).toEqual([user1.id, user2.id, user3!.id])
    })
  })

  context('with multiple fields', () => {
    it('should return multi-dimensional array', async () => {
      const data: any[] = []
      await User.order('id').pluckEach('id', 'createdAt', arr => {
        data.push(arr)
      })

      expect(data).toEqual([
        [user1.id, user1.createdAt],
        [user2.id, user2.createdAt],
      ])
    })
  })
})
