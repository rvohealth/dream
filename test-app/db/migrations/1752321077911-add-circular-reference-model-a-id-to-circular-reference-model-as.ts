import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('circular_reference_model_as')
    .addColumn('circular_reference_model_b_id', 'bigint', col =>
      col.references('circular_reference_model_bs.id').onDelete('restrict')
    )
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('circular_reference_model_as')
    .dropColumn('circular_reference_model_b_id')
    .execute()
}
