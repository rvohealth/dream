import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('polymorphic_user_meta_users')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('polymorphic_user_id', 'bigint', col => col.references('polymorphic_users.id').onDelete('restrict').notNull())
    .addColumn('polymorphic_meta_user_id', 'bigint', col => col.references('polymorphic_meta_users.id').onDelete('restrict').notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('polymorphic_user_meta_users').execute()
}