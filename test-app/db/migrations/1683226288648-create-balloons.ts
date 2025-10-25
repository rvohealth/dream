import { Kysely, sql } from 'kysely'
import DreamMigrationHelpers from '../../../src/db/migration-helpers/DreamMigrationHelpers.js'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.createType('balloon_colors_enum').asEnum(['red', 'green', 'blue']).execute()
  await db.schema.createType('balloon_types_enum').asEnum(['Mylar', 'Latex', 'Animal']).execute()

  await db.schema
    .createTable('beautiful_balloons')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('user_id', 'bigint', col => col.references('users.id').onDelete('cascade'))
    .addColumn('type', sql`balloon_types_enum`, col => col.notNull())
    .addColumn('volume', 'decimal(6, 3)')
    .addColumn('color', sql`balloon_colors_enum`)
    .addColumn('position_alpha', 'integer')
    .addColumn('position_beta', 'integer')
    .addColumn('multicolor', sql`balloon_colors_enum[]`)
    .addColumn('mylar_only_property', 'varchar(256)')
    .addColumn('deleted_at', 'timestamp')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()

  await DreamMigrationHelpers.addDeferrableUniqueConstraint(
    db,
    'beautiful_balloons_unique_user_id_position_alpha',
    {
      table: 'beautiful_balloons',
      columns: ['user_id', 'position_alpha'],
    }
  )

  await DreamMigrationHelpers.addDeferrableUniqueConstraint(
    db,
    'beautiful_balloons_unique_user_id_type_position_beta',
    {
      table: 'beautiful_balloons',
      columns: ['user_id', 'type', 'position_alpha'],
    }
  )
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('beautiful_balloons')
    .dropConstraint('beautiful_balloons_unique_user_id_position_alpha')
    .execute()
  await db.schema
    .alterTable('beautiful_balloons')
    .dropConstraint('beautiful_balloons_unique_user_id_type_position_beta')
    .execute()
  await db.schema.dropTable('beautiful_balloons').execute()
  await db.schema.dropType('balloon_colors_enum').execute()
  await db.schema.dropType('balloon_colors_enum').execute()
  await db.schema.dropType('balloon_types_enum').execute()
}
