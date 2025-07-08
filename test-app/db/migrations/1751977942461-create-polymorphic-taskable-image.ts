import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('polymorphic_taskable_images')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('taskable_type', sql`polymorphic_taskable_types_enum`, col => col.notNull())
    .addColumn('taskable_id', 'bigint', col => col.notNull())
    .addColumn('polymorphic_image_id', 'bigint', col =>
      col.references('polymorphic_images.id').onDelete('restrict').notNull()
    )
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('polymorphic_taskable_images').execute()
}
