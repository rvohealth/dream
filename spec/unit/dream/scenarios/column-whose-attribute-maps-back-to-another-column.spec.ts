import { Kysely, sql } from 'kysely'
import db from '../../../../test-app/db/index.js'
import ModelWithIgnoredColumns from '../../../../test-app/app/models/ModelWithIgnoredColumns.js'

// `sync` refuses a column such as address_line_1, whose attribute
// (addressLine1) maps back to a column that does not exist (address_line1).
// These specs add the column to a real table and give the model the attribute
// a sync that accepted it would generate, to show what that would break.
describe('a column whose attribute maps back to another column name', () => {
  let _db: Kysely<any>
  const schemaColumns = (ModelWithIgnoredColumns.prototype.schema as any).model_with_ignored_columns.columns

  function resetColumnsCache() {
    ;(ModelWithIgnoredColumns as any)._columns = undefined
  }

  beforeEach(async () => {
    _db = db('default', 'primary')
    await _db.schema.alterTable('model_with_ignored_columns').addColumn('address_line_1', 'text').execute()

    schemaColumns.addressLine1 = { ...schemaColumns.name, allowNull: true }
    resetColumnsCache()
    ;(ModelWithIgnoredColumns as any).defineAttributeAccessors()
  })

  afterEach(async () => {
    delete schemaColumns.addressLine1
    delete (ModelWithIgnoredColumns.prototype as any).addressLine1
    resetColumnsCache()
    await sql`ALTER TABLE model_with_ignored_columns DROP COLUMN IF EXISTS address_line_1`.execute(_db)
  })

  it('is still read by a plain load', async () => {
    const record = await ModelWithIgnoredColumns.create({ name: 'a' })
    await sql`UPDATE model_with_ignored_columns SET address_line_1 = '1 Main St'`.execute(_db)

    const reloaded = await ModelWithIgnoredColumns.findOrFail(record.id)

    expect((reloaded as any).addressLine1).toEqual('1 Main St')
  })

  it('cannot be written', async () => {
    const record = await ModelWithIgnoredColumns.create({ name: 'a' })

    await expect(record.update({ addressLine1: '1 Main St' } as any)).rejects.toThrow(
      'column "address_line1" of relation "model_with_ignored_columns" does not exist'
    )
  })

  it('cannot be filtered on', async () => {
    await expect(ModelWithIgnoredColumns.where({ addressLine1: '1 Main St' } as any).all()).rejects.toThrow(
      'column model_with_ignored_columns.address_line1 does not exist'
    )
  })

  it('breaks every leftJoinPreload that loads the model, even one that never names the column', async () => {
    await ModelWithIgnoredColumns.create({ name: 'a' })

    await expect(ModelWithIgnoredColumns.leftJoinPreload('user').all()).rejects.toThrow(
      'column model_with_ignored_columns.address_line1 does not exist'
    )
  })
})
