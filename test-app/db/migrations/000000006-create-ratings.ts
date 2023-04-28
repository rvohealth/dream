import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('ratings')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('user_id', 'integer', col => col.references('users.id').onDelete('cascade').notNull())
    // .addColumn('rateable', 'references', { polymorphic: true }, col => col.references('users.id').onDelete('cascade').notNull())
    .addColumn('rateable_id', 'integer', col => col.notNull())
    .addColumn('rateable_type', 'varchar', col => col.notNull())
    .addColumn('rating', 'integer')
    .addColumn('created_at', 'timestamp', col => col.defaultTo(sql`now()`).notNull())
    .addColumn('updated_at', 'timestamp', col => col.defaultTo(sql`now()`).notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('ratings').execute()
}
