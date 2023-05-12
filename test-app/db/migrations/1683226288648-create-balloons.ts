import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.createType('balloon_colors_enum').asEnum(['red', 'green', 'blue']).execute()
  await db.schema.createType('balloon_types_enum').asEnum(['Mylar', 'Latex']).execute()

  await db.schema
    .createTable('balloons')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('user_id', 'bigint', col => col.references('users.id').onDelete('cascade').notNull())
    .addColumn('type', sql`balloon_types_enum`)
    .addColumn('volume', 'decimal(6, 3)')
    .addColumn('color', sql`balloon_colors_enum`)
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('balloons').execute()
  await db.schema.dropType('balloon_colors_enum').execute()
  await db.schema.dropType('balloon_types_enum').execute()
}
