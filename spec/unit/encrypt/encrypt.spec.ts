import * as crypto from 'crypto'
import Encrypt, { EncryptOptions } from '../../../src/encrypt/index.js'
import DecryptionError from '../../../src/errors/encrypt/DecryptionError.js'
import DecryptionParseError from '../../../src/errors/encrypt/DecryptionParseError.js'
import DecryptionWithRotationError from '../../../src/errors/encrypt/DecryptionWithRotationError.js'
import MissingEncryptionKey from '../../../src/errors/encrypt/MissingEncryptionKey.js'

const encryptionOptions = [
  {
    algorithm: 'aes-256-gcm',
    key: '65ogKxacRKyNxj20PCQKuBnxKgOty5eQnY4Ktbk04U0=',
    legacyKey: 'we7Ut3wRljXChrAqW673pjjYr0HN0yIJYtGrR2y7rDc=',
  },
  {
    algorithm: 'aes-192-gcm',
    key: 'vqLHveiMB85Fq1uM8aqTMcPDXhPxEx0X',
    legacyKey: 'kNeLgDf1HdXCqmmkrJgVZESCW5oIl7UG',
  },
  { algorithm: 'aes-128-gcm', key: 'UXXA1fMDefJV7Y2s/vqm1g==', legacyKey: 'p4cTGaKtF26diZ3ECdQoqw==' },
] as const

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

        context('with the wrong encryption key', () => {
          it('throws DecryptionError', () => {
            const encrypted = Encrypt.encrypt('how', { ...opts, key: opts.legacyKey })
            expect(() => Encrypt.decrypt(encrypted, { ...opts })).toThrow(DecryptionError)
          })
        })

        context('with a legacy key provided', () => {
          context('the legacy key is valid', () => {
            it('decrypts value using legacy key', () => {
              const encrypted = Encrypt.encrypt('howyadoin', {
                algorithm: opts.algorithm,
                key: opts.legacyKey,
              })
              const decrypted = Encrypt.decrypt(
                encrypted,
                {
                  algorithm: opts.algorithm,
                  key: opts.key,
                },
                {
                  algorithm: opts.algorithm,
                  key: opts.legacyKey,
                }
              )
              expect(decrypted).toEqual('howyadoin')
            })
          })

          context('the legacy key is invalid', () => {
            it('throws DecryptionWithRotationError', () => {
              const encrypted = Encrypt.encrypt('howyadoin', {
                algorithm: opts.algorithm,
                key: opts.legacyKey,
              })
              expect(() =>
                Encrypt.decrypt(
                  encrypted,
                  {
                    algorithm: opts.algorithm,
                    key: opts.key,
                  },
                  {
                    algorithm: opts.algorithm,
                    key: opts.key,
                  }
                )
              ).toThrow(DecryptionWithRotationError)
            })
          })
        })
      })
    })

    context('targeted error cases (R-019)', () => {
      const ALG = 'aes-256-gcm' as const
      const KEY_A = '65ogKxacRKyNxj20PCQKuBnxKgOty5eQnY4Ktbk04U0='
      const KEY_B = 'we7Ut3wRljXChrAqW673pjjYr0HN0yIJYtGrR2y7rDc='
      const KEY_C = 'pT2EzN3OQ7m5UKt3xb88h7y0FOq8jwaIJp/yCZGdLM4='

      describe('two-arg form', () => {
        it('returns null on null input', () => {
          expect(Encrypt.decrypt(null as unknown as string, { algorithm: ALG, key: KEY_A })).toBeNull()
        })

        it('returns null on undefined input', () => {
          expect(Encrypt.decrypt(undefined as unknown as string, { algorithm: ALG, key: KEY_A })).toBeNull()
        })

        it('throws MissingEncryptionKey when the key is missing', () => {
          expect(() =>
            Encrypt.decrypt('anything', { algorithm: ALG, key: null as unknown as string })
          ).toThrow(MissingEncryptionKey)
        })

        it('throws DecryptionError on tampered ciphertext', () => {
          const encrypted = Encrypt.encrypt('howyadoin', { algorithm: ALG, key: KEY_A })
          // flip a base64 char in the ciphertext payload to corrupt the auth tag
          const tampered = encrypted.replace(/.$/, c => (c === 'A' ? 'B' : 'A'))
          expect(() => Encrypt.decrypt(tampered, { algorithm: ALG, key: KEY_A })).toThrow(DecryptionError)
        })

        it('throws DecryptionError when decrypting with the wrong key', () => {
          const encrypted = Encrypt.encrypt('howyadoin', { algorithm: ALG, key: KEY_A })
          expect(() => Encrypt.decrypt(encrypted, { algorithm: ALG, key: KEY_B })).toThrow(DecryptionError)
        })

        it('throws DecryptionError on a malformed payload', () => {
          expect(() => Encrypt.decrypt('not-a-valid-payload', { algorithm: ALG, key: KEY_A })).toThrow(
            DecryptionError
          )
        })

        it('throws DecryptionParseError when plaintext decrypts cleanly but is not JSON', () => {
          // Hand-craft a payload whose plaintext is the raw string `not json` (no JSON.stringify wrapping).
          const iv = crypto.randomBytes(12)
          const cipher = crypto.createCipheriv(ALG, Buffer.from(KEY_A, 'base64'), iv)
          const ciphertext = Buffer.concat([cipher.update('not json', 'utf8'), cipher.final()])
          const tag = cipher.getAuthTag()
          const payload = Buffer.from(
            JSON.stringify({
              ciphertext: ciphertext.toString('base64'),
              tag: tag.toString('base64'),
              iv: iv.toString('base64'),
            })
          ).toString('base64')

          expect(() => Encrypt.decrypt(payload, { algorithm: ALG, key: KEY_A })).toThrow(DecryptionParseError)
        })
      })

      describe('three-arg form (rotation)', () => {
        it('returns the value when the current key succeeds', () => {
          const encrypted = Encrypt.encrypt('howyadoin', { algorithm: ALG, key: KEY_A })
          const decrypted = Encrypt.decrypt(
            encrypted,
            { algorithm: ALG, key: KEY_A },
            { algorithm: ALG, key: KEY_B }
          )
          expect(decrypted).toEqual('howyadoin')
        })

        it('returns the value when the current key fails and the legacy key succeeds', () => {
          const encrypted = Encrypt.encrypt('howyadoin', { algorithm: ALG, key: KEY_A })
          const decrypted = Encrypt.decrypt(
            encrypted,
            { algorithm: ALG, key: KEY_B },
            { algorithm: ALG, key: KEY_A }
          )
          expect(decrypted).toEqual('howyadoin')
        })

        it('throws DecryptionWithRotationError when both keys fail', () => {
          const encrypted = Encrypt.encrypt('howyadoin', { algorithm: ALG, key: KEY_A })
          let caught: unknown
          try {
            Encrypt.decrypt(encrypted, { algorithm: ALG, key: KEY_B }, { algorithm: ALG, key: KEY_C })
          } catch (err) {
            caught = err
          }
          expect(caught).toBeInstanceOf(DecryptionWithRotationError)
          const rotErr = caught as DecryptionWithRotationError
          expect(rotErr.currentKeyError).toBeInstanceOf(DecryptionError)
          expect(rotErr.legacyKeyError).toBeInstanceOf(DecryptionError)
        })

        it('does not retry the legacy key when current decrypts but plaintext is not JSON', () => {
          // Hand-craft a payload whose plaintext (under KEY_A) is the raw string `not json`.
          const iv = crypto.randomBytes(12)
          const cipher = crypto.createCipheriv(ALG, Buffer.from(KEY_A, 'base64'), iv)
          const ciphertext = Buffer.concat([cipher.update('not json', 'utf8'), cipher.final()])
          const tag = cipher.getAuthTag()
          const payload = Buffer.from(
            JSON.stringify({
              ciphertext: ciphertext.toString('base64'),
              tag: tag.toString('base64'),
              iv: iv.toString('base64'),
            })
          ).toString('base64')

          expect(() =>
            Encrypt.decrypt(payload, { algorithm: ALG, key: KEY_A }, { algorithm: ALG, key: KEY_B })
          ).toThrow(DecryptionParseError)
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
