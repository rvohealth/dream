import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('compositions')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('user_id', 'serial', col => col.references('users.id').onDelete('cascade').notNull())
    .addColumn('content', 'text')
    .addColumn('flexible_id', 'serial')
    .addColumn('flexible_type', 'serial')
    .addColumn('created_at', 'timestamp', col => col.defaultTo(sql`now()`).notNull())
    .addColumn('updated_at', 'timestamp', col => col.defaultTo(sql`now()`).notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('compositions').execute()
}
