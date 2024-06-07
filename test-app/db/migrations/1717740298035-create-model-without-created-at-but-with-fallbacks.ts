import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('model_without_created_at_but_with_fallbacks')
    .addColumn('id', 'bigint', col => col.primaryKey())
    .addColumn('datetime', 'bigint')
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('model_without_created_at_but_with_fallbacks').execute()
}
