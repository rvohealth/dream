import { Kysely } from 'kysely'
import addDeferrableUniqueConstraint from '../../../src/db/migration-helpers/addDeferrableUniqueConstraint'
import dropConstraint from '../../../src/db/migration-helpers/dropConstraint'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('graph_edge_nodes')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('edge_id', 'bigint', col => col.references('graph_edges.id').onDelete('cascade').notNull())
    .addColumn('node_id', 'bigint', col => col.references('graph_nodes.id').onDelete('cascade').notNull())
    .addColumn('position', 'integer', col => col.notNull())
    .addColumn('multi_scoped_position', 'integer', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()

  await addDeferrableUniqueConstraint(
    'graph_edge_nodes_uniq_on_edge_id_node_id_position',
    'graph_edge_nodes',
    ['edge_id', 'node_id', 'position'],
    db
  )
}

export async function down(db: Kysely<any>): Promise<void> {
  await dropConstraint('graph_edge_nodes_uniq_on_edge_id_node_id_position', 'graph_edge_nodes', db)

  await db.schema.dropTable('graph_edge_nodes').execute()
}
