import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.createType('a_and_b_sti_types').asEnum(['StiA', 'StiB']).execute()

  await db.schema
    .createTable('sti_bases')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('type', sql`a_and_b_sti_types`, col => col.notNull())
    .addColumn('name', 'varchar(255)', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('sti_bases').execute()
}
