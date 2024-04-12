import { Kysely } from 'kysely'
import addDeferrableUniqueConstraint from '../../../src/db/migration-helpers/addDeferrableUniqueConstraint'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('posts')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('user_id', 'bigint', col => col.references('users.id').onDelete('cascade').notNull())
    .addColumn('post_visibility_id', 'bigint', col =>
      col.references('post_visibilities.id').onDelete('set null')
    )
    .addColumn('body', 'text')
    .addColumn('position', 'integer', col => col.notNull())
    .addColumn('deleted_at', 'timestamp', col => col.defaultTo(null))
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()

  await addDeferrableUniqueConstraint('posts_unique_position_user_id', 'posts', ['user_id', 'position'], db)
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('posts').dropConstraint('posts_unique_position_user_id').execute()
  await db.schema.dropTable('posts').execute()
}
