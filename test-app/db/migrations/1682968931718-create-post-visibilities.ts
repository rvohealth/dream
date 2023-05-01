import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('post_visibilities')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('post_id', 'bigint', col => col.references('posts.id').onDelete('cascade').notNull())
    .addColumn('visibility', 'boolean')
    .addColumn('notes', 'text')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('post_visibilities').execute()
}