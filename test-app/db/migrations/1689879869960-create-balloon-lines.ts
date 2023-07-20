import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createType('balloon_line_materials_enum')
    .asEnum(['nylon', 'ribbon', 'twine', 'yarn'])
    .execute()

  await db.schema
    .createTable('balloon_lines')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('balloon_id', 'bigint', col =>
      col.references('beautiful_balloons.id').onDelete('cascade').notNull()
    )
    .addColumn('material', sql`balloon_line_materials_enum`)
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('balloon_lines').execute()
  await db.schema.dropType('balloon_line_materials_enum').execute()
}
