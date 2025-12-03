import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Latex from '../../../test-app/app/models/Balloon/Latex.js'
import Animal from '../../../test-app/app/models/Balloon/Latex/Animal.js'
import Pet from '../../../test-app/app/models/Pet.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream#updateAttributes', () => {
  it('updates the attributes for a dream', async () => {
    const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
    await user.updateAttributes({ email: 'chalupas@dujour' })
    expect(user.email).toEqual('chalupas@dujour')

    await user.reload()
    expect(user.email).toEqual('chalupas@dujour')
  })

  it('calls model hooks', async () => {
    const pet = await Pet.create({ name: 'howyadoin' })
    await pet.updateAttributes({ name: 'change me' })
    expect(pet.name).toEqual('changed by update hook')

    await pet.reload()
    expect(pet.name).toEqual('changed by update hook')
  })

  context('skipHooks=false', () => {
    it('skips model hooks', async () => {
      const pet = await Pet.create({ name: 'howyadoin' })
      await pet.updateAttributes({ name: 'change me' }, { skipHooks: true })
      expect(pet.name).toEqual('change me')

      await pet.reload()
      expect(pet.name).toEqual('change me')
    })
  })

  context('when in a transaction', () => {
    it('calls model hooks', async () => {
      const pet = await Pet.create({ name: 'howyadoin' })

      await ApplicationModel.transaction(async txn => {
        await pet.txn(txn).updateAttributes({ name: 'change me' })
      })

      expect(pet.name).toEqual('changed by update hook')

      await pet.reload()
      expect(pet.name).toEqual('changed by update hook')
    })

    context('skipHooks=false', () => {
      it('skips model hooks', async () => {
        const pet = await Pet.create({ name: 'howyadoin' })

        await ApplicationModel.transaction(async txn => {
          await pet.txn(txn).updateAttributes({ name: 'change me' }, { skipHooks: true })
        })

        expect(pet.name).toEqual('change me')

        await pet.reload()
        expect(pet.name).toEqual('change me')
      })
    })
  })

  context('STI', () => {
    context('when updating the type field on an STI record', () => {
      it('bypasses user-defined setters, ensuring that the update happens', async () => {
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
        const balloon = await Animal.create({ user })
        expect(balloon.type).toEqual('Animal')

        await balloon.updateAttributes({ type: 'Latex' })
        const reloaded = await Latex.find(balloon.id)
        expect(reloaded!.type).toEqual('Latex')
      })
    })
  })
})

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('ensures invalid arguments error', async () => {
    await User.new().updateAttributes({
      // @ts-expect-error intentionally passing invalid arg to test that type protection is working
      invalidArg: 123,
    })
  })

  context('in a transaction', () => {
    it('ensures invalid arguments error', async () => {
      await ApplicationModel.transaction(async txn => {
        await User.new().txn(txn).updateAttributes({
          // @ts-expect-error intentionally passing invalid arg to test that type protection is working
          invalidArg: 123,
        })
      })
    })
  })
})
