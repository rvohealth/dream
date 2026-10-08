import DreamApp, { DreamHookEventType } from '../../../src/dream-app/index.js'
import Encrypt from '../../../src/encrypt/index.js'
import User from '../../../test-app/app/models/User.js'

describe('DreamApp hooks', () => {
  function expectHookCalled(hookEventType: DreamHookEventType) {
    expect((process.env as any).__DREAM_HOOKS_TEST_CACHE.split(',')).toEqual(
      expect.arrayContaining([hookEventType])
    )
  }

  it('calls callback associated with db:log', () => {
    expectHookCalled('db:log')
  })

  context('encryption:legacy-key-used', () => {
    it('calls every registered callback, in registration order, when reading an @Encrypted property needs the legacy key', async () => {
      const oldKey = Encrypt.generateKey('aes-256-gcm')
      const newKey = Encrypt.generateKey('aes-256-gcm')
      const dreamApp = DreamApp.getOrFail()
      dreamApp.set('encryption', { columns: { current: { algorithm: 'aes-256-gcm', key: oldKey } } })
      const user = await User.create({ secret: 'Howdy world', email: 'a@b.com', password: 's3cr3t!' })
      dreamApp.set('encryption', {
        columns: {
          current: { algorithm: 'aes-256-gcm', key: newKey },
          legacy: { algorithm: 'aes-256-gcm', key: oldKey },
        },
      })
      const calls: string[] = []
      dreamApp.on('encryption:legacy-key-used', () => {
        calls.push('first')
      })
      dreamApp.on('encryption:legacy-key-used', () => {
        calls.push('second')
      })

      expect(user.secret).toEqual('Howdy world')
      expect(calls).toEqual(['first', 'second'])
    })

    it('lets an error a callback throws propagate from the property read', async () => {
      const oldKey = Encrypt.generateKey('aes-256-gcm')
      const newKey = Encrypt.generateKey('aes-256-gcm')
      const dreamApp = DreamApp.getOrFail()
      dreamApp.set('encryption', { columns: { current: { algorithm: 'aes-256-gcm', key: oldKey } } })
      const user = await User.create({ secret: 'Howdy world', email: 'a@b.com', password: 's3cr3t!' })
      dreamApp.set('encryption', {
        columns: {
          current: { algorithm: 'aes-256-gcm', key: newKey },
          legacy: { algorithm: 'aes-256-gcm', key: oldKey },
        },
      })
      dreamApp.on('encryption:legacy-key-used', () => {
        throw new Error('legacy key used')
      })

      expect(() => user.secret).toThrow('legacy key used')
    })

    it('is not called when setAttribute accepts legacy-key ciphertext for a backing column', () => {
      const oldKey = Encrypt.generateKey('aes-256-gcm')
      const dreamApp = DreamApp.getOrFail()
      dreamApp.set('encryption', {
        columns: {
          current: { algorithm: 'aes-256-gcm', key: Encrypt.generateKey('aes-256-gcm') },
          legacy: { algorithm: 'aes-256-gcm', key: oldKey },
        },
      })
      const listener = vi.fn()
      dreamApp.on('encryption:legacy-key-used', listener)
      const user = User.new()

      user.setAttribute('encryptedSecret', Encrypt.encrypt('shh!', { algorithm: 'aes-256-gcm', key: oldKey }))

      expect(listener).not.toHaveBeenCalled()
    })
  })
})
