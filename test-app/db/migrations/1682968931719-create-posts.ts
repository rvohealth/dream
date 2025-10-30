import { Kysely } from 'kysely'
import DreamMigrationHelpers from '../../../src/db/migration-helpers/DreamMigrationHelpers.js'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('posts')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('user_id', 'bigint', col => col.references('users.id').onDelete('cascade').notNull())
    .addColumn('post_visibility_id', 'bigint', col =>
      col.references('post_visibilities.id').onDelete('set null')
    )
    .addColumn('body', 'text')
    .addColumn('position', 'integer')
    .addColumn('deleted_at', 'timestamp', col => col.defaultTo(null))
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()

  await DreamMigrationHelpers.addDeferrableUniqueConstraint(db, 'posts_unique_position_user_id', {
    table: 'posts',
    columns: ['user_id', 'position'],
  })
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('posts').dropConstraint('posts_unique_position_user_id').execute()
  await db.schema.dropTable('posts').execute()
}
