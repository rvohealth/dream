import { Kysely, sql } from 'kysely'
import dropConstraint from './dropConstraint'

export default async function addDeferrableUniqueConstraint(
  constraintName: string,
  tableName: string,
  columns: string[],
  db: Kysely<any>
) {
  await dropConstraint(constraintName, tableName, db)
  await sql`
    ALTER TABLE ${sql.table(tableName)}
    ADD CONSTRAINT ${sql.table(constraintName)}
      UNIQUE (${sql.raw(columns.join(', '))})
      DEFERRABLE INITIALLY DEFERRED;
  `.execute(db)
}
