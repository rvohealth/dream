import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('graph_edges')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('name', 'varchar(255)')
    .addColumn('weight', 'decimal(6, 3)')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('graph_edges').execute()
}
