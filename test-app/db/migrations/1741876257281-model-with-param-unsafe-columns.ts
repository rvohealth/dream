import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('model_with_param_unsafe_columns')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('allowed_column1', 'varchar(255)')
    .addColumn('disallowed_column1', 'varchar(255)')
    .addColumn('allowed_column2', 'varchar(255)')
    .addColumn('disallowed_column2', 'varchar(255)')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('model_with_param_unsafe_columns').execute()
}
