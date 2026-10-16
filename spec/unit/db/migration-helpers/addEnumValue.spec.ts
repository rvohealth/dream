import { Kysely, sql } from 'kysely'
import DreamMigrationHelpers from '../../../../src/db/migration-helpers/DreamMigrationHelpers.js'
import db from '../../../../test-app/db/index.js'

describe('DreamMigrationHelpers.addEnumValue', () => {
  let _db: Kysely<any>

  beforeEach(async () => {
    _db = db('default', 'primary')
    await _db.schema.createType('temp_enum').asEnum(['a', 'b']).execute()
  })

  afterEach(async () => {
    await _db.schema.dropType('temp_enum').execute()
  })

  it('adds the value to the enum', async () => {
    await DreamMigrationHelpers.addEnumValue(_db, {
      enumName: 'temp_enum',
      value: 'c',
    })

    const response = await sql`SELECT unnest(enum_range(NULL::temp_enum))`.execute(_db)
    const allEnumValues = response.rows.map(row => (row as any).unnest)
    expect(allEnumValues).toEqual(['a', 'b', 'c'])
  })

  it('adds a value containing an apostrophe', async () => {
    await DreamMigrationHelpers.addEnumValue(_db, {
      enumName: 'temp_enum',
      value: "o'brien",
    })

    const response = await sql`SELECT unnest(enum_range(NULL::temp_enum))`.execute(_db)
    const allEnumValues = response.rows.map(row => (row as any).unnest)
    expect(allEnumValues).toEqual(['a', 'b', "o'brien"])
  })

  context('an enum named with a reserved word', () => {
    beforeEach(async () => {
      await _db.schema.createType('order').asEnum(['a']).execute()
    })

    afterEach(async () => {
      await _db.schema.dropType('order').execute()
    })

    it('adds the value to the enum', async () => {
      await DreamMigrationHelpers.addEnumValue(_db, {
        enumName: 'order',
        value: 'b',
      })

      const response = await sql`SELECT unnest(enum_range(NULL::"order"))`.execute(_db)
      const allEnumValues = response.rows.map(row => (row as any).unnest)
      expect(allEnumValues).toEqual(['a', 'b'])
    })
  })
})
