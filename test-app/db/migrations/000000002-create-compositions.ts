import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('compositions')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('user_id', 'bigint', col => col.references('users.id').onDelete('cascade').notNull())
    .addColumn('content', 'text')
    .addColumn('metadata', 'jsonb', col => col.notNull().defaultTo('{}'))
    .addColumn('metadata2', 'jsonb')
    .addColumn('metadata3', 'json')
    .addColumn('primary', 'boolean', col => col.defaultTo(false))
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('compositions').execute()
}
