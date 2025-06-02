import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.createType('shapable_types_enum').asEnum(['Shape']).execute()

  await db.schema
    .alterTable('beautiful_balloons')
    .addColumn('shapable_id', 'bigint')
    .addColumn('shapable_type', sql`shapable_types_enum`)
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('beautiful_balloons')
    .dropColumn('shapable_id')
    .dropColumn('shapable_type')
    .execute()

  await db.schema.dropType('shapable_types_enum').execute()
}

