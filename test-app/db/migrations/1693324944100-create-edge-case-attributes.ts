import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('edge_case_attributes')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('k_pop', 'boolean')
    .addColumn('pop_k', 'varchar(255)')
    .addColumn('pop_k_pop', 'integer')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('edge_case_attributes').execute()
}
