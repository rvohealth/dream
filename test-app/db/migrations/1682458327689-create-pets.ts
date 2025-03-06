import { Kysely, sql } from 'kysely'
import { DreamMigrationHelpers } from '../../../src'

export async function up(db: Kysely<any>): Promise<void> {
  // NOTE: intentionally leaving out updated at field on this model so that models without
  // an updated_at field can be tested for regressions
  await db.schema.createType('species').asEnum(['cat', 'dog', 'forg']).execute()
  await db.schema
    .createType('cat_treats')
    .asEnum(['tuna', 'chicken', 'ocean fish', 'cat-safe chalupas (catlupas,supaloopas)'])
    .execute()
  await db.schema
    .createTable('pets')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('user_id', 'bigint', col => col.references('users.id').onDelete('set null'))
    .addColumn('user_uuid', 'uuid', col => col.references('users.uuid').onDelete('set null'))
    .addColumn('favorite_treats', sql`cat_treats[]`)
    .addColumn('favorite_days_of_week', sql`integer[]`)
    .addColumn('species', sql`species`)
    .addColumn('position_within_species', 'integer')
    .addColumn('name', 'text')
    .addColumn('nickname', 'text')
    .addColumn('deleted_at', 'timestamp')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .execute()

  await DreamMigrationHelpers.addDeferrableUniqueConstraint(db, 'pets_unique_position_within_species', {
    table: 'pets',
    columns: ['species', 'position_within_species'],
  })
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('pets').execute()
}
