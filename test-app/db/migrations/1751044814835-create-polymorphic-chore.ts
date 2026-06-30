import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('polymorphic_chores')
    .addColumn('id', 'bigint', col => col.primaryKey().generatedByDefaultAsIdentity())
    .addColumn('name', 'varchar(255)')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('polymorphic_chores').execute()
}
