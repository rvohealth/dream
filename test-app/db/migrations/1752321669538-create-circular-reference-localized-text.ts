import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.createType('circular_ref_localizable_types_enum').asEnum(['ModelA', 'ModelB']).execute()

  await db.schema
    .createTable('circular_reference_localized_texts')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('localizable_type', sql`circular_ref_localizable_types_enum`, col => col.notNull())
    .addColumn('localizable_id', 'bigint', col => col.notNull())
    .addColumn('locale', sql`locales_enum`, col => col.notNull())
    .addColumn('title', 'varchar(255)', col => col.notNull())
    .addColumn('markdown', 'text')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('circular_reference_localized_texts').execute()

  await db.schema.dropType('circular_ref_localizable_types_enum').execute()
}
