import { Kysely } from 'kysely'
import DreamMigrationHelpers from '../../../src/db/migration-helpers/DreamMigrationHelpers.js'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('text_scoped_sortable_models')
    .addColumn('id', 'bigint', col => col.primaryKey().generatedByDefaultAsIdentity())
    .addColumn('scope_a', 'varchar(255)')
    .addColumn('scope_b', 'varchar(255)')
    .addColumn('position', 'integer')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()

  await DreamMigrationHelpers.addDeferrableUniqueConstraint(db, 'text_scoped_sortable_models_position', {
    table: 'text_scoped_sortable_models',
    columns: ['scope_a', 'scope_b', 'position'],
  })
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('text_scoped_sortable_models').execute()
}
