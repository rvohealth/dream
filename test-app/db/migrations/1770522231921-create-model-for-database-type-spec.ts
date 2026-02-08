import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('model_for_database_type_specs')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('my_datetime', 'timestamp', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('model_for_database_type_specs').execute()
}
