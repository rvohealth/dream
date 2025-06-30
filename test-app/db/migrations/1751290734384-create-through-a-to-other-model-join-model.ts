import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('through_a_to_other_model_join_models')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('other_model_id', 'bigint', col =>
      col.references('through_other_models.id').onDelete('restrict').notNull()
    )
    .addColumn('a_id', 'bigint', col => col.references('through_as.id').onDelete('restrict').notNull())
    .addColumn('position', 'integer', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()

  await db.schema
    .createIndex('unique_through_a_to_other_model_join_models')
    .on('through_a_to_other_model_join_models')
    .columns(['a_id', 'other_model_id'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('through_a_to_other_model_join_models').execute()
}
