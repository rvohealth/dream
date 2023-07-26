import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('food_items')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('calories', 'integer')
    .addColumn('name', 'varchar(255)', col => col.notNull())
    .addColumn('external_nutrition_id', 'varchar(255)', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('food_items').execute()
}
