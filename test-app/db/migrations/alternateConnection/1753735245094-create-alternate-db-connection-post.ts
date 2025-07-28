import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('alternate_db_connection_posts')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('alternate_db_connection_user_id', 'bigint', col =>
      col.references('alternate_db_connection_users.id').onDelete('restrict').notNull()
    )
    .addColumn('body', 'text', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('alternate_db_connection_posts').execute()
}
