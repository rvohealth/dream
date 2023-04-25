import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // NOTE: intentionally leaving out updated at field on this model so that models without
  // an updated_at field can be tested for regressions
  await db.schema
    .createTable('pets')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('species', 'text')
    .addColumn('name', 'text')
    .addColumn('user_id', 'serial', col => col.references('users.id').onDelete('cascade').notNull())
    .addColumn('created_at', 'timestamp', col => col.defaultTo(sql`now()`).notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('pets').execute()
}
