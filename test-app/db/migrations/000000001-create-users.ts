import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('name', 'varchar')
    .addColumn('type', 'varchar', col => col.defaultTo(null))
    .addColumn('email', 'varchar', col => col.notNull().unique())
    .addColumn('password', 'varchar', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .addColumn('deleted_at', 'timestamp', col => col.defaultTo(null))
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('users').execute()
}
