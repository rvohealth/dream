import { Kysely, sql } from 'kysely'

export default async function addEnumValue(db: Kysely<any>, { enumName, enumValue }: AddValueToEnumOpts) {
  await sql`ALTER TYPE ${sql.raw(enumName)} ADD VALUE IF NOT EXISTS '${sql.raw(enumValue)}';`.execute(db)
}

interface AddValueToEnumOpts {
  enumName: string
  enumValue: string
}
