import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.createType('extra_rating_types_enum').asEnum(['StarRating', 'HeartRating']).execute()

  await db.schema
    .createTable('extra_ratings')
    .addColumn('type', sql`extra_rating_types_enum`)
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('user_id', 'bigint', col => col.references('users.id').onDelete('cascade').notNull())
    .addColumn('extra_rateable_id', 'bigint', col => col.notNull())
    .addColumn('extra_rateable_type', 'varchar', col => col.notNull())
    .addColumn('rating', 'integer')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('ratings').execute()
}
