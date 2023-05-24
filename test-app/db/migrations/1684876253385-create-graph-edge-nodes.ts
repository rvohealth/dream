import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('graph_edge_nodes')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('edge_id', 'bigint', col => col.references('graph_edges.id').onDelete('cascade').notNull())
    .addColumn('node_id', 'bigint', col => col.references('graph_nodes.id').onDelete('cascade').notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('graph_edge_nodes').execute()
}
