import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('pet_understudy_join_models')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('pet_id', 'bigint', col => col.references('pets.id').onDelete('cascade').notNull())
    .addColumn('understudy_id', 'bigint', col => col.references('pets.id').onDelete('cascade').notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('pet_understudy_join_models').execute()
}
