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

describe('DreamMigrationHelpers.decryptColumn', () => {
  let _db: Kysely<any>

  beforeEach(async () => {
    _db = db('default', 'primary')
    await _db.schema.alterTable('pets').addColumn('encrypted_secret_phone', 'text').execute()
  })

  afterEach(async () => {
    await sql`ALTER TABLE pets DROP COLUMN IF EXISTS secret_phone`.execute(_db)
    await sql`ALTER TABLE pets DROP COLUMN IF EXISTS encrypted_secret_phone`.execute(_db)
  })

  it('renames encrypted_<column> back to <column>, left as text by default', async () => {
    await DreamMigrationHelpers.decryptColumn(_db, { table: 'pets', column: 'secret_phone' })

    expect(await columnDataType(_db, 'pets', 'encrypted_secret_phone')).toBeNull()
    expect(await columnDataType(_db, 'pets', 'secret_phone')).toEqual('text')
  })

  it('decrypts each non-null value back to plaintext', async () => {
    await _db
      .insertInto('pets')
      .values({ encrypted_secret_phone: InternalEncrypt.encryptColumn('555-1234'), created_at: '2024-02-02' })
      .execute()

    await DreamMigrationHelpers.decryptColumn(_db, { table: 'pets', column: 'secret_phone' })

    const pet = await _db.selectFrom('pets').selectAll().executeTakeFirstOrThrow()
    expect(pet.secretPhone).toEqual('555-1234')
  })

  it('leaves null values null', async () => {
    await _db.insertInto('pets').values({ encrypted_secret_phone: null, created_at: '2024-02-02' }).execute()

    await DreamMigrationHelpers.decryptColumn(_db, { table: 'pets', column: 'secret_phone' })

    const pet = await _db.selectFrom('pets').selectAll().executeTakeFirstOrThrow()
    expect(pet.secretPhone).toBeNull()
  })

  context('with a columnType', () => {
    beforeEach(async () => {
      // start from an encrypted integer-valued column
      await sql`ALTER TABLE pets DROP COLUMN IF EXISTS encrypted_secret_phone`.execute(_db)
      await _db.schema.alterTable('pets').addColumn('encrypted_secret_age', 'text').execute()
    })

    afterEach(async () => {
      await sql`ALTER TABLE pets DROP COLUMN IF EXISTS secret_age`.execute(_db)
      await sql`ALTER TABLE pets DROP COLUMN IF EXISTS encrypted_secret_age`.execute(_db)
    })

    it('restores the column to the provided type', async () => {
      await _db
        .insertInto('pets')
        .values({ encrypted_secret_age: InternalEncrypt.encryptColumn(42), created_at: '2024-02-02' })
        .execute()

      await DreamMigrationHelpers.decryptColumn(_db, {
        table: 'pets',
        column: 'secret_age',
        columnType: 'integer',
      })

      expect(await columnDataType(_db, 'pets', 'secret_age')).toEqual('integer')
      const pet = await _db.selectFrom('pets').selectAll().executeTakeFirstOrThrow()
      expect(pet.secretAge).toEqual(42)
    })
  })

  it('round-trips with encryptColumn', async () => {
    // begin from a plaintext column to exercise encrypt -> decrypt as inverses
    await sql`ALTER TABLE pets DROP COLUMN IF EXISTS encrypted_secret_phone`.execute(_db)
    await _db.schema.alterTable('pets').addColumn('secret_phone', 'text').execute()
    await _db.insertInto('pets').values({ secret_phone: '555-1234', created_at: '2024-02-02' }).execute()

    await DreamMigrationHelpers.encryptColumn(_db, { table: 'pets', column: 'secret_phone' })
    await DreamMigrationHelpers.decryptColumn(_db, { table: 'pets', column: 'secret_phone' })

    const pet = await _db.selectFrom('pets').selectAll().executeTakeFirstOrThrow()
    expect(pet.secretPhone).toEqual('555-1234')
  })
})
