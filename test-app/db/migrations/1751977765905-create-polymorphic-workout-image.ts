import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('polymorphic_workout_images')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('polymorphic_workout_id', 'bigint', col => col.references('polymorphic_workouts.id').onDelete('restrict').notNull())
    .addColumn('polymorphic_image_id', 'bigint', col => col.references('polymorphic_images.id').onDelete('restrict').notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('polymorphic_workout_images').execute()
}