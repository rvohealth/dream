import { Kysely } from 'kysely'
import DreamMigrationHelpers from '../../../src/db/migration-helpers/DreamMigrationHelpers.js'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('sortable_cascade_owners')
    .addColumn('id', 'bigint', col => col.primaryKey().generatedByDefaultAsIdentity())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .addColumn('deleted_at', 'timestamp')
    .execute()

  await db.schema
    .createTable('sortable_cascade_children')
    .addColumn('id', 'bigint', col => col.primaryKey().generatedByDefaultAsIdentity())
    .addColumn('owner_id', 'bigint', col =>
      col.references('sortable_cascade_owners.id').onDelete('cascade').notNull()
    )
    .addColumn('label', 'varchar(255)', col => col.notNull())
    .addColumn('position', 'integer')
    .addColumn('position_within_label', 'integer')
    .addColumn('position_across_owners', 'integer')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .addColumn('deleted_at', 'timestamp')
    .execute()

  await DreamMigrationHelpers.addDeferrableUniqueConstraint(db, 'sortable_cascade_children_position', {
    table: 'sortable_cascade_children',
    columns: ['owner_id', 'position'],
  })

  await DreamMigrationHelpers.addDeferrableUniqueConstraint(
    db,
    'sortable_cascade_children_position_within_label',
    {
      table: 'sortable_cascade_children',
      columns: ['owner_id', 'label', 'position_within_label'],
    }
  )

  await DreamMigrationHelpers.addDeferrableUniqueConstraint(
    db,
    'sortable_cascade_children_position_across_owners',
    {
      table: 'sortable_cascade_children',
      columns: ['label', 'position_across_owners'],
    }
  )
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('sortable_cascade_children').execute()
  await db.schema.dropTable('sortable_cascade_owners').execute()
}
