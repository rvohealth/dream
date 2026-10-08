import { Kysely, KyselyPlugin, sql } from 'kysely'
import DreamMigrationHelpers from '../../../../src/db/migration-helpers/DreamMigrationHelpers.js'
import DreamApp from '../../../../src/dream-app/index.js'
import Encrypt from '../../../../src/encrypt/index.js'
import InternalEncrypt from '../../../../src/encrypt/InternalEncrypt.js'
import db from '../../../../test-app/db/index.js'

describe('DreamMigrationHelpers.reencryptColumn', () => {
  let _db: Kysely<any>

  beforeEach(async () => {
    _db = db('default', 'primary')
    await _db.schema.alterTable('pets').addColumn('encrypted_secret_phone', 'text').execute()
  })

  afterEach(async () => {
    await sql`ALTER TABLE pets DROP COLUMN IF EXISTS encrypted_secret_phone`.execute(_db)
    await sql`ALTER TABLE pets DROP COLUMN IF EXISTS my_encrypted_phone`.execute(_db)
  })

  it('rewrites each non-null value under the current key, so it decrypts once legacy is dropped', async () => {
    const oldKey = Encrypt.generateKey('aes-256-gcm')
    const newKey = Encrypt.generateKey('aes-256-gcm')
    const dreamApp = DreamApp.getOrFail()
    dreamApp.set('encryption', {
      columns: {
        current: { algorithm: 'aes-256-gcm', key: newKey },
        legacy: { algorithm: 'aes-256-gcm', key: oldKey },
      },
    })
    await _db
      .insertInto('pets')
      .values([
        {
          encrypted_secret_phone: Encrypt.encrypt('555-1234', { algorithm: 'aes-256-gcm', key: oldKey }),
          created_at: '2024-02-02',
        },
        { encrypted_secret_phone: InternalEncrypt.encryptColumn('555-9876'), created_at: '2024-02-02' },
      ])
      .execute()

    await DreamMigrationHelpers.reencryptColumn(_db, { table: 'pets', column: 'secret_phone' })

    dreamApp.set('encryption', { columns: { current: { algorithm: 'aes-256-gcm', key: newKey } } })
    const pets = await _db.selectFrom('pets').selectAll().orderBy('id').execute()
    expect(pets.map(pet => InternalEncrypt.decryptColumn(pet.encryptedSecretPhone))).toEqual([
      '555-1234',
      '555-9876',
    ])
  })

  it('leaves null values null', async () => {
    await _db.insertInto('pets').values({ encrypted_secret_phone: null, created_at: '2024-02-02' }).execute()

    await DreamMigrationHelpers.reencryptColumn(_db, { table: 'pets', column: 'secret_phone' })

    const pet = await _db.selectFrom('pets').selectAll().executeTakeFirstOrThrow()
    expect(pet.encryptedSecretPhone).toBeNull()
  })

  it('rewrites every row across multiple keyset batches', async () => {
    const oldKey = Encrypt.generateKey('aes-256-gcm')
    const newKey = Encrypt.generateKey('aes-256-gcm')
    const dreamApp = DreamApp.getOrFail()
    dreamApp.set('encryption', {
      columns: {
        current: { algorithm: 'aes-256-gcm', key: newKey },
        legacy: { algorithm: 'aes-256-gcm', key: oldKey },
      },
    })
    await _db
      .insertInto('pets')
      .values(
        ['aaa', 'bbb', 'ccc', 'ddd', 'eee'].map(phone => ({
          encrypted_secret_phone: Encrypt.encrypt(phone, { algorithm: 'aes-256-gcm', key: oldKey }),
          created_at: '2024-02-02',
        }))
      )
      .execute()

    await DreamMigrationHelpers.reencryptColumn(_db, { table: 'pets', column: 'secret_phone', batchSize: 2 })

    dreamApp.set('encryption', { columns: { current: { algorithm: 'aes-256-gcm', key: newKey } } })
    const pets = await _db.selectFrom('pets').selectAll().orderBy('id').execute()
    expect(pets.map(pet => InternalEncrypt.decryptColumn(pet.encryptedSecretPhone))).toEqual([
      'aaa',
      'bbb',
      'ccc',
      'ddd',
      'eee',
    ])
  })

  it('keeps a value written between its read of a row and its write of that row, and rewrites the other rows', async () => {
    const oldKey = Encrypt.generateKey('aes-256-gcm')
    const newKey = Encrypt.generateKey('aes-256-gcm')
    const dreamApp = DreamApp.getOrFail()
    dreamApp.set('encryption', {
      columns: {
        current: { algorithm: 'aes-256-gcm', key: newKey },
        legacy: { algorithm: 'aes-256-gcm', key: oldKey },
      },
    })
    const insertedPets = await _db
      .insertInto('pets')
      .values(
        ['aaa', 'bbb', 'ccc'].map(phone => ({
          encrypted_secret_phone: Encrypt.encrypt(phone, { algorithm: 'aes-256-gcm', key: oldKey }),
          created_at: '2024-02-02',
        }))
      )
      .returning('id')
      .execute()
    const newerValue = InternalEncrypt.encryptColumn('newer')

    // once the helper has read the batch, an app saves a newer value to the second row
    let newerValueWritten = false
    const appWriteAfterRead: KyselyPlugin = {
      transformQuery: ({ node }) => node,
      transformResult: async ({ result }) => {
        if (!newerValueWritten && result.rows.length > 0) {
          newerValueWritten = true
          await _db
            .updateTable('pets')
            .set({ encrypted_secret_phone: newerValue })
            .where('id', '=', insertedPets[1]!.id)
            .execute()
        }
        return result
      },
    }

    await DreamMigrationHelpers.reencryptColumn(_db.withPlugin(appWriteAfterRead), {
      table: 'pets',
      column: 'secret_phone',
    })

    expect(newerValueWritten).toBe(true)
    const pets = await _db.selectFrom('pets').selectAll().orderBy('id').execute()
    expect(pets[1]!.encryptedSecretPhone).toEqual(newerValue)

    dreamApp.set('encryption', { columns: { current: { algorithm: 'aes-256-gcm', key: newKey } } })
    expect(pets.map(pet => InternalEncrypt.decryptColumn(pet.encryptedSecretPhone))).toEqual([
      'aaa',
      'newer',
      'ccc',
    ])
  })

  it('does not fire encryption:legacy-key-used for the values it reads', async () => {
    const oldKey = Encrypt.generateKey('aes-256-gcm')
    const dreamApp = DreamApp.getOrFail()
    dreamApp.set('encryption', {
      columns: {
        current: { algorithm: 'aes-256-gcm', key: Encrypt.generateKey('aes-256-gcm') },
        legacy: { algorithm: 'aes-256-gcm', key: oldKey },
      },
    })
    await _db
      .insertInto('pets')
      .values({
        encrypted_secret_phone: Encrypt.encrypt('555-1234', { algorithm: 'aes-256-gcm', key: oldKey }),
        created_at: '2024-02-02',
      })
      .execute()
    const listener = vi.fn()
    dreamApp.on('encryption:legacy-key-used', listener)

    await DreamMigrationHelpers.reencryptColumn(_db, { table: 'pets', column: 'secret_phone' })

    expect(listener).not.toHaveBeenCalled()
  })

  context('with a custom encryptedColumnName', () => {
    it('rewrites the provided column', async () => {
      const oldKey = Encrypt.generateKey('aes-256-gcm')
      const newKey = Encrypt.generateKey('aes-256-gcm')
      const dreamApp = DreamApp.getOrFail()
      dreamApp.set('encryption', {
        columns: {
          current: { algorithm: 'aes-256-gcm', key: newKey },
          legacy: { algorithm: 'aes-256-gcm', key: oldKey },
        },
      })
      await _db.schema.alterTable('pets').addColumn('my_encrypted_phone', 'text').execute()
      await _db
        .insertInto('pets')
        .values({
          my_encrypted_phone: Encrypt.encrypt('555-1234', { algorithm: 'aes-256-gcm', key: oldKey }),
          created_at: '2024-02-02',
        })
        .execute()

      await DreamMigrationHelpers.reencryptColumn(_db, {
        table: 'pets',
        column: 'secret_phone',
        encryptedColumnName: 'my_encrypted_phone',
      })

      dreamApp.set('encryption', { columns: { current: { algorithm: 'aes-256-gcm', key: newKey } } })
      const pet = await _db.selectFrom('pets').selectAll().executeTakeFirstOrThrow()
      expect(InternalEncrypt.decryptColumn(pet.myEncryptedPhone)).toEqual('555-1234')
    })
  })
})
