import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../test-app/app/models/Composition.js'
import Pet from '../../../test-app/app/models/Pet.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.updateOrCreateBy', () => {
  context('no underlying conflicts to prevent save', () => {
    it('creates the underlying model in the db', async () => {
      const u = await User.updateOrCreateBy({ email: 'trace@frewd' }, { with: { password: 'howyadoin' } })

      const user = await User.find(u.id)
      expect(user!.email).toEqual('trace@frewd')
      expect(await user!.checkPassword('howyadoin')).toEqual(true)
    })

    it('respects associations in primary opts with user', async () => {
      const user = await User.create({ email: 'trace@trace', password: 'howyadoin' })
      const composition = await Composition.updateOrCreateBy({ user }, { with: { content: 'howyadoin' } })

      expect(composition.userId).toEqual(user.id)
      expect(composition.content).toEqual('howyadoin')
    })

    it('respects associations in primary opts with userId', async () => {
      const user = await User.create({ email: 'trace@trace', password: 'howyadoin' })
      const composition = await Composition.updateOrCreateBy(
        { userId: user.id },
        { with: { content: 'howyadoin' } }
      )

      expect(composition.userId).toEqual(user.id)
      expect(composition.content).toEqual('howyadoin')
    })

    it('respects associations in secondary opts with user', async () => {
      const user = await User.create({ email: 'trace@trace', password: 'howyadoin' })
      const composition = await Composition.updateOrCreateBy({ content: 'howyadoin' }, { with: { user } })

      expect(composition.userId).toEqual(user.id)
    })

    it('respects associations in secondary opts with userId', async () => {
      const user = await User.create({ email: 'trace@trace', password: 'howyadoin' })
      const composition = await Composition.updateOrCreateBy(
        { content: 'howyadoin' },
        { with: { userId: user.id } }
      )

      expect(composition.userId).toEqual(user.id)
    })

    context('skipHooks is passed', () => {
      it('skips model hooks', async () => {
        await Pet.updateOrCreateBy({ species: 'dog' }, { with: { name: 'change me' }, skipHooks: true })

        const pet = await Pet.first()
        expect(pet!.name).toEqual('change me')
        expect(await Pet.count()).toEqual(1)
      })
    })

    context('given a transaction', () => {
      it('creates the underlying model in the db', async () => {
        let u: User | null = null

        await ApplicationModel.transaction(async txn => {
          u = await User.txn(txn).updateOrCreateBy(
            { email: 'trace@trace' },
            { with: { password: 'howyadoin' } }
          )
        })

        const user = await User.find(u!.id)
        expect(user!.email).toEqual('trace@trace')
        expect(await user!.checkPassword('howyadoin')).toEqual(true)
      })
    })
  })

  context('when a conflicting record already exists in the db', () => {
    let user: User

    beforeEach(async () => {
      user = await User.create({ email: 'trace@trace', password: 'howyadoin' })
    })

    it('updates the existing record', async () => {
      const u = await User.updateOrCreateBy({ email: 'trace@trace' }, { with: { password: 'newpassword' } })
      const user = await User.find(u.id)
      expect(user!.email).toEqual('trace@trace')
      expect(await user!.checkPassword('newpassword')).toEqual(true)
    })

    it('returns the existing record if there are no updates to with', async () => {
      await user.update({ favoriteWord: 'hi' })
      const u = await User.updateOrCreateBy({ email: 'trace@trace', favoriteWord: 'hi' })

      expect(u.email).toEqual('trace@trace')
      expect(u.favoriteWord).toEqual('hi')
    })

    it('respects associations in primary opts with user', async () => {
      await Composition.create({ user, content: 'howyadoin' })
      const composition = await Composition.updateOrCreateBy({ user }, { with: { content: 'newcontent' } })

      expect(composition.userId).toEqual(user.id)
      expect(composition.content).toEqual('newcontent')
    })

    it('respects associations in primary opts with userId', async () => {
      await Composition.create({ user, content: 'howyadoin' })
      const composition = await Composition.updateOrCreateBy(
        { userId: user.id },
        { with: { content: 'newcontent' } }
      )

      expect(composition.userId).toEqual(user.id)
      expect(composition.content).toEqual('newcontent')
    })

    it('respects associations in secondary opts with user', async () => {
      const otherUser = await User.create({ email: 'trace@hi', password: 'notbad' })
      await Composition.create({ content: 'howyadoin', user: otherUser })

      const composition = await Composition.updateOrCreateBy({ content: 'howyadoin' }, { with: { user } })

      expect(composition.userId).toEqual(user.id)
    })

    it('respects associations in secondary opts with userId', async () => {
      const otherUser = await User.create({ email: 'new@trace', password: 'notbad' })
      await Composition.create({ content: 'howyadoin', user: otherUser })

      const composition = await Composition.updateOrCreateBy(
        { content: 'howyadoin' },
        { with: { userId: user.id } }
      )

      expect(composition.userId).toEqual(user.id)
    })

    context('skipHooks is passed', () => {
      it('skips model hooks', async () => {
        const { species } = await Pet.create()
        await Pet.updateOrCreateBy({ species }, { with: { name: 'change me' }, skipHooks: true })

        const pet = await Pet.first()
        expect(pet!.name).toEqual('change me')
        expect(await Pet.count()).toEqual(1)
      })
    })

    context('given a transaction', () => {
      it('creates the underlying model in the db', async () => {
        let u: User | null = null

        await ApplicationModel.transaction(async txn => {
          u = await User.txn(txn).updateOrCreateBy(
            { email: 'trace@trace' },
            { with: { password: 'newpassword' } }
          )
        })

        const user = await User.find(u!.id)
        expect(user!.email).toEqual('trace@trace')
        expect(await user!.checkPassword('newpassword')).toEqual(true)
      })
    })
  })
})

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('ensures invalid arguments error', async () => {
    await User
      // @ts-expect-error intentionally passing invalid arg to test that type protection is working
      .updateOrCreateBy({ invalidArg: 123 })

    await User.updateOrCreateBy(
      { email: 'a@b' },
      {
        with: {
          // @ts-expect-error intentionally passing invalid arg to test that type protection is working
          invalidArg: 123,
        },
      }
    )
  })

  context('in a transaction', () => {
    it('ensures invalid arguments error', async () => {
      await ApplicationModel.transaction(async txn => {
        await User.txn(txn)
          // @ts-expect-error intentionally passing invalid arg to test that type protection is working
          .updateOrCreateBy({ invalidArg: 123 })

        await User.txn(txn).updateOrCreateBy(
          { email: 'a@b' },
          {
            with: {
              // @ts-expect-error intentionally passing invalid arg to test that type protection is working
              invalidArg: 123,
            },
          }
        )
      })
    })
  })
})
