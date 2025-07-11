import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('circular_reference_model_bs')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('circular_reference_model_a_id', 'bigint', col =>
      col.references('circular_reference_model_as.id').onDelete('restrict')
    )
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('circular_reference_model_b_s').execute()
}
