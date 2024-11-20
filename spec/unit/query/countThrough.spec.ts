import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import Pet from '../../../test-app/app/models/Pet'
import User from '../../../test-app/app/models/User'

describe('Dream.count', () => {
  it('counts all records for a given association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await user.createAssociation('pets')

    await Pet.create()

    const results = await User.query().countThrough('pets')
    expect(results).toEqual(1)
  })

  context('when passed a where clause', () => {
    it('respects the where clause', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await user.createAssociation('pets', { name: 'Aster' })
      await user.createAssociation('pets', { name: 'Olive' })

      await Pet.create()

      const results = await User.query().countThrough('pets', { name: 'Aster' })
      expect(results).toEqual(1)
    })
  })

  context('when passed a transaction', () => {
    it('can report accurate count', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await user.createAssociation('pets', { name: 'Aster' })
      await user.createAssociation('pets', { name: 'Olive' })

      let count: number = 0

      await ApplicationModel.transaction(async txn => {
        await user.txn(txn).createAssociation('pets', { name: 'Aster' })
        count = await User.query().txn(txn).countThrough('pets', { name: 'Aster' })
      })

      expect(count).toEqual(2)
    })
  })
})
