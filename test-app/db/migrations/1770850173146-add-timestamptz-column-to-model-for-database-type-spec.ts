import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('model_for_database_type_specs')
    .addColumn('my_datetime_tz', sql`timestamptz`)
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('model_for_database_type_specs').dropColumn('my_datetime_tz').execute()
}
