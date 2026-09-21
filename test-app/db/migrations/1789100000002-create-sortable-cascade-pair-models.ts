import { Kysely } from 'kysely'
import DreamMigrationHelpers from '../../../src/db/migration-helpers/DreamMigrationHelpers.js'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('sortable_cascade_pair_owners')
    .addColumn('id', 'bigint', col => col.primaryKey().generatedByDefaultAsIdentity())
    .addColumn('parent_id', 'bigint', col =>
      col.references('sortable_cascade_pair_owners.id').onDelete('cascade')
    )
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .addColumn('deleted_at', 'timestamp')
    .execute()

  await db.schema
    .createTable('sortable_cascade_pairs')
    .addColumn('id', 'bigint', col => col.primaryKey().generatedByDefaultAsIdentity())
    .addColumn('owner_id', 'bigint', col =>
      col.references('sortable_cascade_pair_owners.id').onDelete('cascade').notNull()
    )
    .addColumn('co_owner_id', 'bigint', col =>
      col.references('sortable_cascade_pair_owners.id').onDelete('cascade').notNull()
    )
    .addColumn('position', 'integer')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .addColumn('deleted_at', 'timestamp')
    .execute()

  await DreamMigrationHelpers.addDeferrableUniqueConstraint(db, 'sortable_cascade_pairs_position', {
    table: 'sortable_cascade_pairs',
    columns: ['owner_id', 'co_owner_id', 'position'],
  })
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('sortable_cascade_pairs').execute()
  await db.schema.dropTable('sortable_cascade_pair_owners').execute()
}
