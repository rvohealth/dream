import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('model_without_updated_at')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('name', 'varchar(255)')
    .addColumn('cant_update_this', 'varchar(255)')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('model_without_updated_at').execute()
}
