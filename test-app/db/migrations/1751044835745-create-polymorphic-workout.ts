import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('polymorphic_workouts')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('polymorphic_workout_type_id', 'bigint', col =>
      col.references('polymorphic_workout_types.id').onDelete('restrict')
    )
    .addColumn('name', 'varchar(255)')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('polymorphic_workouts').execute()
}
