import { Kysely, sql } from 'kysely'

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
    .addColumn('deleted_at', 'timestamp')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()

  await db.schema
    .createIndex('beautiful_balloons_uniq_on_alphapos_and_user_id')
    .on('beautiful_balloons')
    .columns(['user_id', 'position_alpha'])
    .unique()
    .execute()

  await db.schema
    .createIndex('beautiful_balloons_uniq_on_betapos_and_user_id')
    .on('beautiful_balloons')
    .columns(['user_id', 'position_beta', 'type'])
    .unique()
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('beautiful_balloons').execute()
  await db.schema.dropType('balloon_colors_enum').execute()
  await db.schema.dropIndex('beautiful_balloons_uniq_on_alphapos_and_user_id').execute()
  await db.schema.dropIndex('beautiful_balloons_uniq_on_betapos_and_user_id').execute()
  await db.schema.dropType('balloon_colors_enum').execute()
  await db.schema.dropType('balloon_types_enum').execute()
}
