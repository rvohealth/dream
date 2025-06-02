import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.createType('shape_types_enum').asEnum(['RegularShape', 'CatShape']).execute()

  await db.schema
    .createTable('shapes')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('name', 'varchar(255)')
    .addColumn('type', sql`shape_types_enum`, col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()

  await db.schema.createIndex('shapes_type').on('shapes').column('type').execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('shapes_type').execute()
  await db.schema.dropTable('shapes').execute()

  await db.schema.dropType('shape_types_enum').execute()
}
