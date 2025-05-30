import { MockInstance } from 'vitest'
import * as runHooksForModule from '../../../src/dream/internal/runHooksFor.js'
import CanOnlyPassBelongsToModelParam from '../../../src/errors/associations/CanOnlyPassBelongsToModelParam.js'
import { CalendarDate, DateTime, Dream, DreamTransaction } from '../../../src/index.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Animal from '../../../test-app/app/models/Balloon/Latex/Animal.js'
import Mylar from '../../../test-app/app/models/Balloon/Mylar.js'
import Composition from '../../../test-app/app/models/Composition.js'
import ModelForOpenapiTypeSpecs from '../../../test-app/app/models/ModelForOpenapiTypeSpec.js'
import ModelWithoutUpdatedAt from '../../../test-app/app/models/ModelWithoutUpdatedAt.js'
import Pet from '../../../test-app/app/models/Pet.js'
import Post from '../../../test-app/app/models/Post.js'
import Rating from '../../../test-app/app/models/Rating.js'
import User from '../../../test-app/app/models/User.js'
import UserSettings from '../../../test-app/app/models/UserSettings.js'

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

  it('calls model hooks', async () => {
    const pet = await Pet.create()
    await pet.update({ name: 'change me' })
    expect(pet.name).toEqual('changed by update hook')
  })

  context('skipHooks is passed', () => {
    it('skips model hooks', async () => {
      const pet = await Pet.create()
      await pet.update({ name: 'change me' }, { skipHooks: true })
      expect(pet.name).toEqual('change me')
    })
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

    context('skipHooks is passed', () => {
      it('skips model hooks', async () => {
        await ApplicationModel.transaction(async txn => {
          const pet = await Pet.txn(txn).create()
          await pet.txn(txn).update({ name: 'change me' }, { skipHooks: true })
          expect(pet.name).toEqual('change me')
        })
      })
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

    context('model hooks', () => {
      let hooksSpy: MockInstance

      function expectAfterUpdateAndSaveHooksCalled(dream: Dream) {
        expect(hooksSpy).toHaveBeenCalledWith(
          'afterUpdate',
          expect.toMatchDreamModel(dream),
          true,
          expect.anything(),
          expect.any(DreamTransaction)
        )
        expect(hooksSpy).toHaveBeenCalledWith(
          'afterSave',
          expect.toMatchDreamModel(dream),
          true,
          expect.anything(),
          expect.any(DreamTransaction)
        )
        expect(hooksSpy).toHaveBeenCalledWith(
          'afterUpdateCommit',
          expect.toMatchDreamModel(dream),
          true,
          expect.anything(),
          expect.any(DreamTransaction)
        )
        expect(hooksSpy).toHaveBeenCalledWith(
          'afterSaveCommit',
          expect.toMatchDreamModel(dream),
          true,
          expect.anything(),
          expect.any(DreamTransaction)
        )
      }

      function expectAfterUpdateAndSaveHooksNotCalled() {
        expect(hooksSpy).not.toHaveBeenCalledWith(
          'afterUpdate',
          expect.anything(),
          true,
          expect.anything(),
          expect.any(DreamTransaction)
        )
        expect(hooksSpy).not.toHaveBeenCalledWith(
          'afterSave',
          expect.anything(),
          true,
          expect.anything(),
          expect.any(DreamTransaction)
        )
        expect(hooksSpy).not.toHaveBeenCalledWith(
          'afterUpdateCommit',
          expect.anything(),
          true,
          expect.anything(),
          expect.any(DreamTransaction)
        )
        expect(hooksSpy).not.toHaveBeenCalledWith(
          'afterSaveCommit',
          expect.anything(),
          true,
          expect.anything(),
          expect.any(DreamTransaction)
        )
      }

      it('calls model hooks', async () => {
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

        await ApplicationModel.transaction(async txn => {
          hooksSpy = vi.spyOn(runHooksForModule, 'default')
          await user.txn(txn).update({ email: 'something@else' })
        })

        expectAfterUpdateAndSaveHooksCalled(user)
      })

      context('when saving of transaction fails', () => {
        it('does not call model hooks', async () => {
          await User.create({ email: 'fred@alreadyexists', password: 'howyadoin' })
          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

          try {
            await ApplicationModel.transaction(async txn => {
              hooksSpy = vi.spyOn(runHooksForModule, 'default')
              await user.txn(txn).update({ email: 'fred@alreadyexists', password: 'howyadoin' })
            })
          } catch {
            // noop
          }

          expectAfterUpdateAndSaveHooksNotCalled()
        })
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
    expect(user.updatedAt.toSeconds()).toEqual(updatedAt.toSeconds())

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
        await pet.update({ user: undefined as any })

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

      await expect(user.update({ userSettings } as any)).rejects.toThrow(CanOnlyPassBelongsToModelParam)
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

  context('datetime column', () => {
    let user: User
    const newTime = DateTime.now().minus({ days: 7 })

    beforeEach(async () => {
      user = await User.create({
        email: 'ham@',
        password: 'chalupas',
      })
    })

    it('updates to the date', async () => {
      await user.update({ deletedAt: newTime })
      const reloaded = await User.removeAllDefaultScopes().findOrFail(user.id)
      expect(reloaded.deletedAt).toEqualDateTime(newTime)
    })

    context('with a string representation of a datetime', () => {
      it('updates to the datetime', async () => {
        await user.update({ deletedAt: newTime.setZone('America/Chicago').toISO() as any })
        const reloaded = await User.removeAllDefaultScopes().findOrFail(user.id)
        expect(reloaded.deletedAt).toEqualDateTime(newTime)
      })
    })

    context('update with a CalendarDate', () => {
      it('updates to the date', async () => {
        const newTime = CalendarDate.today().minus({ days: 7 })
        await user.update({ deletedAt: newTime })
        const reloaded = await User.removeAllDefaultScopes().findOrFail(user.id)
        expect(reloaded.deletedAt).toEqualDateTime(newTime.toDateTime())
      })
    })
  })

  context('datetime array column', () => {
    let model: ModelForOpenapiTypeSpecs
    const newTime = DateTime.now().minus({ days: 7 })

    beforeEach(async () => {
      model = await ModelForOpenapiTypeSpecs.create({
        email: 'charlie@peanuts.com',
        passwordDigest: 'xxxxxxxxxxxxx',
      })
    })

    it('updates to the date', async () => {
      await model.update({ favoriteDatetimes: [newTime] })
      const reloaded = await ModelForOpenapiTypeSpecs.findOrFail(model.id)
      expect(reloaded.favoriteDatetimes?.[0]).toEqualDateTime(newTime)
    })

    context('with a string representation of a datetime', () => {
      it('updates to the datetime', async () => {
        await model.update({ favoriteDatetimes: [newTime.setZone('America/Chicago').toISO() as any] })
        const reloaded = await ModelForOpenapiTypeSpecs.findOrFail(model.id)
        expect(reloaded.favoriteDatetimes?.[0]).toEqualDateTime(newTime)
      })
    })

    context('update with a CalendarDate', () => {
      it('updates to the date', async () => {
        const newTime = CalendarDate.today().minus({ days: 7 })
        await model.update({ favoriteDatetimes: [newTime] })
        const reloaded = await ModelForOpenapiTypeSpecs.findOrFail(model.id)
        expect(reloaded.favoriteDatetimes?.[0]).toEqualDateTime(newTime.toDateTime())
      })
    })
  })

  context('date column', () => {
    let user: User
    const newDate = CalendarDate.fromISO('1980-10-13')

    beforeEach(async () => {
      user = await User.create({
        email: 'ham@',
        password: 'chalupas',
      })
    })

    it('updates to the date', async () => {
      await user.update({ birthdate: newDate })
      const reloaded = await User.removeAllDefaultScopes().findOrFail(user.id)
      expect(reloaded.birthdate).toEqualCalendarDate(newDate)
    })

    context('with a string representation of a date', () => {
      it('updates to the date', async () => {
        await user.update({ birthdate: newDate.toISO() as any })
        const reloaded = await User.removeAllDefaultScopes().findOrFail(user.id)
        expect(reloaded.birthdate).toEqualCalendarDate(newDate)
      })
    })

    context('update with a DateTime', () => {
      it('updates to the date', async () => {
        await user.update({ birthdate: newDate.toISODate() as any })
        const reloaded = await User.removeAllDefaultScopes().findOrFail(user.id)
        expect(reloaded.birthdate).toEqualCalendarDate(newDate)
      })
    })
  })

  context('date array column', () => {
    let model: ModelForOpenapiTypeSpecs
    const dateString = '1980-10-13'
    const newDate = CalendarDate.fromISO(dateString)

    beforeEach(async () => {
      model = await ModelForOpenapiTypeSpecs.create({
        email: 'charlie@peanuts.com',
        passwordDigest: 'xxxxxxxxxxxxx',
      })
    })

    it('updates to the dates', async () => {
      await model.update({ favoriteDates: [newDate] })
      const reloaded = await ModelForOpenapiTypeSpecs.findOrFail(model.id)
      expect(reloaded.favoriteDates?.[0]).toEqualCalendarDate(newDate)
    })

    context('with a string representation of dates', () => {
      it('updates to the date', async () => {
        await model.update({ favoriteDates: [newDate.toISO() as any] })
        const reloaded = await ModelForOpenapiTypeSpecs.findOrFail(model.id)
        expect(reloaded.favoriteDates?.[0]).toEqualCalendarDate(newDate)
      })
    })

    context('update with DateTimes', () => {
      it('updates to the date', async () => {
        await model.update({ favoriteDates: [DateTime.fromISO(dateString)] })
        const reloaded = await ModelForOpenapiTypeSpecs.findOrFail(model.id)
        expect(reloaded.favoriteDates?.[0]).toEqualCalendarDate(newDate)
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

  context('when updating an encrypted column', () => {
    it('succeeds', async () => {
      let user = await User.create({ email: 'how@yadoin', password: 'howyadoin', secret: 'shh!' })
      expect(user.secret).toEqual('shh!')
      await user.update({ secret: 'howyadoin' })

      user = await User.findOrFail(user.id)
      expect(user.secret).toEqual('howyadoin')
    })
  })
})
