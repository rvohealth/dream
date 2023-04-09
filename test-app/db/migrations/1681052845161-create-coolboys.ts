import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('coolboys')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('email', 'text')
    .addColumn('password', 'text')
    .addColumn('user', 'serial', col => col.references('users.id').onDelete('cascade').notNull())
    .addColumn('created_at', 'timestamp', col => col.defaultTo(sql`now()`).notNull())
    .addColumn('updated_at', 'timestamp', col => col.defaultTo(sql`now()`).notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('users').execute()
}