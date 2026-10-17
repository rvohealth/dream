import DreamApp from '../../../src/dream-app/index.js'
import Encrypt from '../../../src/encrypt/index.js'
import CannotPassNullOrUndefinedToRequiredBelongsTo from '../../../src/errors/associations/CannotPassNullOrUndefinedToRequiredBelongsTo.js'
import DoNotSetEncryptedFieldsDirectly from '../../../src/errors/DoNotSetEncryptedFieldsDirectly.js'
import DecryptionError from '../../../src/errors/encrypt/DecryptionError.js'
import { DateTime } from '../../../src/utils/datetime/DateTime.js'
import BalloonLine from '../../../test-app/app/models/BalloonLine.js'
import Composition from '../../../test-app/app/models/Composition.js'
import Pet from '../../../test-app/app/models/Pet.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream initialization', () => {
  it('sets attributes', () => {
    const user = User.new({ email: 'fred' })
    expect(user.email).toEqual('fred')
    expect(user.getAttributes().email).toEqual('fred')
  })

  context('a dream is passed as an attribute', () => {
    it('allows passing of dream', () => {
      const user = User.new({ email: 'fred' })
      const pet = Pet.new({ user })
      expect(pet.user).toMatchDreamModel(user)
    })

    context('null is passed', () => {
      context('the relationship is optional', () => {
        it('allows null to be set', () => {
          const pet = Pet.new({ user: null })
          expect(pet.user).toBeNull()
        })
      })

      context('the relationship is required', () => {
        it('throws a targeted exception', () => {
          expect(() => BalloonLine.new({ balloon: null })).toThrow(
            CannotPassNullOrUndefinedToRequiredBelongsTo
          )
        })
      })
    })

    context('undefined is passed', () => {
      context('the relationship is optional', () => {
        it('allows undefined to be set', () => {
          expect(() => Pet.new({ user: undefined as any })).not.toThrow()
        })
      })

      context('the relationship is required', () => {
        it('throws a targeted exception', () => {
          expect(() => BalloonLine.new({ balloon: undefined as any })).toThrow(
            CannotPassNullOrUndefinedToRequiredBelongsTo
          )
        })
      })
    })
  })

  context('with bypassUserDefinedSetters', () => {
    it('sets attributes as given, bypassing custom setters', () => {
      const pet = Pet.new({ nickname: 'Jasper' }, { bypassUserDefinedSetters: true })
      expect(pet.nickname).toEqual('Jasper')
    })

    it('encrypts a value given for an encrypted property', () => {
      const user = User.new({ secret: 'shh' }, { bypassUserDefinedSetters: true })

      expect(user.getAttribute('encryptedSecret')).not.toEqual('shh')
      expect(user.secret).toEqual('shh')
    })

    it('accepts ciphertext the app can decrypt for an @Encrypted backing column', () => {
      const ciphertext = User.new({ secret: 'copied secret' }).getAttribute('encryptedSecret')

      const user = User.new({ encryptedSecret: ciphertext }, { bypassUserDefinedSetters: true })

      expect(user.secret).toEqual('copied secret')
    })

    it('rejects plaintext for an @Encrypted backing column', () => {
      expect(() => User.new({ encryptedSecret: 'plaintext' }, { bypassUserDefinedSetters: true })).toThrow(
        DoNotSetEncryptedFieldsDirectly
      )
    })
  })

  context('a row is loaded from the database', () => {
    it('loads a row whose stored ciphertext no longer decrypts, throwing only when the encrypted property is read', async () => {
      const user = await User.create({ email: 'fred@', password: 'howyadoin', secret: 'original' })
      const dreamApp = DreamApp.getOrFail()
      const originalEncryption = dreamApp.encryption

      try {
        dreamApp.set('encryption', {
          columns: { current: { algorithm: 'aes-256-gcm', key: Encrypt.generateKey('aes-256-gcm') } },
        })

        const loaded = await User.findOrFail(user.id)

        expect(loaded.email).toEqual('fred@')
        expect(() => loaded.secret).toThrow(DecryptionError)
      } finally {
        dreamApp.set('encryption', originalEncryption)
      }
    })
  })

  context('an object is passed to a jsonb field', () => {
    it('converts the object to a string for insertion, but exposes it as an object when fetched', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const metadata = { version: 1 }
      const composition = Composition.new({ content: 'howyadoin', metadata, user })
      expect(composition.metadata).toEqual({ version: 1 })

      await composition.save()
      expect(composition.metadata).toEqual({ version: 1 })

      expect(composition.getAttributes().metadata).toEqual(JSON.stringify({ version: 1 }))
    })
  })

  context('an object is marshaled as a javascript date by kysely', () => {
    it('converts the date to a DateTime', async () => {
      const user = await User.create({ email: 'fred@', password: 'howyadoin' })
      const u = await User.find(user.id)
      expect(u!.createdAt.constructor).toEqual(DateTime)
    })
  })
})
