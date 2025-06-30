import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('through_bs')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('a_id', 'bigint', col =>
      col.references('through_as.id').onDelete('restrict').notNull().unique()
    )
    .addColumn('name', 'varchar(255)', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('through_bs').execute()
}
