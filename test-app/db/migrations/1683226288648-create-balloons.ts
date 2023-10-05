import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.createType('balloon_colors_enum').asEnum(['red', 'green', 'blue']).execute()
  await db.schema.createType('balloon_types_enum').asEnum(['Mylar', 'Latex', 'Animal']).execute()

  await db.schema
    .createTable('beautiful_balloons')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('user_id', 'bigint', col => col.references('users.id').onDelete('cascade'))
    .addColumn('type', sql`balloon_types_enum`, col => col.notNull())
    .addColumn('volume', 'decimal(6, 3)')
    .addColumn('color', sql`balloon_colors_enum`)
    .addColumn('position_alpha', 'integer')
    .addColumn('position_beta', 'integer')
    .addColumn('multicolor', sql`balloon_colors_enum[]`)
    .addColumn('deleted_at', 'timestamp')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()

  await sql`
      ALTER TABLE beautiful_balloons
      ADD CONSTRAINT beautiful_balloons_unique_user_id_position_alpha
        UNIQUE (user_id, position_alpha)
        DEFERRABLE INITIALLY DEFERRED
    `.execute(db)

  await sql`
      ALTER TABLE beautiful_balloons
      ADD CONSTRAINT beautiful_balloons_unique_user_id_type_position_beta
        UNIQUE (user_id, type, position_beta)
        DEFERRABLE INITIALLY DEFERRED
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('beautiful_balloons')
    .dropConstraint('beautiful_balloons_unique_user_id_position_alpha')
    .execute()
  await db.schema
    .alterTable('beautiful_balloons')
    .dropConstraint('beautiful_balloons_unique_user_id_type_position_beta')
    .execute()
  await db.schema.dropTable('beautiful_balloons').execute()
  await db.schema.dropType('balloon_colors_enum').execute()
  await db.schema.dropType('balloon_colors_enum').execute()
  await db.schema.dropType('balloon_types_enum').execute()
}
