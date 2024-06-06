import { DateTime } from 'luxon'
import { CalendarDate } from '../../../src'
import CanOnlyPassBelongsToModelParam from '../../../src/exceptions/associations/can-only-pass-belongs-to-model-param'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import Animal from '../../../test-app/app/models/Balloon/Latex/Animal'
import Mylar from '../../../test-app/app/models/Balloon/Mylar'
import Composition from '../../../test-app/app/models/Composition'
import ModelWithoutUpdatedAt from '../../../test-app/app/models/ModelWithoutUpdatedAt'
import Pet from '../../../test-app/app/models/Pet'
import Post from '../../../test-app/app/models/Post'
import Rating from '../../../test-app/app/models/Rating'
import User from '../../../test-app/app/models/User'
import UserSettings from '../../../test-app/app/models/UserSettings'

describe('Dream#update', () => {
  it('updates the underlying model in the db', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'Charlie Brown' })
    expect(user.name).toEqual('Charlie Brown')
    await user.update({ name: 'Snoopy' })

    expect(user.name).toEqual('Snoopy')
    const reloadedUser = await User.find(user.id)
    expect(reloadedUser!.name).toEqual('Snoopy')
  })

  it('does not update neighboring records', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'Charlie Brown' })
    const user2 = await User.create({ email: 'fred@fred', password: 'howyadoin', name: 'Blues jr' })

    await user.update({ email: 'how@yadoin' })
    await user2.reload()
    expect(user2.email).toEqual('fred@fred')
  })

  context('when encased in a transaction', () => {
    it('updates the underlying model in the db', async () => {
      let user: User | null = null
      await ApplicationModel.transaction(async txn => {
        user = await User.txn(txn).create({
          email: 'fred@frewd',
          password: 'howyadoin',
          name: 'Charlie Brown',
        })

        expect(user.name).toEqual('Charlie Brown')
        await user.txn(txn).update({ name: 'Snoopy' })
      })

      expect(user!.name).toEqual('Snoopy')
      const reloadedUser = await User.find(user!.id)
      expect(reloadedUser!.name).toEqual('Snoopy')
    })

    context('with a model containing setter overrides', () => {
      it('applies setter overrides', async () => {
        let pet: Pet | null = null
        await ApplicationModel.transaction(async txn => {
          pet = await Pet.txn(txn).create({
            name: 'Violet',
          })

          await pet.txn(txn).update({ nickname: 'Pony' })
        })

        expect(pet!.getAttribute('nickname')).toEqual('Li’l Pony')
      })
    })
  })

  it('updates the updatedAt field', async () => {
    const updatedAt = DateTime.now().minus({ day: 1 })
    const user = await User.create({
      email: 'fred@frewd',
      password: 'howyadoin',
      name: 'Charlie Brown',
      updatedAt: updatedAt,
    })
    expect(user.updatedAt.toSeconds()).toBeWithin(1, updatedAt.toSeconds())

    await user.update({ email: 'how@yadoin' })
    expect(user.updatedAt.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
    const reloadedUser = await User.find(user.id)
    expect(reloadedUser!.updatedAt.toSeconds()).toBeWithin(1, DateTime.now().toSeconds())
  })

  context('the model does not have an updatedAt field', () => {
    it('does not raise an exception', async () => {
      const user = await User.create({ email: 'fred@dred', password: 'howyadoin' })
      const pet = await Pet.create({ user, name: 'pal', species: 'cat' })

      // this is really checking that updating a stray attribute does not
      // raise an exception, since the Pet model was configured intentionally
      // to be missing an updatedAt field.
      await pet.update({ name: 'pal mcjones' })
      expect(pet.name).toEqual('pal mcjones')
    })
  })

  context('passed a model to a BelongsTo association', () => {
    it('sets the foreign key on this object', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const otherUser = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      await composition.update({ user: otherUser })

      expect(composition.userId).toEqual(otherUser.id)
      const reloadedComposition = await Composition.find(composition.id)
      expect(reloadedComposition!.userId).toEqual(otherUser.id)
    })

    it('sets the reference to that model', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const otherUser = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      await composition.update({ user: otherUser })

      expect(composition.user).toEqual(otherUser)
    })

    context('when being set from a real value to undefined', () => {
      it('does not update the value to null', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const pet = await Pet.create({ user })
        await pet.update({ user: undefined })

        expect(pet.userId).toEqual(user.id)
        const reloadedPet = await Pet.find(pet.id)
        expect(reloadedPet!.userId).toEqual(user.id)
      })
    })

    context('when being set from a real value to null', () => {
      it('updates the value to null', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const pet = await Pet.create({ user })
        await pet.update({ userId: null })

        expect(pet.userId).toBeNull()
        const reloadedPet = await Pet.find(pet.id)
        expect(reloadedPet!.userId).toBeNull()
      })
    })

    context('when being set from a real value to a null association', () => {
      it('updates the value to null', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const pet = await Pet.create({ user })
        await pet.update({ user: null })

        expect(pet.userId).toBeNull()
        const reloadedPet = await Pet.find(pet.id)
        expect(reloadedPet!.userId).toBeNull()
      })
    })

    context('when the association being set has been loaded with a different model', () => {
      it('sets the reference to that model', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const otherUser = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ user })
        const reloaded = await Composition.preload('user').find(composition.id)
        await reloaded!.update({ user: otherUser })

        expect(reloaded!.user).toEqual(otherUser)
      })
    })

    context('when the model is polymorphic', () => {
      it('sets the foreign key and foreign key type on this object', async () => {
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const post = await Post.create({ user })
        const composition = await Composition.create({ user })
        const rating = await Rating.create({ user, rateable: post })
        await rating.update({ rateable: composition })

        expect(rating.rateableId).toEqual(composition.id)
        expect(rating.rateableType).toEqual('Composition')
        const reloadedRating = await Rating.find(rating.id)
        expect(reloadedRating!.rateableId).toEqual(composition.id)
        expect(reloadedRating!.rateableType).toEqual('Composition')
      })

      it('sets the reference to that model', async () => {
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const post = await Post.create({ user })
        const composition = await Composition.create({ user })
        const rating = await Rating.create({ user, rateable: post })
        await rating.update({ rateable: composition })

        expect(rating.rateable).toEqual(composition)
      })
    })
  })

  context('passed a model to a HasOne association', () => {
    it('raises an exception', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const userSettings = UserSettings.new({ likesChalupas: true })

      await expect(user.update({ userSettings } as any)).rejects.toThrowError(CanOnlyPassBelongsToModelParam)
    })
  })

  context('given a postgres array field', () => {
    it('correctly inserts the array values into the field', async () => {
      const pet = await Pet.create({
        favoriteTreats: ['chicken', 'tuna', 'cat-safe chalupas (catlupas,supaloopas)'],
      })
      await pet.update({ favoriteTreats: ['chicken'] })

      expect(pet.favoriteTreats).toEqual(['chicken'])

      await pet.reload()
      expect(pet.favoriteTreats).toEqual(['chicken'])
    })
  })

  context('datetime field', () => {
    let user: User

    beforeEach(async () => {
      user = await User.create({
        email: 'ham@',
        password: 'chalupas',
      })
    })

    it('updates to the date', async () => {
      const newTime = DateTime.now().minus({ days: 7 })
      await user.update({ deletedAt: newTime })
      const reloaded = await User.unscoped().find(user.id)
      expect(reloaded!.deletedAt).toEqualDateTime(newTime)
    })

    context('with a string representation of a datetime', () => {
      it('updates to the datetime', async () => {
        const newTime = DateTime.now().minus({ days: 7 })
        await user.update({ deletedAt: newTime.toISO() as any })
        const reloaded = await User.unscoped().find(user.id)
        expect(reloaded!.deletedAt).toEqualDateTime(newTime)
      })
    })

    context('update with a CalendarDate', () => {
      it('updates to the date', async () => {
        const newTime = CalendarDate.today().minus({ days: 7 })
        await user.update({ deletedAt: newTime })
        const reloaded = await User.unscoped().find(user.id)
        expect(reloaded!.deletedAt?.toISODate()).toEqual(newTime.toISODate())
      })
    })
  })

  context('date field', () => {
    let user: User
    const dateString = '1980-10-13'

    beforeEach(async () => {
      user = await User.create({
        email: 'ham@',
        password: 'chalupas',
      })
    })

    it('updates to the date', async () => {
      const newDate = CalendarDate.fromISO(dateString)
      await user.update({ birthdate: newDate })
      const reloaded = await User.unscoped().find(user.id)
      expect(reloaded!.birthdate!.toISODate()).toEqual(dateString)
    })

    context('with a string representation of a date', () => {
      it('updates to the date', async () => {
        await user.update({ birthdate: dateString as any })
        const reloaded = await User.unscoped().find(user.id)
        expect(reloaded!.birthdate!.toISODate()).toEqual(dateString)
      })
    })

    context('update with a DateTime', () => {
      it('updates to the date', async () => {
        const newDate = DateTime.fromISO(dateString)
        await user.update({ birthdate: newDate })
        const reloaded = await User.unscoped().find(user.id)
        expect(reloaded!.birthdate!.toISO()).toEqual(dateString)
      })
    })
  })

  context('STI', () => {
    context('when updating the type field on an STI record', () => {
      it('allows the type field to update', async () => {
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
        const balloon = await Mylar.create({ user })
        expect(balloon.type).toEqual('Mylar')

        await balloon.update({ type: 'Animal' })
        const reloaded = await Animal.find(balloon.id)
        expect(reloaded!.type).toEqual('Animal')
      })
    })
  })

  context(
    'when a BeforeSave/Update action leaves a model with nothing to update ' +
      '(only happens on models without an updatedAt field since that is automatically maintained)',
    () => {
      it('does not throw an error', async () => {
        const modelWithoutUpdatedAt = await ModelWithoutUpdatedAt.create({ cantUpdateThis: 'hello world' })

        await modelWithoutUpdatedAt.update({ cantUpdateThis: 'goodbye' })

        await modelWithoutUpdatedAt.reload()
        expect(modelWithoutUpdatedAt.cantUpdateThis).toEqual('hello world')
      })
    }
  )
})
