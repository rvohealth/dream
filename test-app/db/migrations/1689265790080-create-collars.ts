import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('collars')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('pet_id', 'bigint', col => col.references('pets.id').onDelete('cascade').notNull())
    .addColumn('lost', 'boolean')
    .addColumn('tag_name', 'varchar(255)')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('collars').execute()
}
