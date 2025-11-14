import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('sti_bases')
    .addColumn('taskable_type', sql`polymorphic_taskable_types_enum`)
    .addColumn('taskable_id', 'bigint')
    .execute()

  await db.schema
    .createIndex('sti_bases_taskable_type_and_id')
    .on('sti_bases')
    .columns(['taskable_type', 'taskable_id'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('sti_bases_pet_id').execute()
  await db.schema.alterTable('sti_bases').dropColumn('pet_id').execute()
}
