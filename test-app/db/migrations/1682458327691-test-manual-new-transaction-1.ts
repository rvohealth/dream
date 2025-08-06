import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TYPE species ADD VALUE IF NOT EXISTS 'migration_transaction_test';`.execute(db)
}

export async function down(): Promise<void> {}
