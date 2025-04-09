import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('model_with_date_time_conditional_hooks')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('counter', 'integer', col => col.notNull().defaultTo(0))
    .addColumn('something_happened_at', 'timestamp')
    .addColumn('something_happened_in_a_transaction_at', 'timestamp')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('model_with_date_time_conditional_hooks').execute()
}
