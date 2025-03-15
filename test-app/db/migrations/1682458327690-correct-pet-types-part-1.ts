import { Kysely } from 'kysely'
import { DreamMigrationHelpers } from '../../../src.js'

export async function up(db: Kysely<any>): Promise<void> {
  await DreamMigrationHelpers.addEnumValue(db, { enumName: 'species', value: 'frog' })
}

export async function down(): Promise<void> {}
