import { Kysely, sql } from 'kysely'

export default async function addValueToEnum(
  db: Kysely<any>,
  { enumName, enumValueToAdd }: AddValueToEnumOpts
) {
  await sql`ALTER TYPE ${sql.raw(enumName)} ADD VALUE IF NOT EXISTS '${sql.raw(enumValueToAdd)}';`.execute(db)
}

interface AddValueToEnumOpts {
  enumName: string
  enumValueToAdd: string
}
