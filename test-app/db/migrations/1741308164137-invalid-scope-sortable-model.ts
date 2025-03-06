import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('invalid_scope_sortable_models')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('position', 'integer')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('invalid_scope_sortable_models').execute()
}
