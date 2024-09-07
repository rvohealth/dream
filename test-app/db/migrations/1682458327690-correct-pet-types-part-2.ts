import { Kysely } from 'kysely'
import { DreamMigrationHelpers } from '../../../src'

export async function up(db: Kysely<any>): Promise<void> {
  await DreamMigrationHelpers.dropEnumValue(db, {
    enumName: 'species',
    enumValue: 'forg',
    tablesAndColumnsToChange: [{ table: 'pets', column: 'species', replaceWith: 'frog' }],
  })
}

export async function down(): Promise<void> {}
