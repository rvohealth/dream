import DreamApp from '../../../src/dream-app/index.js'
import Encrypt from '../../../src/encrypt/index.js'
import InternalEncrypt from '../../../src/encrypt/InternalEncrypt.js'
import initializeDreamApp from '../../../test-app/cli/helpers/initializeDreamApp.js'

describe('InternalEncrypt', () => {
  describe('#encryptColumn, #decryptColumn', () => {
    let originalEncryptionKey: string

    beforeEach(async () => {
      originalEncryptionKey = process.env.APP_ENCRYPTION_KEY!
      await initializeDreamApp()
    })

    afterEach(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      originalEncryptionKey === undefined
        ? delete process.env.APP_ENCRYPTION_KEY
        : (process.env.APP_ENCRYPTION_KEY = originalEncryptionKey)
      await initializeDreamApp()
    })

    context('when current encryption key is valid', () => {
      it('uses the current encryption key to parse the data', () => {
        const val = InternalEncrypt.encryptColumn('howyadoin')
        const decrypted = InternalEncrypt.decryptColumn(val)
        expect(decrypted).toEqual('howyadoin')
      })

      context('when provided null as an argument', () => {
        it('does not encrypt null', () => {
          expect(InternalEncrypt.encryptColumn(null)).toBeNull()
          expect(InternalEncrypt.decryptColumn(null)).toBeNull()
        })
      })

      context('when provided undefined as an argument', () => {
        it('does not encrypt null', () => {
          expect(InternalEncrypt.encryptColumn(undefined)).toBeNull()
          expect(InternalEncrypt.decryptColumn(undefined)).toBeNull()
        })
      })

      it('when the value was encrypted using the legacy encryption key', () => {
        const val = Encrypt.encrypt('howyadoin', {
          algorithm: 'aes-256-gcm',
          key: process.env.LEGACY_APP_ENCRYPTION_KEY!,
        })
        const decrypted = InternalEncrypt.decryptColumn(val)
        expect(decrypted).toEqual('howyadoin')
      })
    })

    context('with an onLegacyKeyUsed callback', () => {
      it('calls it when the legacy column key opened the value', () => {
        const oldKey = Encrypt.generateKey('aes-256-gcm')
        const newKey = Encrypt.generateKey('aes-256-gcm')
        DreamApp.getOrFail().set('encryption', {
          columns: {
            current: { algorithm: 'aes-256-gcm', key: newKey },
            legacy: { algorithm: 'aes-256-gcm', key: oldKey },
          },
        })
        const val = Encrypt.encrypt('howyadoin', { algorithm: 'aes-256-gcm', key: oldKey })
        const onLegacyKeyUsed = vi.fn()

        expect(InternalEncrypt.decryptColumn(val, { onLegacyKeyUsed })).toEqual('howyadoin')
        expect(onLegacyKeyUsed).toHaveBeenCalledTimes(1)
      })

      it('does not call it when the current column key opened the value', () => {
        const oldKey = Encrypt.generateKey('aes-256-gcm')
        const newKey = Encrypt.generateKey('aes-256-gcm')
        DreamApp.getOrFail().set('encryption', {
          columns: {
            current: { algorithm: 'aes-256-gcm', key: newKey },
            legacy: { algorithm: 'aes-256-gcm', key: oldKey },
          },
        })
        const val = InternalEncrypt.encryptColumn('howyadoin')
        const onLegacyKeyUsed = vi.fn()

        expect(InternalEncrypt.decryptColumn(val, { onLegacyKeyUsed })).toEqual('howyadoin')
        expect(onLegacyKeyUsed).not.toHaveBeenCalled()
      })
    })
  })
})
