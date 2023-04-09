import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('composition_assets')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('composition_id', 'serial', col => col.notNull())
    .addColumn('src', 'text')
    .addColumn('created_at', 'timestamp', col => col.defaultTo(sql`now()`).notNull())
    .addColumn('updated_at', 'timestamp', col => col.defaultTo(sql`now()`).notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('compositions').execute()
}
