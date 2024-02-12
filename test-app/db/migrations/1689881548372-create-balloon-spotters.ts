import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('balloon_spotters')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('name', 'varchar(255)')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('balloon_spotters').execute()
}
