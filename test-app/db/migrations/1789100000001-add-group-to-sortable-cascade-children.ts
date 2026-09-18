import { Kysely } from 'kysely'
import DreamMigrationHelpers from '../../../src/db/migration-helpers/DreamMigrationHelpers.js'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('sortable_cascade_children')
    .addColumn('group_name', 'varchar(255)')
    .addColumn('position_within_group', 'integer')
    .execute()

  await DreamMigrationHelpers.addDeferrableUniqueConstraint(
    db,
    'sortable_cascade_children_position_within_group',
    {
      table: 'sortable_cascade_children',
      columns: ['owner_id', 'group_name', 'position_within_group'],
    }
  )
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('sortable_cascade_children')
    .dropConstraint('sortable_cascade_children_position_within_group')
    .execute()

  await db.schema
    .alterTable('sortable_cascade_children')
    .dropColumn('position_within_group')
    .dropColumn('group_name')
    .execute()
}
