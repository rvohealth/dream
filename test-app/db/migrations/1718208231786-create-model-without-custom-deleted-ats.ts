import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('model_without_custom_deleted_ats')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('deletedAt', 'timestamp', col => col.defaultTo(null))
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('model_without_custom_deleted_ats').execute()
}
