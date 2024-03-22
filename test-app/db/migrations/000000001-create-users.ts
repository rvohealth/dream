import { Kysely, sql } from 'kysely'
import createGinIndex from '../../../src/db/migration-helpers/createGinIndex'
import createExtension from '../../../src/db/migration-helpers/createExtension'

export async function up(db: Kysely<any>): Promise<void> {
  await createExtension('uuid-ossp', db)

  await db.schema
    .createTable('users')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('uuid', 'uuid', col =>
      col
        .notNull()
        .defaultTo(sql`uuid_generate_v4()`)
        .unique()
    )
    .addColumn('name', 'varchar')
    .addColumn('email', 'varchar', col => col.notNull().unique())
    .addColumn('social_security_number', 'varchar', col => col.unique())
    .addColumn('birthdate', 'date')
    .addColumn('featured_post_position', 'integer')
    .addColumn('target_rating', 'integer')
    .addColumn('password_digest', 'varchar', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .addColumn('deleted_at', 'timestamp', col => col.defaultTo(null))
    .execute()

  await createExtension('pg_trgm', db)
  await createGinIndex('users', 'email', 'index_users_email_gin', db)
  await createGinIndex('users', 'name', 'index_users_name_gin', db)
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('users').execute()
}
