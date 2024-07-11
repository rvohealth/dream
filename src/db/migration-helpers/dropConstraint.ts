import { Kysely, sql } from 'kysely'

export default async function dropConstraint(constraintName: string, tableName: string, db: Kysely<any>) {
  await sql`
    ALTER TABLE ${sql.table(tableName)} DROP CONSTRAINT IF EXISTS ${sql.table(constraintName)};
  `.execute(db)
}
