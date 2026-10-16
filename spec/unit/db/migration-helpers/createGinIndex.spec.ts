import { Kysely, sql } from 'kysely'
import DreamMigrationHelpers from '../../../../src/db/migration-helpers/DreamMigrationHelpers.js'
import db from '../../../../test-app/db/index.js'

describe('DreamMigrationHelpers.createGinIndex', () => {
  let _db: Kysely<any>

  beforeEach(async () => {
    _db = db('default', 'primary')
    await _db.schema.alterTable('pets').addColumn('order', 'text').execute()
  })

  afterEach(async () => {
    await _db.schema.alterTable('pets').dropColumn('order').execute()
  })

  it('creates a trigram GIN index on a column named with a reserved word', async () => {
    await DreamMigrationHelpers.createGinIndex(_db, 'index_pets_order_gin', {
      table: 'pets',
      column: 'order',
    })

    const response =
      await sql`SELECT indexdef FROM pg_indexes WHERE indexname = ${'index_pets_order_gin'}`.execute(_db)
    expect((response.rows[0] as any).indexdef).toEqual(
      'CREATE INDEX index_pets_order_gin ON public.pets USING gin ("order" gin_trgm_ops)'
    )
  })
})
