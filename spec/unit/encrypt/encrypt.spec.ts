import Encrypt, { EncryptOptions } from '../../../src/encrypt'
import MissingEncryptionKey from '../../../src/exceptions/encrypt/missing-encryption-key'

const encryptionOptions: EncryptOptions[] = [
  { algorithm: 'aes-256-gcm', key: '65ogKxacRKyNxj20PCQKuBnxKgOty5eQnY4Ktbk04U0=' },
  { algorithm: 'aes-192-gcm', key: 'vqLHveiMB85Fq1uM8aqTMcPDXhPxEx0X' },
  { algorithm: 'aes-128-gcm', key: 'UXXA1fMDefJV7Y2s/vqm1g==' },
]

describe('Encrypt', () => {
  describe('#encrypt, #decrypt', () => {
    function expectCanEncryptAndDecryptValue(val: any, opts: EncryptOptions) {
      const value = Encrypt.encrypt(val, opts)
      expect(value).not.toEqual(val)
      expect(Encrypt.decrypt(value as any, opts)).toEqual(val)
    }

    encryptionOptions.forEach(opts => {
      context(`algorithm: ${opts.algorithm}`, () => {
        it('can encrypt and decrypt object values', () => {
          expectCanEncryptAndDecryptValue({ name: 'chalupas johnson', workType: 'miracles' }, opts)
        })

        it('can encrypt and decrypt string values', () => {
          expectCanEncryptAndDecryptValue('howyadoin', opts)
        })

        it('can encrypt and decrypt boolean values', () => {
          expectCanEncryptAndDecryptValue(true, opts)
          expectCanEncryptAndDecryptValue(false, opts)
        })

        it('can encrypt and decrypt numeric values', () => {
          expectCanEncryptAndDecryptValue(1, opts)
          expectCanEncryptAndDecryptValue(1.1111, opts)
        })

        it('can encrypt null', () => {
          expectCanEncryptAndDecryptValue(null, opts)
        })

        it('can encrypt and decrypt an array of values', () => {
          expectCanEncryptAndDecryptValue([1, 'hi', true], opts)
        })

        context('with no encryption key set', () => {
          it('raises a targeted exception', () => {
            expect(() => Encrypt.encrypt('how', { ...opts, key: null as any })).toThrow(MissingEncryptionKey)
          })
        })
      })
    })
  })

  describe('#generateKey', () => {
    context('algorithm: aes-256-gcm', () => {
      it('generates a 32-bit, base64-encoded string', () => {
        const res = Encrypt.generateKey('aes-256-gcm')
        expect(Buffer.from(res, 'base64').length).toEqual(32)
      })
    })

    context('algorithm: aes-192-gcm', () => {
      it('generates a 24-bit, base64-encoded string', () => {
        const res = Encrypt.generateKey('aes-192-gcm')
        expect(Buffer.from(res, 'base64').length).toEqual(24)
      })
    })

    context('algorithm: aes-128-gcm', () => {
      it('generates a 16-bit, base64-encoded string', () => {
        const res = Encrypt.generateKey('aes-128-gcm')
        expect(Buffer.from(res, 'base64').length).toEqual(16)
      })
    })
  })

  describe('#validateKey', () => {
    context('algorithm: aes-256-gcm', () => {
      it('returns true for a 32-bit, base64-encoded string', () => {
        const res = Encrypt.generateKey('aes-256-gcm')
        expect(Encrypt.validateKey(res, 'aes-256-gcm')).toEqual(true)
      })

      context('with a different key length specified', () => {
        it('returns false', () => {
          const incorrectLengthKey = '65ogKxacRKyNxj20PCQKuBnxKgO='
          expect(Encrypt.validateKey(incorrectLengthKey, 'aes-256-gcm')).toEqual(false)
        })
      })
    })

    context('algorithm: aes-192-gcm', () => {
      it('returns true for a 24-bit, base64-encoded string', () => {
        const res = Encrypt.generateKey('aes-192-gcm')
        expect(Encrypt.validateKey(res, 'aes-192-gcm')).toEqual(true)
      })

      context('with a different key length specified', () => {
        it('returns false', () => {
          const incorrectLengthKey = 'ogKxacRKyNxj20PCQKuBnxKgO='
          expect(Encrypt.validateKey(incorrectLengthKey, 'aes-192-gcm')).toEqual(false)
        })
      })
    })

    context('algorithm: aes-128-gcm', () => {
      it('returns true for a 24-bit, base64-encoded string', () => {
        const res = Encrypt.generateKey('aes-128-gcm')
        expect(Encrypt.validateKey(res, 'aes-128-gcm')).toEqual(true)
      })

      context('with a different key length specified', () => {
        it('returns false', () => {
          const incorrectLengthKey = 'XA1fMDefJV7Y2s/vqm1g=='
          expect(Encrypt.validateKey(incorrectLengthKey, 'aes-128-gcm')).toEqual(false)
        })
      })
    })
  })
})
