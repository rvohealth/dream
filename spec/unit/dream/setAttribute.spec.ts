import STI from '../../../src/decorators/class/STI.js'
import Decorators from '../../../src/decorators/Decorators.js'
import DreamApp from '../../../src/dream-app/index.js'
import Encrypt from '../../../src/encrypt/index.js'
import DoNotSetEncryptedFieldsDirectly from '../../../src/errors/DoNotSetEncryptedFieldsDirectly.js'
import Pet from '../../../test-app/app/models/Pet.js'
import StiBase from '../../../test-app/app/models/Sti/Base.js'
import User from '../../../test-app/app/models/User.js'
import processDynamicallyDefinedModels from '../../helpers/processDynamicallyDefinedModels.js'

describe('Dream#setAttribute', () => {
  it('writes the value as given, bypassing the custom setter', () => {
    const pet = Pet.new()
    pet.setAttribute('nickname', 'Jasper')
    expect(pet.nickname).toEqual('Jasper')
  })

  context('with an @Encrypted backing column', () => {
    it('accepts ciphertext the app can decrypt', () => {
      const ciphertext = User.new({ secret: 'copied secret' }).getAttribute('encryptedSecret')
      const user = User.new()

      user.setAttribute('encryptedSecret', ciphertext)

      expect(user.secret).toEqual('copied secret')
    })

    it('accepts ciphertext made with the legacy key', () => {
      const dreamApp = DreamApp.getOrFail()
      const originalEncryption = dreamApp.encryption
      const legacyKey = Encrypt.generateKey('aes-256-gcm')

      try {
        dreamApp.set('encryption', {
          columns: {
            current: { algorithm: 'aes-256-gcm', key: Encrypt.generateKey('aes-256-gcm') },
            legacy: { algorithm: 'aes-256-gcm', key: legacyKey },
          },
        })
        const legacyCiphertext = Encrypt.encrypt('old secret', { algorithm: 'aes-256-gcm', key: legacyKey })
        const user = User.new()

        user.setAttribute('encryptedSecret', legacyCiphertext)

        expect(user.secret).toEqual('old secret')
      } finally {
        dreamApp.set('encryption', originalEncryption)
      }
    })

    it('accepts null, clearing the column', () => {
      const user = User.new({ secret: 'original' })

      user.setAttribute('encryptedSecret', null)

      expect(user.secret).toBeNull()
    })

    it('rejects plaintext, leaving the column unchanged', () => {
      const user = User.new({ secret: 'original' })

      expect(() => user.setAttribute('encryptedSecret', 'plaintext')).toThrow(DoNotSetEncryptedFieldsDirectly)
      expect(user.secret).toEqual('original')
    })

    it('rejects plaintext for a backing column with a custom name', () => {
      const user = User.new()

      expect(() => user.setAttribute('myOtherEncryptedSecret', 'plaintext')).toThrow(
        DoNotSetEncryptedFieldsDirectly
      )
    })

    it('rejects ciphertext made with a key the app does not hold', () => {
      const foreignCiphertext = Encrypt.encrypt('foreign secret', {
        algorithm: 'aes-256-gcm',
        key: Encrypt.generateKey('aes-256-gcm'),
      })
      const user = User.new()

      expect(() => user.setAttribute('encryptedSecret', foreignCiphertext)).toThrow(
        DoNotSetEncryptedFieldsDirectly
      )
    })

    it('rejects undefined', () => {
      const user = User.new({ secret: 'original' })

      expect(() => user.setAttribute('encryptedSecret', undefined)).toThrow(DoNotSetEncryptedFieldsDirectly)
      expect(user.secret).toEqual('original')
    })

    it('rejects an unpacked ciphertext payload, which would be stored as JSON text that does not decrypt', () => {
      const ciphertext = User.new({ secret: 'shh' }).getAttribute('encryptedSecret')!
      const unpackedPayload = JSON.parse(Buffer.from(ciphertext, 'base64').toString()) as object
      const user = User.new()

      expect(() => user.setAttribute('encryptedSecret', unpackedPayload)).toThrow(
        DoNotSetEncryptedFieldsDirectly
      )
    })

    it('leaves the ordinary columns of the model unchecked', () => {
      const user = User.new()

      user.setAttribute('name', 'plaintext')

      expect(user.name).toEqual('plaintext')
    })

    it('rejects plaintext on an STI child for a backing column its STI parent declares', () => {
      const deco = new Decorators<typeof StiParentWithSecret>()
      class StiParentWithSecret extends StiBase {
        @deco.Encrypted()
        public secret: string | null
      }

      @STI(StiParentWithSecret)
      class StiChildWithInheritedSecret extends StiParentWithSecret {}

      processDynamicallyDefinedModels(StiParentWithSecret, StiChildWithInheritedSecret)
      const stiChild = StiChildWithInheritedSecret.new()

      expect(() => stiChild.setAttribute('encryptedSecret', 'plaintext')).toThrow(
        DoNotSetEncryptedFieldsDirectly
      )
    })
  })
})
