import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('posts')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('user_id', 'integer', col => col.references('users.id').onDelete('cascade').notNull())
    .addColumn('post_visibility_id', 'bigint', col => col.references('posts.id').onDelete('cascade'))
    .addColumn('body', 'text')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('posts').execute()
}
