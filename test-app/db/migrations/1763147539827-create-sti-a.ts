import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('sti_bases')
    .addColumn('pet_id', 'bigint', col => col.references('pets.id').onDelete('restrict'))
    .execute()

  await db.schema.createIndex('sti_bases_pet_id').on('sti_bases').column('pet_id').execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('sti_bases_pet_id').execute()
  await db.schema.alterTable('sti_bases').dropColumn('pet_id').execute()
}
