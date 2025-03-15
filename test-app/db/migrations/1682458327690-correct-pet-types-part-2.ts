import { Kysely } from 'kysely'
import { DreamMigrationHelpers } from '../../../src/index.js'

export async function up(db: Kysely<any>): Promise<void> {
  await DreamMigrationHelpers.dropEnumValue(db, {
    enumName: 'species',
    value: 'forg',
    replacements: [{ table: 'pets', column: 'species', replaceWith: 'frog' }],
  })
}

export async function down(): Promise<void> {}
