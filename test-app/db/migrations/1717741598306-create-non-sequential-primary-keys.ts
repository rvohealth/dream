import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('non_sequential_primary_keys')
    .addColumn('id', 'uuid', col => col.primaryKey())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('non_sequential_primary_keys').execute()
}
