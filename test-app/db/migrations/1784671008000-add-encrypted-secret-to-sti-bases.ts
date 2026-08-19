import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('sti_bases').addColumn('encrypted_secret', 'text').execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('sti_bases').dropColumn('encrypted_secret').execute()
}
