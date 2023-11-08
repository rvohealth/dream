import NonLoadedAssociation from '../../../../src/exceptions/associations/non-loaded-association'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar'
import User from '../../../../test-app/app/models/User'

describe('Accessing an association that hasn’t been loaded', () => {
  context('HasOne', () => {
    it('throws an NonLoadedAssociation exception', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      expect(() => user.userSettings).toThrowError(NonLoadedAssociation)
    })
  })

  context('BelongsTo', () => {
    it('throws an NonLoadedAssociation exception', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const balloon = await Mylar.create({ user })
      const reloadedBalloon = await Mylar.find(balloon.id)
      expect(() => reloadedBalloon!.user).toThrowError(NonLoadedAssociation)
    })
  })

  context('HasMany', () => {
    it('throws an NonLoadedAssociation exception', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      expect(() => user.compositions).toThrowError(NonLoadedAssociation)
    })
  })
})
