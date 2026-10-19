import Decorators from '../../../../src/decorators/Decorators.js'
import DreamApp, { EncryptionLegacyKeyUsedEvent } from '../../../../src/dream-app/index.js'
import Encrypt from '../../../../src/encrypt/index.js'
import { DateTime } from '../../../../src/utils/datetime/DateTime.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import User from '../../../../test-app/app/models/User.js'
import processDynamicallyDefinedModels from '../../../helpers/processDynamicallyDefinedModels.js'

describe('@Encrypted', () => {
  it('adds the decorated property to the defaultParamSafeColumns', () => {
    expect(User['defaultParamSafeColumns']()).toEqual(expect.arrayContaining(['secret', 'otherSecret']))
  })

  it('omits the corresponding column from the defaultParamSafeColumns', () => {
    expect(User['defaultParamSafeColumns']()).not.toEqual(
      expect.arrayContaining(['encryptedSecret', 'myOtherEncryptedSecret'])
    )
  })

  it('persists to and restores the encrypted value from the database, leaving the attribute corresponding to the decorated property name undefined', async () => {
    const user = await User.create({ secret: 'Howdy world', email: 'a@b.com', password: 's3cr3t!' })
    const reloadedUser = await User.findOrFail(user.id)
    expect(reloadedUser.secret).toEqual('Howdy world')

    const attributes = user.getAttributes()
    expect(attributes['secret' as keyof typeof attributes]).toBeUndefined()
  })

  it("adds the encrypted columns to the Dream class's virtualAttributes with nullability based on the backing column", () => {
    expect(User['virtualAttributes']).toEqual(
      expect.arrayContaining([{ property: 'secret', type: ['string', 'null'] }])
    )
  })

  it("adds a declared openapi shape to the Dream class's virtualAttributes in place of the string default", () => {
    expect(User['virtualAttributes']).toEqual(
      expect.arrayContaining([
        {
          property: 'otherSecret',
          type: { type: ['object', 'null'], properties: { token: 'string' }, required: ['token'] },
        },
      ])
    )
  })

  it("adds each backing column to the Dream class's encryptedAttributes", () => {
    expect(User['encryptedAttributes']).toEqual(
      expect.arrayContaining([
        { property: 'secret', encryptedColumnName: 'encryptedSecret' },
        { property: 'otherSecret', encryptedColumnName: 'myOtherEncryptedSecret' },
      ])
    )
  })

  context('reading a value that only the legacy column key opens', () => {
    it('fires encryption:legacy-key-used with the record, the property and its backing column', async () => {
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
      const listener = vi.fn()
      dreamApp.on('encryption:legacy-key-used', listener)

      const reloadedUser = await User.findOrFail(user.id)
      expect(listener).not.toHaveBeenCalled()

      expect(reloadedUser.secret).toEqual('Howdy world')
      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith({
        dream: reloadedUser,
        property: 'secret',
        encryptedColumnName: 'encryptedSecret',
      })
    })

    it('fires again on every later read of the property', async () => {
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
      const listener = vi.fn()
      dreamApp.on('encryption:legacy-key-used', listener)

      expect(user.secret).toEqual('Howdy world')
      expect(user.secret).toEqual('Howdy world')
      expect(listener).toHaveBeenCalledTimes(2)
    })

    it('returns the value to a listener that reassigns the property, without firing again, and the reassignment re-encrypts it under the current key', async () => {
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
      const listener = vi.fn(({ dream, property }: EncryptionLegacyKeyUsedEvent) => {
        const record = dream as unknown as Record<string, unknown>
        const value = record[property]
        record[property] = value
      })
      dreamApp.on('encryption:legacy-key-used', listener)

      const reloadedUser = await User.findOrFail(user.id)
      expect(reloadedUser.secret).toEqual('Howdy world')
      expect(listener).toHaveBeenCalledTimes(1)

      expect(reloadedUser.secret).toEqual('Howdy world')
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('fires again for a listener that reads the property after an await, since the guard covers only its synchronous run', async () => {
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
      let readsAfterAwait = 0
      const listener = vi.fn(async ({ dream, property }: EncryptionLegacyKeyUsedEvent) => {
        await Promise.resolve()
        // each read here fires the event again, so the reads are bounded
        if (readsAfterAwait++ < 2) void (dream as unknown as Record<string, unknown>)[property]
      })
      dreamApp.on('encryption:legacy-key-used', listener)

      expect(user.secret).toEqual('Howdy world')
      expect(listener).toHaveBeenCalledTimes(1)

      await new Promise(resolve => setTimeout(resolve, 0))
      expect(listener).toHaveBeenCalledTimes(3)
    })

    it('fires for another record whose property a listener reads', async () => {
      const oldKey = Encrypt.generateKey('aes-256-gcm')
      const newKey = Encrypt.generateKey('aes-256-gcm')
      const dreamApp = DreamApp.getOrFail()
      dreamApp.set('encryption', { columns: { current: { algorithm: 'aes-256-gcm', key: oldKey } } })
      const user = await User.create({ secret: 'Howdy world', email: 'a@b.com', password: 's3cr3t!' })
      const otherUser = await User.create({ secret: 'Howdy moon', email: 'c@d.com', password: 's3cr3t!' })
      dreamApp.set('encryption', {
        columns: {
          current: { algorithm: 'aes-256-gcm', key: newKey },
          legacy: { algorithm: 'aes-256-gcm', key: oldKey },
        },
      })
      const readValues: unknown[] = []
      const listener = vi.fn(({ dream }: EncryptionLegacyKeyUsedEvent) => {
        if (dream === user) readValues.push(otherUser.secret)
      })
      dreamApp.on('encryption:legacy-key-used', listener)

      expect(user.secret).toEqual('Howdy world')
      expect(readValues).toEqual(['Howdy moon'])
      expect(listener.mock.calls.map(([event]) => event.dream)).toEqual([user, otherUser])
    })

    it('fires again on a later read after a listener throws', async () => {
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
      const listener = vi.fn().mockImplementationOnce(() => {
        throw new Error('legacy key used')
      })
      dreamApp.on('encryption:legacy-key-used', listener)

      expect(() => user.secret).toThrow('legacy key used')
      expect(user.secret).toEqual('Howdy world')
      expect(listener).toHaveBeenCalledTimes(2)
    })

    it('leaves the record dirty when the value is assigned back, and saving rewrites it under the current key', async () => {
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

      const reloadedUser = await User.findOrFail(user.id)
      const secret = reloadedUser.secret
      reloadedUser.secret = secret
      expect(reloadedUser.isDirty).toBe(true)
      expect(Object.keys(reloadedUser.dirtyAttributes())).toEqual(['encryptedSecret'])
      await reloadedUser.save()

      dreamApp.set('encryption', { columns: { current: { algorithm: 'aes-256-gcm', key: newKey } } })
      expect((await User.findOrFail(user.id)).secret).toEqual('Howdy world')
    })

    it('leaves the record dirty when a listener assigns the value back, and saving rewrites it under the current key', async () => {
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
      dreamApp.on('encryption:legacy-key-used', ({ dream, property }: EncryptionLegacyKeyUsedEvent) => {
        const record = dream as unknown as Record<string, unknown>
        const value = record[property]
        record[property] = value
      })

      const reloadedUser = await User.findOrFail(user.id)
      expect(reloadedUser.secret).toEqual('Howdy world')
      expect(reloadedUser.isDirty).toBe(true)
      await reloadedUser.save()

      dreamApp.set('encryption', { columns: { current: { algorithm: 'aes-256-gcm', key: newKey } } })
      expect((await User.findOrFail(user.id)).secret).toEqual('Howdy world')
    })
  })

  context('reading a value that the current column key opens', () => {
    it('does not fire encryption:legacy-key-used', async () => {
      const dreamApp = DreamApp.getOrFail()
      dreamApp.set('encryption', {
        columns: {
          current: { algorithm: 'aes-256-gcm', key: Encrypt.generateKey('aes-256-gcm') },
          legacy: { algorithm: 'aes-256-gcm', key: Encrypt.generateKey('aes-256-gcm') },
        },
      })
      const listener = vi.fn()
      dreamApp.on('encryption:legacy-key-used', listener)
      const user = await User.create({ secret: 'Howdy world', email: 'a@b.com', password: 's3cr3t!' })

      const reloadedUser = await User.findOrFail(user.id)
      expect(reloadedUser.secret).toEqual('Howdy world')
      expect(listener).not.toHaveBeenCalled()
    })
  })

  context('assigning a persisted record the plaintext its encrypted property already holds', () => {
    it('leaves a loaded record clean, and saving it neither writes the row nor records a saved change', async () => {
      const updatedAt = DateTime.now().minus({ day: 1 })
      const user = await User.create({
        secret: 'Howdy world',
        email: 'a@b.com',
        password: 's3cr3t!',
        updatedAt,
      })
      const reloadedUser = await User.findOrFail(user.id)
      const storedCiphertext = reloadedUser.getAttribute('encryptedSecret')

      reloadedUser.secret = 'Howdy world'
      expect(reloadedUser.isDirty).toBe(false)
      expect(reloadedUser.dirtyAttributes()).toEqual({})
      expect(reloadedUser.changes()).toEqual({})

      await reloadedUser.save()
      expect(reloadedUser.savedChangeToAttribute('encryptedSecret')).toBe(false)
      const userAfterSave = await User.findOrFail(user.id)
      expect(userAfterSave.getAttribute('encryptedSecret')).toEqual(storedCiphertext)
      expect(userAfterSave.updatedAt.toISO()).toEqual(updatedAt.toISO())
    })

    it('leaves a record clean after the create that saved the value, and the save that follows keeps reporting the create as the saved change', async () => {
      const updatedAt = DateTime.now().minus({ day: 1 })
      const user = await User.create({
        secret: 'Howdy world',
        email: 'a@b.com',
        password: 's3cr3t!',
        updatedAt,
      })
      const storedCiphertext = user.getAttribute('encryptedSecret')

      user.secret = 'Howdy world'
      expect(user.isDirty).toBe(false)
      expect(user.dirtyAttributes()).toEqual({})
      expect(user.changes().encryptedSecret).toEqual({ was: undefined, now: storedCiphertext })

      await user.save()
      expect(user.savedChangeToAttribute('encryptedSecret')).toBe(true)
      const userAfterSave = await User.findOrFail(user.id)
      expect(userAfterSave.getAttribute('encryptedSecret')).toEqual(storedCiphertext)
      expect(userAfterSave.updatedAt.toISO()).toEqual(updatedAt.toISO())
    })

    it('leaves the record clean when the property is assigned a different plaintext and then its original one', async () => {
      const user = await User.create({ secret: 'Howdy world', email: 'a@b.com', password: 's3cr3t!' })
      const reloadedUser = await User.findOrFail(user.id)
      const storedCiphertext = reloadedUser.getAttribute('encryptedSecret')

      reloadedUser.secret = 'Howdy moon'
      expect(reloadedUser.isDirty).toBe(true)
      reloadedUser.secret = 'Howdy world'
      expect(reloadedUser.isDirty).toBe(false)
      expect(reloadedUser.getAttribute('encryptedSecret')).toEqual(storedCiphertext)
    })

    it('runs no after-save, after-update, commit, or ifChanging/ifChanged hooks when the record is saved', async () => {
      const hooksRun: string[] = []
      const deco = new Decorators<typeof UserWithSecretHooks>()
      class UserWithSecretHooks extends ApplicationModel {
        public override get table() {
          return 'users' as const
        }

        @deco.Encrypted()
        public secret: string

        @deco.BeforeUpdate({ ifChanging: ['encryptedSecret'] })
        public beforeUpdateIfChanging() {
          hooksRun.push('beforeUpdateIfChanging')
        }

        @deco.AfterSave()
        public afterSave() {
          hooksRun.push('afterSave')
        }

        @deco.AfterUpdate()
        public afterUpdate() {
          hooksRun.push('afterUpdate')
        }

        @deco.AfterUpdate({ ifChanged: ['encryptedSecret'] })
        public afterUpdateIfChanged() {
          hooksRun.push('afterUpdateIfChanged')
        }

        @deco.AfterSaveCommit()
        public afterSaveCommit() {
          hooksRun.push('afterSaveCommit')
        }

        @deco.AfterUpdateCommit()
        public afterUpdateCommit() {
          hooksRun.push('afterUpdateCommit')
        }
      }
      UserWithSecretHooks['defineAttributeAccessors']()
      processDynamicallyDefinedModels(UserWithSecretHooks)
      const user = await User.create({ secret: 'Howdy world', email: 'a@b.com', password: 's3cr3t!' })
      const userWithSecretHooks = await UserWithSecretHooks.findOrFail(user.id)

      userWithSecretHooks.secret = 'Howdy world'
      await userWithSecretHooks.save()
      expect(hooksRun).toEqual([])

      userWithSecretHooks.secret = 'Howdy moon'
      await userWithSecretHooks.save()
      expect(hooksRun.sort()).toEqual(
        [
          'afterSave',
          'afterSaveCommit',
          'afterUpdate',
          'afterUpdateCommit',
          'afterUpdateIfChanged',
          'beforeUpdateIfChanging',
        ].sort()
      )
    })
  })

  context('assigning a persisted record a different plaintext', () => {
    it('marks the record dirty and saves the new value, including an array that differs only in a falsy element', async () => {
      const deco = new Decorators<typeof UserWithJsonSecret>()
      class UserWithJsonSecret extends ApplicationModel {
        public override get table() {
          return 'users' as const
        }

        @deco.Encrypted({ openapi: 'json' })
        public secret: unknown
      }
      UserWithJsonSecret['defineAttributeAccessors']()
      processDynamicallyDefinedModels(UserWithJsonSecret)
      const user = await User.create({ email: 'a@b.com', password: 's3cr3t!' })

      for (const [original, changed] of [
        [[0], [1]],
        [[false], [true]],
        ['Howdy world', 'Howdy moon'],
      ]) {
        const userWithJsonSecret = await UserWithJsonSecret.findOrFail(user.id)
        await userWithJsonSecret.update({ secret: original })

        const reloadedUser = await UserWithJsonSecret.findOrFail(user.id)
        reloadedUser.secret = changed
        expect(reloadedUser.isDirty).toBe(true)
        expect(Object.keys(reloadedUser.dirtyAttributes())).toEqual(['encryptedSecret'])
        await reloadedUser.save()

        expect((await UserWithJsonSecret.findOrFail(user.id)).secret).toEqual(changed)
      }
    })
  })

  context('with no arguments', () => {
    it('uses the word "encrypted" in front of the pascalized method name', () => {
      const user = User.new()
      user.secret = 'shh!'
      expect(user.secret).toEqual('shh!')
      expect(user.getAttribute('encryptedSecret')).not.toEqual('shh!')
      expect(typeof user.getAttribute('encryptedSecret')).toEqual('string')
    })
  })

  context('with a column provided in the options', () => {
    it('uses the provided column as the encryptedColumnName', () => {
      const user = User.new()
      user.otherSecret = { token: 'SHH!' }
      expect(user.otherSecret).toEqual({ token: 'SHH!' })
      expect(user.getAttribute('myOtherEncryptedSecret')).not.toEqual({ token: 'SHH!' })
      expect(typeof user.getAttribute('myOtherEncryptedSecret')).toEqual('string')
    })
  })

  context('with a column name string', () => {
    it('uses the provided column as the encryptedColumnName and registers the property as a string', () => {
      const deco = new Decorators<typeof UserWithColumnNameString>()
      class UserWithColumnNameString extends ApplicationModel {
        public override get table() {
          return 'users' as const
        }

        @deco.Encrypted('myOtherEncryptedSecret')
        public otherSecret: string
      }
      processDynamicallyDefinedModels(UserWithColumnNameString)

      expect(UserWithColumnNameString['encryptedAttributes']).toEqual([
        { property: 'otherSecret', encryptedColumnName: 'myOtherEncryptedSecret' },
      ])
      expect(UserWithColumnNameString['virtualAttributes']).toEqual([
        { property: 'otherSecret', type: ['string', 'null'] },
      ])

      const user = UserWithColumnNameString.new()
      user.otherSecret = 'shh!'
      expect(user.otherSecret).toEqual('shh!')
      expect(user.getAttribute('myOtherEncryptedSecret')).not.toEqual('shh!')
      expect(typeof user.getAttribute('myOtherEncryptedSecret')).toEqual('string')
    })
  })

  context('with an openapi shape and no column', () => {
    it('uses the word "encrypted" in front of the pascalized method name and registers the shape without adding null from the backing column', () => {
      const deco = new Decorators<typeof UserWithJsonSecret>()
      class UserWithJsonSecret extends ApplicationModel {
        public override get table() {
          return 'users' as const
        }

        @deco.Encrypted({ openapi: 'json' })
        public secret: unknown
      }
      processDynamicallyDefinedModels(UserWithJsonSecret)

      expect(UserWithJsonSecret['encryptedAttributes']).toEqual([
        { property: 'secret', encryptedColumnName: 'encryptedSecret' },
      ])
      expect(UserWithJsonSecret['virtualAttributes']).toEqual([{ property: 'secret', type: 'json' }])
    })
  })
})
