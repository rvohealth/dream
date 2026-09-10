import { Kysely, sql } from 'kysely'
import DreamMigrationHelpers from '../../../src/db/migration-helpers/DreamMigrationHelpers.js'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createType('sortable_sti_model_types_enum')
    .asEnum(['SortableStiAlpha', 'SortableStiBeta'])
    .execute()

  await db.schema
    .createTable('sortable_sti_models')
    .addColumn('id', 'bigint', col => col.primaryKey().generatedByDefaultAsIdentity())
    .addColumn('type', sql`sortable_sti_model_types_enum`, col => col.notNull())
    .addColumn('position_by_type', 'integer', col => col.notNull())
    .addColumn('position_independent', 'integer', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()

  await db.schema.createIndex('sortable_sti_models_type').on('sortable_sti_models').column('type').execute()

  await DreamMigrationHelpers.addDeferrableUniqueConstraint(db, 'sortable_sti_models_position_independent', {
    table: 'sortable_sti_models',
    columns: ['position_independent'],
  })

  await DreamMigrationHelpers.addDeferrableUniqueConstraint(db, 'sortable_sti_models_type_position_by_type', {
    table: 'sortable_sti_models',
    columns: ['type', 'position_by_type'],
  })
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('sortable_sti_models')
    .dropConstraint('sortable_sti_models_position_independent')
    .execute()
  await db.schema
    .alterTable('sortable_sti_models')
    .dropConstraint('sortable_sti_models_type_position_by_type')
    .execute()
  await db.schema.dropTable('sortable_sti_models').execute()

  await db.schema.dropType('sortable_sti_model_types_enum').execute()
}
