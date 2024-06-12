import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('post_comments')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('post_id', 'bigint', col => col.references('posts.id').onDelete('restrict').notNull())
    .addColumn('body', 'text', col => col.defaultTo(null))
    .addColumn('deletedAt', 'timestamp', col => col.defaultTo(null))
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('post_comments').execute()
}
