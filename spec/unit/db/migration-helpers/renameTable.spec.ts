import { Kysely, sql } from 'kysely'
import DreamMigrationHelpers from '../../../../src/db/migration-helpers/DreamMigrationHelpers.js'
import db from '../../../../test-app/db/index.js'

describe('DreamMigrationHelpers.renameTable', () => {
  let _db: Kysely<any>

  const FROM = 'temp_rename_widgets'
  const TO = 'temp_rename_gadgets'

  const sequenceExists = async (name: string) => {
    const res = await sql<{ exists: boolean }>`
      SELECT EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = ${name}) AS exists
    `.execute(_db)
    return res.rows[0]?.exists ?? false
  }

  const tableExists = async (name: string) => {
    const res = await sql<{
      exists: boolean
    }>`SELECT to_regclass(${`public.${name}`}) IS NOT NULL AS exists`.execute(_db)
    return res.rows[0]?.exists ?? false
  }

  beforeEach(() => {
    _db = db('default', 'primary')
  })

  afterEach(async () => {
    await sql`DROP TABLE IF EXISTS ${sql.ref(FROM)} CASCADE`.execute(_db)
    await sql`DROP TABLE IF EXISTS ${sql.ref(TO)} CASCADE`.execute(_db)
  })

  context('a table with a bigint identity primary key', () => {
    beforeEach(async () => {
      await _db.schema
        .createTable(FROM)
        .addColumn('id', 'bigint', col => col.primaryKey().generatedByDefaultAsIdentity())
        .addColumn('name', 'text')
        .execute()
    })

    it('renames the table, its primary key index, and its identity sequence, and the identity keeps working', async () => {
      expect(await sequenceExists(`${FROM}_id_seq`)).toBe(true)

      await DreamMigrationHelpers.renameTable(_db, FROM, TO)

      // table moved
      expect(await tableExists(FROM)).toBe(false)
      expect(await tableExists(TO)).toBe(true)

      // sequence renamed to match the new table name and re-owned by the identity column
      expect(await sequenceExists(`${FROM}_id_seq`)).toBe(false)
      expect(await sequenceExists(`${TO}_id_seq`)).toBe(true)
      const owned = await sql<{ seq: string }>`SELECT pg_get_serial_sequence(${TO}, 'id') AS seq`.execute(_db)
      expect(owned.rows[0]?.seq).toBe(`public.${TO}_id_seq`)

      // pkey index renamed
      const pkey = await sql<{ exists: boolean }>`
        SELECT to_regclass(${`public.${TO}_pkey`}) IS NOT NULL AS exists
      `.execute(_db)
      expect(pkey.rows[0]?.exists).toBe(true)

      // identity still auto-assigns (BY DEFAULT) and still accepts an explicit id
      await sql`INSERT INTO ${sql.ref(TO)} (name) VALUES ('auto')`.execute(_db)
      await sql`INSERT INTO ${sql.ref(TO)} (id, name) VALUES (500, 'explicit')`.execute(_db)
      await sql`INSERT INTO ${sql.ref(TO)} (name) VALUES ('auto2')`.execute(_db)

      const rows = await sql<{
        id: string
        name: string
      }>`SELECT id, name FROM ${sql.ref(TO)} ORDER BY id`.execute(_db)
      expect(rows.rows.map(r => r.name)).toEqual(['auto', 'auto2', 'explicit'])
    })
  })

  context('a table with a uuid primary key (no sequence)', () => {
    beforeEach(async () => {
      await _db.schema
        .createTable(FROM)
        .addColumn('id', 'uuid', col => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
        .addColumn('name', 'text')
        .execute()
    })

    it('renames the table and its primary key index, and skips the (nonexistent) sequence without erroring', async () => {
      expect(await sequenceExists(`${FROM}_id_seq`)).toBe(false)

      await DreamMigrationHelpers.renameTable(_db, FROM, TO)

      expect(await tableExists(FROM)).toBe(false)
      expect(await tableExists(TO)).toBe(true)
      expect(await sequenceExists(`${TO}_id_seq`)).toBe(false)

      await sql`INSERT INTO ${sql.ref(TO)} (name) VALUES ('uuid-row')`.execute(_db)
      const rows = await sql<{ name: string }>`SELECT name FROM ${sql.ref(TO)}`.execute(_db)
      expect(rows.rows.map(r => r.name)).toEqual(['uuid-row'])
    })
  })
})
