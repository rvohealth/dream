import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.order', () => {
  it('correctly orders results', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const records = await User.order('id').all()
    expect(records).toMatchDreamModels([user1, user2])
  })

  context('when passed null', () => {
    it('un-orders results', async () => {
      const user1 = await User.create({ email: 'b@bbbbbb', password: 'howyadoin' })
      const user2 = await User.create({ email: 'a@aaaaaa', password: 'howyadoin' })

      const records = await User.order(null).order('email').order(null).all()
      expect(records).toMatchDreamModels([user1, user2])
    })
  })

  context('when encased in a transaction', () => {
    it('correctly orders results', async () => {
      let user1: User | null = null
      let user2: User | null = null
      let records: User[] = []
      await ApplicationModel.transaction(async txn => {
        user1 = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        user2 = await User.txn(txn).create({ email: 'how@yadoin', password: 'howyadoin' })
        records = await User.txn(txn).order('id').all()
      })
      expect(records).toMatchDreamModels([user1, user2])
    })
  })

  context('when passed a direction', () => {
    it('correctly orders in the direction passed', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

      const records = await User.order({ id: 'desc' }).all()
      expect(records[0].id).toEqual(user2.id)
      expect(records[1].id).toEqual(user1.id)
    })
  })

  context('when passed multiple columns', () => {
    it('applies order for both columns, with the earliest object keys taking precedent over later keys', async () => {
      const user1 = await User.create({ email: 'fred3@frewd', name: 'b', password: 'howyadoin' })
      const user2 = await User.create({ email: 'fred1@frewd', name: 'a', password: 'howyadoin' })
      const user3 = await User.create({ email: 'fred2@frewd', name: 'a', password: 'howyadoin' })

      const records = await User.order({ name: 'asc', email: 'desc' }).all()
      expect(records[0].id).toEqual(user3.id)
      expect(records[1].id).toEqual(user2.id)
      expect(records[2].id).toEqual(user1.id)
    })
  })
})
