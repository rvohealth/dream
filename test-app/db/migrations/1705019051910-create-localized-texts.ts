import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createType('locales_enum')
    .asEnum([
      'en-AU',
      'en-BZ',
      'en-CA',
      'en-cb',
      'en-GB',
      'en-IE',
      'en-IN',
      'en-JM',
      'en-MT',
      'en-MY',
      'en-NZ',
      'en-PH',
      'en-SG',
      'en-TT',
      'en-US',
      'en-ZA',
      'en-ZW',
      'es-ES',
      'fr-FR',
      'de-DE',
      'it-IT',
      'ja-JP',
      'ko-KR',
      'pt-BR',
      'zh-CN',
      'zh-TW',
    ])
    .execute()

  await db.schema.createType('localizable_types_enum').asEnum(['Composition', 'CompositionAsset']).execute()

  await db.schema
    .createTable('localized_texts')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('localizable_type', sql`localizable_types_enum`, col => col.notNull())
    .addColumn('localizable_id', 'bigint', col => col.notNull())
    .addColumn('locale', sql`locales_enum`, col => col.notNull())
    .addColumn('name', 'varchar(255)')
    .addColumn('title', 'varchar(255)')
    .addColumn('body', 'text')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()

  await db.schema
    .createIndex('localized_texts_lclzbltype_lclzblid_locale')
    .on('localized_texts')
    .columns(['localizable_type', 'localizable_id', 'locale'])
    .unique()
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('localized_texts_lclzbltype_lclzblid_locale').execute()
  await db.schema.dropTable('localized_texts').execute()
  await db.schema.dropType('locales_enum').execute()
  await db.schema.dropType('localizable_types_enum').execute()
}
