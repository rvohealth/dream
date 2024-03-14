import { Kysely, sql } from 'kysely'

export default async function createExtension(
  extensionName: string,
  db: Kysely<any>,
  { ifNotExists = true, publicSchema = true }: { ifNotExists?: boolean; publicSchema?: boolean } = {}
) {
  const ifNotExistsText = ifNotExists ? ' IF NOT EXISTS ' : ' '
  const publicSchemaText = publicSchema ? ' WITH SCHEMA public' : ''
  await sql`
    CREATE EXTENSION${sql.raw(ifNotExistsText)}"${sql.raw(extensionName)}"${sql.raw(publicSchemaText)};
  `.execute(db)
}
