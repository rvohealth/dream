import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createType('workout_types_enum')
    .asEnum(['walking', 'running', 'cycling', 'strength_training'])
    .execute()

  await db.schema
    .createTable('polymorphic_workout_types')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('workout_type', sql`workout_types_enum`, col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('polymorphic_workout_types').execute()

  await db.schema.dropType('workout_types_enum').execute()
}
