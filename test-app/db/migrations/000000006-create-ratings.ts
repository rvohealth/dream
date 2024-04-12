import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('ratings')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('user_id', 'bigint', col => col.references('users.id').onDelete('cascade').notNull())
    // .addColumn('rateable', 'references', { polymorphic: true }, col => col.references('users.id').onDelete('cascade').notNull())
    .addColumn('rateable_id', 'bigint', col => col.notNull())
    .addColumn('rateable_type', 'varchar', col => col.notNull())
    .addColumn('rating', 'integer')
    .addColumn('body', 'text')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('ratings').execute()
}
