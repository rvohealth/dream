import { Kysely, sql } from 'kysely'
import { db } from '../../../../src'
import addValueToEnum from '../../../../src/db/migration-helpers/addValueToEnum'

describe('addValueToEnum', () => {
  let _db: Kysely<any>

  beforeEach(async () => {
    _db = db('primary')
    await _db.schema.createType('temp_enum').asEnum(['a', 'b']).execute()
  })

  afterEach(async () => {
    await _db.schema.dropType('temp_enum').execute()
  })

  it('adds the value to the enum', async () => {
    await addValueToEnum(_db, {
      enumName: 'temp_enum',
      enumValueToAdd: 'c',
    })

    const response = await sql`SELECT unnest(enum_range(NULL::temp_enum))`.execute(_db)
    const allEnumValues = response.rows.map(row => (row as any).unnest)
    expect(allEnumValues).toEqual(['a', 'b', 'c'])
  })
})
