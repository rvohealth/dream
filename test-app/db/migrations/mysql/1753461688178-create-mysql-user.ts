import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('mysql_users')
    .addColumn('id', 'bigint', col => col.primaryKey().autoIncrement())
    .addColumn('email', 'varchar(255)', col => col.notNull())
    .addColumn('name', 'varchar(255)', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('mysql_users').execute()
}
