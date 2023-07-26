import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('food_item_wellness_tags')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('primary', 'boolean', col => col.defaultTo(false).notNull())
    .addColumn('external_nutrition_id', 'varchar(255)', col => col.notNull())
    .addColumn('wellness_tag_id', 'bigint', col =>
      col.references('wellness_tags.id').onDelete('cascade').notNull()
    )
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('food_item_wellness_tags').execute()
}
