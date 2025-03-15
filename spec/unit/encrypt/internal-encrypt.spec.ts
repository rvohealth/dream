import Encrypt from '../../../src/encrypt/index.js'
import InternalEncrypt from '../../../src/encrypt/InternalEncrypt.js'
import initializeDreamApplication from '../../../test-app/cli/helpers/initializeDreamApplication.js'

describe('InternalEncrypt', () => {
  describe('#encryptColumn, #decryptColumn', () => {
    let originalEncryptionKey: string

    beforeEach(async () => {
      originalEncryptionKey = process.env.APP_ENCRYPTION_KEY!
      await initializeDreamApplication()
    })

    afterEach(async () => {
      originalEncryptionKey === undefined
        ? delete process.env.APP_ENCRYPTION_KEY
        : (process.env.APP_ENCRYPTION_KEY = originalEncryptionKey)
      await initializeDreamApplication()
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
  })
})
