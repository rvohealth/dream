import { Kysely } from 'kysely'
import { DreamMigrationHelpers } from '../../../src'

export async function up(db: Kysely<any>): Promise<void> {
  await DreamMigrationHelpers.addEnumValue(db, { enumName: 'species', enumValue: 'frog' })
}

export async function down(): Promise<void> {}
