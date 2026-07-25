import RowLockIncompatibleWithDistinct from '../../../../src/errors/RowLockIncompatibleWithDistinct.js'
import RowLockIncompatibleWithJoinLoad from '../../../../src/errors/RowLockIncompatibleWithJoinLoad.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import User from '../../../../test-app/app/models/User.js'

// The row-locking seam exists so that a caller who asks for a locked read
// either gets one or gets an error — never an unlocked read that quietly drops
// the compare-and-set guarantee. `Query#destroy({ lock: true })` guards the
// combinations it knows about, but the guarantee has to hold for every caller
// of `takeAll({ lock: true })`, so it is enforced at the seam itself.
describe('KyselyQueryDriver#takeAll with lock: true', () => {
  context('on a join-loaded query', () => {
    it('refuses rather than silently returning unlocked rows', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      await Pet.create({ user, name: 'aster' })

      const driver = User.query().leftJoinPreload('pets').dbDriverInstance()

      await expect(driver.takeAll({ lock: true })).rejects.toThrow(RowLockIncompatibleWithJoinLoad)
    })

    it('still performs the unlocked read when no lock is requested', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      await Pet.create({ user, name: 'aster' })

      const driver = User.query().leftJoinPreload('pets').dbDriverInstance()

      expect(await driver.takeAll()).toMatchDreamModels([user])
    })
  })

  context('on a distinct query', () => {
    it('refuses rather than emitting FOR UPDATE alongside DISTINCT ON', async () => {
      await Pet.create({ name: 'aster' })

      const driver = Pet.query().distinct().dbDriverInstance()

      await expect(driver.takeAll({ lock: true })).rejects.toThrow(RowLockIncompatibleWithDistinct)
    })

    it('still performs the unlocked read when no lock is requested', async () => {
      const aster = await Pet.create({ name: 'aster' })

      const driver = Pet.query().distinct().dbDriverInstance()

      expect(await driver.takeAll()).toMatchDreamModels([aster])
    })
  })
})
