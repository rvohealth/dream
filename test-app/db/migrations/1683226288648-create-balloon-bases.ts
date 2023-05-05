import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.createType('balloon_color_enum').asEnum(['red', 'green', 'blue']).execute()

  await db.schema
    .createTable('balloon_bases')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('type', 'varchar(255)')
    .addColumn('user_id', 'integer', col => col.references('users.id').onDelete('cascade').notNull())
    .addColumn('color', sql`balloon_color_enum`)
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('balloon_bases').execute()
}
