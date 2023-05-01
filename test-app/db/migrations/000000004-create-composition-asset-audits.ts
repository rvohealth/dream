import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('composition_asset_audits')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('composition_asset_id', 'integer', col => col.notNull())
    .addColumn('approval', 'boolean')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('compositions').execute()
}
