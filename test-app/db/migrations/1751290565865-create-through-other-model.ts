import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('through_other_models')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('my_model_id', 'bigint', col =>
      col.references('through_my_models.id').onDelete('restrict').notNull()
    )
    .addColumn('name', 'varchar(255)', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('through_other_models').execute()
}
