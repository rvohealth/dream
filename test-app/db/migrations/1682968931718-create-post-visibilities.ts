import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('post_visibilities')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('visibility', 'boolean')
    .addColumn('notes', 'text')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('post_visibilities').execute()
}
