import DreamApp from '../../../src/dream-app/index.js'
import Encrypt from '../../../src/encrypt/index.js'
import DoNotSetEncryptedFieldsDirectly from '../../../src/errors/DoNotSetEncryptedFieldsDirectly.js'
import DecryptionError from '../../../src/errors/encrypt/DecryptionError.js'
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

  context('with undefined values', () => {
    it('skips a column given as undefined, keeping its stored value', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'Chalupa Joe' })

      await user.updateAttributes({ name: undefined, email: 'chalupas@dujour' })

      const reloaded = await User.findOrFail(user.id)
      expect(reloaded.name).toEqual('Chalupa Joe')
      expect(reloaded.email).toEqual('chalupas@dujour')
    })

    it('clears an encrypted property given as undefined', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin', secret: 'original' })

      await user.updateAttributes({ secret: undefined })

      const reloaded = await User.findOrFail(user.id)
      expect(reloaded.secret).toBeNull()
    })
  })

  context('with an @Encrypted backing column', () => {
    it('saves ciphertext the app can decrypt', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin', secret: 'original' })
      const ciphertext = User.new({ secret: 'copied secret' }).getAttribute('encryptedSecret')

      await user.updateAttributes({ encryptedSecret: ciphertext })

      const reloaded = await User.findOrFail(user.id)
      expect(reloaded.secret).toEqual('copied secret')
    })

    it('saves null, clearing the column', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin', secret: 'original' })

      await user.updateAttributes({ encryptedSecret: null })

      const reloaded = await User.findOrFail(user.id)
      expect(reloaded.secret).toBeNull()
    })

    it('rejects plaintext, saving nothing', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin', secret: 'original' })

      await expect(
        user.updateAttributes({ email: 'chalupas@dujour', encryptedSecret: 'plaintext' })
      ).rejects.toThrow(DoNotSetEncryptedFieldsDirectly)

      const reloaded = await User.findOrFail(user.id)
      expect(reloaded.email).toEqual('how@yadoin')
      expect(reloaded.secret).toEqual('original')
    })

    it('saves and reloads a record whose stored ciphertext no longer decrypts', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin', secret: 'original' })
      const dreamApp = DreamApp.getOrFail()
      const originalEncryption = dreamApp.encryption

      try {
        dreamApp.set('encryption', {
          columns: { current: { algorithm: 'aes-256-gcm', key: Encrypt.generateKey('aes-256-gcm') } },
        })

        await user.updateAttributes({ email: 'chalupas@dujour' })
        await user.reload()

        expect(user.email).toEqual('chalupas@dujour')
        expect(() => user.secret).toThrow(DecryptionError)
      } finally {
        dreamApp.set('encryption', originalEncryption)
      }
    })
  })

  context('when in a transaction', () => {
    it('rejects plaintext for an @Encrypted backing column, saving nothing', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin', secret: 'original' })

      await expect(
        ApplicationModel.transaction(async txn => {
          await user.txn(txn).updateAttributes({ email: 'chalupas@dujour', encryptedSecret: 'plaintext' })
        })
      ).rejects.toThrow(DoNotSetEncryptedFieldsDirectly)

      const reloaded = await User.findOrFail(user.id)
      expect(reloaded.email).toEqual('how@yadoin')
      expect(reloaded.secret).toEqual('original')
    })

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
