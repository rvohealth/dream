import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('balloon_spotter_balloons')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('user_id', 'bigint', col => col.references('users.id').onDelete('cascade'))
    .addColumn('balloon_spotter_id', 'bigint', col =>
      col.references('balloon_spotters.id').onDelete('cascade').notNull()
    )
    .addColumn('balloon_id', 'bigint', col =>
      col.references('beautiful_balloons.id').onDelete('cascade').notNull()
    )
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('balloon_spotter_balloons').execute()
}
