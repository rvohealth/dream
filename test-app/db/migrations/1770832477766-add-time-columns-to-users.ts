import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addColumn('wake_up_time', 'timetz')
    .addColumn('bedtime', 'time')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('users').dropColumn('wake_up_time').dropColumn('bedtime').execute()
}
