import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createType('polymorphic_tests_localizable_types_enum')
    .asEnum(['Workout', 'Chore'])
    .execute()

  await db.schema
    .createTable('polymorphic_localized_texts')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('localizable_type', sql`polymorphic_tests_localizable_types_enum`, col => col.notNull())
    .addColumn('localizable_id', 'bigint', col => col.notNull())
    .addColumn('locale', sql`locales_enum`, col => col.notNull())
    .addColumn('title', 'varchar(255)', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('polymorphic_localized_texts').execute()

  await db.schema.dropType('polymorphic_tests_localizable_types_enum').execute()
}
