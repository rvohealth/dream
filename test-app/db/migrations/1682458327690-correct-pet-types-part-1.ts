import { Kysely } from 'kysely'
import DreamMigrationHelpers from '../../../src/db/migration-helpers/DreamMigrationHelpers.js'

export async function up(db: Kysely<any>): Promise<void> {
  await DreamMigrationHelpers.addEnumValue(db, { enumName: 'species', value: 'frog' })
}

export async function down(): Promise<void> {}
