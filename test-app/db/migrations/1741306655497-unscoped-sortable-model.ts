import { Kysely } from 'kysely'
import DreamMigrationHelpers from '../../../src/db/migration-helpers/DreamMigrationHelpers.js'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('unscoped_sortable_models')
    .addColumn('id', 'bigint', col => col.primaryKey().generatedByDefaultAsIdentity())
    .addColumn('position', 'integer')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()

  await DreamMigrationHelpers.addDeferrableUniqueConstraint(db, 'unscoped_sortable_models_position', {
    table: 'unscoped_sortable_models',
    columns: ['position'],
  })
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('unscoped_sortable_models').execute()
}
