import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('sandbags')
    .addColumn('id', 'bigint', col => col.primaryKey().generatedByDefaultAsIdentity())
    .addColumn('balloon_id', 'bigint', col =>
      col.references('beautiful_balloons.id').onDelete('cascade').notNull()
    )
    .addColumn('weight', 'integer')
    .addColumn('weight_kgs', 'integer')
    .addColumn('weight_tons', 'integer')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('sandbags').execute()
}
