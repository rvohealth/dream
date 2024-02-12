import { Kysely, sql } from 'kysely'

export default async function createGinIndex(
  tableName: string,
  column: string,
  indexName: string,
  db: Kysely<any>
) {
  await sql`
    CREATE INDEX IF NOT EXISTS ${sql.raw(indexName)} ON ${sql.raw(tableName)} USING GIN (${sql.raw(
      `${column} gin_trgm_ops`
    )});
  `.execute(db)
}
