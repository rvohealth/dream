import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('polymorphic_chore_cleaning_supplies')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('polymorphic_chore_id', 'bigint', col =>
      col.references('polymorphic_chores.id').onDelete('restrict').notNull()
    )
    .addColumn('polymorphic_cleaning_supply_id', 'bigint', col =>
      col.references('polymorphic_cleaning_supplies.id').onDelete('restrict').notNull()
    )
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('polymorphic_chore_cleaning_supplies').execute()
}
