import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('composition_assets')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('composition_id', 'bigint', col => col.notNull())
    .addColumn('name', 'varchar')
    .addColumn('src', 'text')
    .addColumn('primary', 'boolean', col => col.defaultTo(false))
    .addColumn('score', 'integer', col => col.defaultTo(0))
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('compositions').execute()
}
