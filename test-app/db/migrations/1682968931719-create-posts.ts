import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('posts')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('user_id', 'bigint', col => col.references('users.id').onDelete('cascade').notNull())
    .addColumn('post_visibility_id', 'bigint', col =>
      col.references('post_visibilities.id').onDelete('cascade')
    )
    .addColumn('body', 'text')
    .addColumn('position', 'integer', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()

  await sql`
      ALTER TABLE posts
      ADD CONSTRAINT posts_unique_position_user_id
        UNIQUE (user_id, position)
        DEFERRABLE INITIALLY DEFERRED
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('posts').dropConstraint('posts_unique_position_user_id').execute()
  await db.schema.dropTable('posts').execute()
}
