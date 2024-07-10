import { DateTime } from 'luxon'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import Latex from '../../../test-app/app/models/Balloon/Latex'
import User from '../../../test-app/app/models/User'
import Pet from '../../../test-app/app/models/Pet'

describe('Dream#save', () => {
  context('a new record', () => {
    let user: User

    beforeEach(() => {
      user = User.new({ email: 'fred@frewd', password: 'howyadoin' })
    })

    it('saves', async () => {
      await user.save()
      const reloadedUser = await User.find(user.id)
      expect(reloadedUser).toMatchDreamModel(user)
    })

    context('skipHooks is passed', () => {
      it('skips model hooks', async () => {
        const pet = Pet.new({ name: 'change me' })
        await pet.save({ skipHooks: true })
        expect(pet.name).toEqual('change me')
      })
    })

    context('when encased in a transaction', () => {
      it('updates the underlying model in the db', async () => {
        await ApplicationModel.transaction(async txn => {
          await user.txn(txn).save()
        })

        const reloadedUser = await User.find(user.id)
        expect(reloadedUser).toMatchDreamModel(user)
      })

      context('skipHooks is passed', () => {
        it('skips model hooks', async () => {
          await ApplicationModel.transaction(async txn => {
            const pet = Pet.new({ name: 'change me' })
            await pet.txn(txn).save({ skipHooks: true })
            expect(pet.name).toEqual('change me')
          })
        })
      })
    })

    it('sets createdAt', async () => {
      await user.save()
      expect(user!.createdAt.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
      const reloadedUser = await User.find(user.id)
      expect(reloadedUser!.createdAt.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
    })

    context('when createdAt is passed', () => {
      it('doesn’t override createdAt', async () => {
        const createdAt = DateTime.now().minus({ day: 1 })
        user.createdAt = createdAt
        await user.save()
        expect(user!.createdAt.toSeconds()).toEqual(createdAt.toSeconds())
        const reloadedUser = await User.find(user.id)
        expect(reloadedUser!.createdAt.toSeconds()).toEqual(createdAt.toSeconds())
      })
    })

    it('sets updatedAt', async () => {
      await user.save()
      expect(user!.updatedAt.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
      const reloadedUser = await User.find(user.id)
      expect(reloadedUser!.updatedAt.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
    })

    context('when updatedAt is passed', () => {
      it('doesn’t override updatedAt', async () => {
        const updatedAt = DateTime.now().minus({ day: 1 })
        user.updatedAt = updatedAt
        await user.save()
        expect(user!.updatedAt.toSeconds()).toEqual(updatedAt.toSeconds())
        const reloadedUser = await User.find(user.id)
        expect(reloadedUser!.updatedAt.toSeconds()).toEqual(updatedAt.toSeconds())
      })
    })
  })

  context('a persisted record', () => {
    let user: User

    beforeEach(async () => {
      user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      user.name = 'cheese'
      await user.save()
    })

    it('saves', async () => {
      const reloadedUser = await User.find(user.id)
      expect(reloadedUser!.name).toEqual('cheese')
    })

    it('sets createdAt', async () => {
      expect(user!.createdAt.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
      const reloadedUser = await User.find(user.id)
      expect(reloadedUser!.createdAt.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
    })

    it('sets updatedAt', async () => {
      expect(user!.updatedAt.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
      const reloadedUser = await User.find(user.id)
      expect(reloadedUser!.updatedAt.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
    })

    context('coercing attributes', () => {
      context('string is passed in place of a decimal', () => {
        it('correctly coerces string decimal to decimal', async () => {
          const balloon = await Latex.create({ volume: '0.2' as any })
          expect(balloon.volume).toEqual(0.2)
        })
      })

      context('string is passed in place of an integer', () => {
        it('correctly coerces string decimal to decimal', async () => {
          const user = await User.create({
            email: 'how@yadoin',
            password: 'howyadoin',
            featuredPostPosition: '3' as any,
          })
          expect(user.featuredPostPosition).toEqual(3)
        })
      })
    })
  })
})
