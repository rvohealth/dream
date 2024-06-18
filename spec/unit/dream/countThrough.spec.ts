import User from '../../../test-app/app/models/User'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import Pet from '../../../test-app/app/models/Pet'

describe('Dream.count', () => {
  it('counts all records for a given association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await user.createAssociation('pets')

    await Pet.create()

    const results = await user.countThrough('pets')
    expect(results).toEqual(1)
  })

  context('when passed a where clause', () => {
    it('respects the where clause', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await user.createAssociation('pets', { name: 'Aster' })
      await user.createAssociation('pets', { name: 'Olive' })

      await Pet.create()

      const results = await user.countThrough('pets', { name: 'Aster' })
      expect(results).toEqual(1)
    })
  })

  context('when passed a transaction', () => {
    it('can report accurate count', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await user.createAssociation('pets', { name: 'Aster' })
      await user.createAssociation('pets', { name: 'Olive' })

      let allCount: number = 0
      let asterCount: number = 0

      await ApplicationModel.transaction(async txn => {
        await user.txn(txn).createAssociation('pets', { name: 'Aster' })
        allCount = await user.txn(txn).countThrough('pets')
        asterCount = await user.txn(txn).countThrough('pets', { name: 'Aster' })
      })

      expect(allCount).toEqual(3)
      expect(asterCount).toEqual(2)
    })
  })
})
