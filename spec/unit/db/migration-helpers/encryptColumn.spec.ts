import { Kysely, sql } from 'kysely'
import DreamMigrationHelpers from '../../../../src/db/migration-helpers/DreamMigrationHelpers.js'
import InternalEncrypt from '../../../../src/encrypt/InternalEncrypt.js'
import db from '../../../../test-app/db/index.js'

async function columnDataType(_db: Kysely<any>, table: string, column: string): Promise<string | null> {
  const res = await sql`
    SELECT data_type FROM information_schema.columns
    WHERE table_name = ${table} AND column_name = ${column}
  `.execute(_db)
  return (res.rows[0] as { dataType: string } | undefined)?.dataType ?? null
}

describe('DreamMigrationHelpers.encryptColumn', () => {
  let _db: Kysely<any>

  beforeEach(async () => {
    _db = db('default', 'primary')
    await _db.schema.alterTable('pets').addColumn('secret_phone', 'text').execute()
  })

  afterEach(async () => {
    // the column may have been renamed by the helper, so drop whichever name survives
    await sql`ALTER TABLE pets DROP COLUMN IF EXISTS secret_phone`.execute(_db)
    await sql`ALTER TABLE pets DROP COLUMN IF EXISTS encrypted_secret_phone`.execute(_db)
    await sql`ALTER TABLE pets DROP COLUMN IF EXISTS my_encrypted_phone`.execute(_db)
  })

  it('renames the column to encrypted_<column> as text', async () => {
    await DreamMigrationHelpers.encryptColumn(_db, { table: 'pets', column: 'secret_phone' })

    expect(await columnDataType(_db, 'pets', 'secret_phone')).toBeNull()
    expect(await columnDataType(_db, 'pets', 'encrypted_secret_phone')).toEqual('text')
  })

  it('encrypts each non-null value so it decrypts back to the original', async () => {
    await _db.insertInto('pets').values({ secret_phone: '555-1234', created_at: '2024-02-02' }).execute()

    await DreamMigrationHelpers.encryptColumn(_db, { table: 'pets', column: 'secret_phone' })

    const pet = await _db.selectFrom('pets').selectAll().executeTakeFirstOrThrow()
    expect(pet.encryptedSecretPhone).not.toEqual('555-1234')
    expect(InternalEncrypt.decryptColumn(pet.encryptedSecretPhone)).toEqual('555-1234')
  })

  it('leaves null values null', async () => {
    await _db.insertInto('pets').values({ secret_phone: null, created_at: '2024-02-02' }).execute()

    await DreamMigrationHelpers.encryptColumn(_db, { table: 'pets', column: 'secret_phone' })

    const pet = await _db.selectFrom('pets').selectAll().executeTakeFirstOrThrow()
    expect(pet.encryptedSecretPhone).toBeNull()
  })

  it('processes every row across multiple keyset batches without double-encrypting', async () => {
    await _db
      .insertInto('pets')
      .values(
        ['aaa', 'bbb', 'ccc', 'ddd', 'eee'].map(secret_phone => ({ secret_phone, created_at: '2024-02-02' }))
      )
      .execute()

    await DreamMigrationHelpers.encryptColumn(_db, { table: 'pets', column: 'secret_phone', batchSize: 2 })

    const pets = await _db.selectFrom('pets').selectAll().orderBy('id').execute()
    expect(pets.map(pet => InternalEncrypt.decryptColumn(pet.encryptedSecretPhone))).toEqual([
      'aaa',
      'bbb',
      'ccc',
      'ddd',
      'eee',
    ])
  })

  context('with a custom encryptedColumnName', () => {
    it('renames to the provided name', async () => {
      await _db.insertInto('pets').values({ secret_phone: '555-1234', created_at: '2024-02-02' }).execute()

      await DreamMigrationHelpers.encryptColumn(_db, {
        table: 'pets',
        column: 'secret_phone',
        encryptedColumnName: 'my_encrypted_phone',
      })

      expect(await columnDataType(_db, 'pets', 'encrypted_secret_phone')).toBeNull()
      expect(await columnDataType(_db, 'pets', 'my_encrypted_phone')).toEqual('text')

      const pet = await _db.selectFrom('pets').selectAll().executeTakeFirstOrThrow()
      expect(InternalEncrypt.decryptColumn(pet.myEncryptedPhone)).toEqual('555-1234')
    })
  })
})
