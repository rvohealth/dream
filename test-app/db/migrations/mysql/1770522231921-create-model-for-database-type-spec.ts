import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // MySQL requires explicit precision for microseconds: TIMESTAMP(6)
  await sql`
    CREATE TABLE IF NOT EXISTS model_for_database_type_specs (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      my_datetime TIMESTAMP(6) NOT NULL,
      created_at TIMESTAMP(6) NOT NULL,
      updated_at TIMESTAMP(6) NOT NULL
    )
  `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('model_for_database_type_specs').ifExists().execute()
}
