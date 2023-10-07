import { Kysely, sql } from 'kysely'

export default async function addDeferrableUniqueConstraint(
  constraintName: string,
  tableName: string,
  columns: string[],
  db: Kysely<any>
) {
  await sql`
    ALTER TABLE ${sql.table(tableName)} DROP CONSTRAINT IF EXISTS ${sql.table(constraintName)};
    ALTER TABLE ${sql.table(tableName)}
    ADD CONSTRAINT ${sql.table(constraintName)}
      UNIQUE (${sql.raw(columns.join(', '))})
      DEFERRABLE INITIALLY DEFERRED;
  `.execute(db)
}
