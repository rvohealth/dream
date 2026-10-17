import { Kysely, sql } from 'kysely'
import DreamMigrationHelpers from '../../../../src/db/migration-helpers/DreamMigrationHelpers.js'
import db from '../../../../test-app/db/index.js'

describe('DreamMigrationHelpers.addDeferrableUniqueConstraint', () => {
  let _db: Kysely<any>

  beforeEach(async () => {
    _db = db('default', 'primary')
    await _db.schema.alterTable('pets').addColumn('order', 'integer').addColumn('group', 'text').execute()
  })

  afterEach(async () => {
    await _db.schema.alterTable('pets').dropColumn('order').dropColumn('group').execute()
  })

  it('adds a deferrable unique constraint over columns named with reserved words', async () => {
    await DreamMigrationHelpers.addDeferrableUniqueConstraint(_db, 'pets_order_group_unique', {
      table: 'pets',
      columns: ['order', 'group'],
    })

    const response =
      await sql`SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conname = ${'pets_order_group_unique'}`.execute(
        _db
      )
    expect((response.rows[0] as any).definition).toEqual(
      'UNIQUE ("order", "group") DEFERRABLE INITIALLY DEFERRED'
    )
  })
})
