import { Kysely, sql } from 'kysely'
import DreamMigrationHelpers from '../../../src/db/migration-helpers/DreamMigrationHelpers.js'

export async function up(db: Kysely<any>): Promise<void> {
  await DreamMigrationHelpers.createExtension(db, 'uuid-ossp')
  await DreamMigrationHelpers.createExtension(db, 'citext')

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
    .addColumn('grams', 'integer')
    .addColumn('encrypted_secret', 'text')
    .addColumn('my_other_encrypted_secret', 'text')
    .addColumn('email', 'varchar', col => col.notNull().unique())
    .addColumn('social_security_number', 'varchar', col => col.unique())
    .addColumn('birthdate', 'date')
    .addColumn('favorite_word', sql`citext`)
    .addColumn('featured_post_position', 'integer')
    .addColumn('target_rating', 'integer')
    .addColumn('favorite_numbers', sql`integer[]`)
    .addColumn('favorite_dates', sql`date[]`)
    .addColumn('favorite_datetimes', sql`timestamp[]`)
    .addColumn('password_digest', 'varchar', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .addColumn('deleted_at', 'timestamp', col => col.defaultTo(null))
    .execute()

  await DreamMigrationHelpers.createExtension(db, 'pg_trgm')
  await DreamMigrationHelpers.createGinIndex(db, 'index_users_email_gin', { table: 'users', column: 'email' })
  await DreamMigrationHelpers.createGinIndex(db, 'index_users_name_gin', { table: 'users', column: 'name' })
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('users').execute()
}
