import { Kysely, sql } from 'kysely'
import DreamMigrationHelpers from '../../../src/db/migration-helpers/DreamMigrationHelpers.js'

export async function up(db: Kysely<any>): Promise<void> {
  DreamMigrationHelpers.newTransaction()

  await db.schema
    .alterTable('pets')
    .addCheckConstraint(
      'species_migration_transaction_test_constraint',
      sql`species != 'migration_transaction_test'`
    )
    .execute()
}

export async function down(): Promise<void> {}
