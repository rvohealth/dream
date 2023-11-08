import Composition from '../../../test-app/app/models/Composition'
import User from '../../../test-app/app/models/User'

describe('Dream#loaded', () => {
  context('when the associated model exists and has been loaded', () => {
    it('is true', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const composition = await Composition.create({ user, primary: true })
      const reloadedUser = await User.preload('mainComposition').find(user.id)
      expect(reloadedUser!.loaded('mainComposition')).toBe(true)
      expect(reloadedUser!.mainComposition).toMatchDreamModel(composition)
    })
  })

  context('when the associated model does not exist, but loading has been attempted', () => {
    it('is true', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const reloadedUser = await User.preload('mainComposition').find(user.id)
      expect(reloadedUser!.loaded('mainComposition')).toBe(true)
    })
  })

  context('when loading has NOT been attempted', () => {
    it('is false', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const reloadedUser = await User.find(user.id)
      expect(reloadedUser!.loaded('mainComposition')).toBe(false)
    })
  })
})
