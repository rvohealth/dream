import DreamApp from '../../../src/dream-app/index.js'
import Dream from '../../../src/Dream.js'
import Encrypt, { EncryptOptions } from '../../../src/encrypt/index.js'
import DecryptionError from '../../../src/errors/encrypt/DecryptionError.js'
import DecryptionRotationError from '../../../src/errors/encrypt/DecryptionRotationError.js'
import Chore from '../../../test-app/app/models/Polymorphic/Chore.js'
import Pet from '../../../test-app/app/models/Pet.js'
import StiA from '../../../test-app/app/models/Sti/A.js'
import StiBase from '../../../test-app/app/models/Sti/Base.js'
import User from '../../../test-app/app/models/User.js'
import db from '../../../test-app/db/index.js'

describe('Dream.reencryptEncryptedColumns', () => {
  const oldKey: EncryptOptions = { algorithm: 'aes-256-gcm', key: Encrypt.generateKey('aes-256-gcm') }
  const newKey: EncryptOptions = { algorithm: 'aes-256-gcm', key: Encrypt.generateKey('aes-256-gcm') }
  let originalEncryption: DreamApp['encryption']

  beforeEach(() => {
    originalEncryption = DreamApp.getOrFail().encryption
    DreamApp.getOrFail().set('encryption', { columns: { current: newKey, legacy: oldKey } })
  })

  afterEach(() => {
    DreamApp.getOrFail().set('encryption', originalEncryption!)
  })

  function dropLegacyKey() {
    DreamApp.getOrFail().set('encryption', { columns: { current: newKey } })
  }

  async function createUser(email: string) {
    return await User.create({ email, password: 'howyadoin' })
  }

  async function writeCiphertext(user: User, columns: Record<string, string | null>) {
    await db('default', 'primary').updateTable('users').set(columns).where('id', '=', user.id).execute()
  }

  it('encrypts every value of the model’s encrypted properties with the current key, so they read once legacy is dropped', async () => {
    const user = await createUser('a@a.a')
    await writeCiphertext(user, {
      encrypted_secret: Encrypt.encrypt('old secret', oldKey),
      my_other_encrypted_secret: Encrypt.encrypt({ token: 'old token' }, oldKey),
    })

    await User.reencryptEncryptedColumns()

    dropLegacyKey()
    await user.reload()
    expect(user.secret).toEqual('old secret')
    expect(user.otherSecret).toEqual({ token: 'old token' })
  })

  it('encrypts the values of rows the model’s default scopes hide', async () => {
    const user = await createUser('a@a.a')
    await writeCiphertext(user, { encrypted_secret: Encrypt.encrypt('old secret', oldKey) })
    await db('default', 'primary')
      .updateTable('users')
      .set({ deleted_at: new Date() })
      .where('id', '=', user.id)
      .execute()

    await User.reencryptEncryptedColumns()

    dropLegacyKey()
    const hiddenUser = await User.removeAllDefaultScopes().findOrFail(user.id)
    expect(hiddenUser.secret).toEqual('old secret')
  })

  it('reaches every row across batches', async () => {
    const users: User[] = []
    for (const name of ['a', 'b', 'c', 'd', 'e']) users.push(await createUser(`${name}@a.a`))
    for (const user of users) {
      await writeCiphertext(user, { encrypted_secret: Encrypt.encrypt(`secret ${user.email}`, oldKey) })
    }

    await User.reencryptEncryptedColumns({ batchSize: 2 })

    dropLegacyKey()
    const secrets = (await User.order('id').all()).map(user => user.secret)
    expect(secrets).toEqual(users.map(user => `secret ${user.email}`))
  })

  it('leaves null values null and does not change updatedAt', async () => {
    const user = await createUser('a@a.a')
    await writeCiphertext(user, {
      encrypted_secret: Encrypt.encrypt('old secret', oldKey),
      my_other_encrypted_secret: null,
    })
    await user.reload()
    const updatedAt = user.updatedAt

    await User.reencryptEncryptedColumns()

    await user.reload()
    expect(user.getAttribute('myOtherEncryptedSecret')).toBeNull()
    expect(user.updatedAt.toISO()).toEqual(updatedAt.toISO())
  })

  it('keeps a value an app wrote to a row after the row was read', async () => {
    const user = await createUser('a@a.a')
    const staleCiphertext = Encrypt.encrypt('old secret', oldKey)
    await writeCiphertext(user, { encrypted_secret: Encrypt.encrypt('newer secret', newKey) })

    // the walk read the row before the app's write, so it holds the stale value
    const getAttributeSpy = vi.spyOn(User.prototype, 'getAttribute').mockImplementation(function (
      this: User,
      column: any
    ) {
      return column === 'encryptedSecret' ? staleCiphertext : Dream.prototype.getAttribute.call(this, column)
    })
    await User.reencryptEncryptedColumns()
    getAttributeSpy.mockRestore()

    dropLegacyKey()
    await user.reload()
    expect(user.secret).toEqual('newer secret')
  })

  it('does not fire encryption:legacy-key-used for the values it reads', async () => {
    const user = await createUser('a@a.a')
    await writeCiphertext(user, { encrypted_secret: Encrypt.encrypt('old secret', oldKey) })
    const listener = vi.fn()
    DreamApp.getOrFail().on('encryption:legacy-key-used', listener)

    await User.reencryptEncryptedColumns()

    expect(listener).not.toHaveBeenCalled()
  })

  context('on an STI model', () => {
    it('encrypts the values of its rows on the shared table', async () => {
      const stiA = await StiA.create({
        name: 'sti a',
        pet: await Pet.create(),
        taskable: await Chore.create(),
      })
      await db('default', 'primary')
        .updateTable('sti_bases')
        .set({ encrypted_secret: Encrypt.encrypt('old secret', oldKey) })
        .where('id', '=', stiA.id)
        .execute()

      await StiA.reencryptEncryptedColumns()

      dropLegacyKey()
      const reloaded = (await StiBase.findOrFail(stiA.id)) as StiA
      expect(reloaded.secret).toEqual('old secret')
    })
  })

  context('when a value decrypts with neither key', () => {
    it('throws DecryptionRotationError, leaving the rows rewritten before it under the current key', async () => {
      const first = await createUser('a@a.a')
      const second = await createUser('b@a.a')
      await writeCiphertext(first, { encrypted_secret: Encrypt.encrypt('old secret', oldKey) })
      await writeCiphertext(second, {
        encrypted_secret: Encrypt.encrypt('lost secret', {
          algorithm: 'aes-256-gcm',
          key: Encrypt.generateKey('aes-256-gcm'),
        }),
      })

      await expect(User.reencryptEncryptedColumns()).rejects.toThrow(DecryptionRotationError)

      dropLegacyKey()
      await first.reload()
      expect(first.secret).toEqual('old secret')
    })

    context('with no legacy key configured', () => {
      it('throws DecryptionError', async () => {
        dropLegacyKey()
        const user = await createUser('a@a.a')
        await writeCiphertext(user, { encrypted_secret: Encrypt.encrypt('old secret', oldKey) })

        await expect(User.reencryptEncryptedColumns()).rejects.toThrow(DecryptionError)
      })
    })
  })
})
