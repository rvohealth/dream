import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('model_with_ignored_columns')
    .addColumn('id', 'bigint', col => col.primaryKey().generatedByDefaultAsIdentity())
    .addColumn('user_id', 'bigint', col => col.references('users.id').onDelete('cascade'))
    .addColumn('name', 'varchar(255)')
    // deprecated_column remains in the database but is declared in
    // ignoredColumns on ModelWithIgnoredColumns, so it is omitted from the
    // generated types files. This permanently models deploy 1 of the
    // two-deploy column-drop process, in which the declaration has shipped
    // but the drop migration has not yet run.
    .addColumn('deprecated_column', 'varchar(255)')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('model_with_ignored_columns').execute()
}
