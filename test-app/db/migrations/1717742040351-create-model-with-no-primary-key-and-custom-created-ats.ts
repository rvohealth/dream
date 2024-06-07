import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('model_with_non_sequential_primary_key_and_custom_created_ats')
    .addColumn('id', 'uuid', col => col.primaryKey())
    .addColumn('datetime', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('model_with_non_sequential_primary_key_and_custom_created_ats').execute()
}
