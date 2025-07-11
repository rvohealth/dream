import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('circular_reference_models')
    .addColumn('parent_id', 'bigint', col =>
      col.references('circular_reference_models.id').onDelete('restrict')
    )
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('circular_reference_models').dropColumn('parent_id').execute()
}
