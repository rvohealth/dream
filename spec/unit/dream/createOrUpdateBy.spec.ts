import Composition from '../../../test-app/app/models/Composition.js'
import Pet from '../../../test-app/app/models/Pet.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.createOrUpdateBy', () => {
  context('no underlying conflicts to prevent save', () => {
    it('creates the underlying model in the db', async () => {
      const u = await User.createOrUpdateBy({ email: 'trace@trace' }, { with: { password: 'howyadoin' } })

      const user = await User.find(u.id)
      expect(user!.email).toEqual('trace@trace')
      expect(await user!.checkPassword('howyadoin')).toEqual(true)
    })

    it('respects associations in primary opts with user', async () => {
      const user = await User.create({ email: 'trace@trace', password: 'howyadoin' })
      const composition = await Composition.createOrUpdateBy({ user }, { with: { content: 'howyadoin' } })

      expect(composition.userId).toEqual(user.id)
      expect(composition.content).toEqual('howyadoin')
    })

    it('respects associations in primary opts with userId', async () => {
      const user = await User.create({ email: 'trace@trace', password: 'howyadoin' })
      const composition = await Composition.createOrUpdateBy(
        { userId: user.id },
        { with: { content: 'howyadoin' } }
      )

      expect(composition.userId).toEqual(user.id)
      expect(composition.content).toEqual('howyadoin')
    })

    it('respects associations in secondary opts with user', async () => {
      const user = await User.create({ email: 'trace@trace', password: 'howyadoin' })
      const composition = await Composition.createOrUpdateBy({ content: 'howyadoin' }, { with: { user } })

      expect(composition.userId).toEqual(user.id)
    })

    it('respects associations in secondary opts with userId', async () => {
      const user = await User.create({ email: 'trace@trace', password: 'howyadoin' })
      const composition = await Composition.createOrUpdateBy(
        { content: 'howyadoin' },
        { with: { userId: user.id } }
      )

      expect(composition.userId).toEqual(user.id)
    })

    context('skipHooks is passed', () => {
      it('skips model hooks', async () => {
        await Pet.createOrUpdateBy({ species: 'dog' }, { with: { name: 'change me' }, skipHooks: true })

        const pet = await Pet.first()
        expect(pet!.name).toEqual('change me')
        expect(await Pet.count()).toEqual(1)
      })
    })
  })

  context('when a conflicting record already exists in the db', () => {
    let user: User

    beforeEach(async () => {
      user = await User.create({ email: 'trace@trace', password: 'howyadoin' })
    })

    it('updates the existing record', async () => {
      const u = await User.createOrUpdateBy({ email: 'trace@trace' }, { with: { password: 'newpassword' } })
      const user = await User.find(u.id)
      expect(user!.email).toEqual('trace@trace')
      expect(await user!.checkPassword('newpassword')).toEqual(true)
    })

    it.only('returns the existing record if there are no updates to with', async () => {
      await user.update({ favoriteWord: 'hi' })
      const u = await User.createOrUpdateBy({ email: 'trace@trace', favoriteWord: 'hi' })

      expect(u.email).toEqual('trace@trace')
      expect(u.favoriteWord).toEqual('hi')
    })

    it('respects associations in primary opts with user', async () => {
      await Composition.create({ user, content: 'howyadoin' })
      const composition = await Composition.createOrUpdateBy({ user }, { with: { content: 'newcontent' } })

      expect(composition.userId).toEqual(user.id)
      expect(composition.content).toEqual('newcontent')
    })

    it('respects associations in primary opts with userId', async () => {
      await Composition.create({ user, content: 'howyadoin' })
      const composition = await Composition.createOrUpdateBy(
        { userId: user.id },
        { with: { content: 'newcontent' } }
      )

      expect(composition.userId).toEqual(user.id)
      expect(composition.content).toEqual('newcontent')
    })

    it('respects associations in secondary opts with user', async () => {
      const otherUser = await User.create({ email: 'trace@hi', password: 'notbad' })
      await Composition.create({ content: 'howyadoin', user: otherUser })

      const composition = await Composition.createOrUpdateBy({ content: 'howyadoin' }, { with: { user } })

      expect(composition.userId).toEqual(user.id)
    })

    it('respects associations in secondary opts with userId', async () => {
      const otherUser = await User.create({ email: 'new@trace', password: 'notbad' })
      await Composition.create({ content: 'howyadoin', user: otherUser })

      const composition = await Composition.createOrUpdateBy(
        { content: 'howyadoin' },
        { with: { userId: user.id } }
      )

      expect(composition.userId).toEqual(user.id)
    })

    context('skipHooks is passed', () => {
      it('skips model hooks', async () => {
        await Pet.createOrUpdateBy({ species: 'dog' }, { with: { name: 'change me' }, skipHooks: true })

        const pet = await Pet.first()
        expect(pet!.name).toEqual('change me')
        expect(await Pet.count()).toEqual(1)
      })
    })
  })
})
