import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('model_for_database_type_specs')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('pet_id', 'bigint', col => col.references('pets.id').onDelete('set null'))
    .addColumn('my_datetime', 'timestamp')
    .addColumn('my_date', 'date')
    .addColumn('my_time_without_zone', 'time')
    .addColumn('my_time_with_zone', 'timetz')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('model_for_database_type_specs').execute()
}
