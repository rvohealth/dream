import { Kysely } from 'kysely'
import { DreamMigrationHelpers } from '../../../src.js'

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
    .addColumn('deleted_at', 'timestamp')
    .execute()

  await DreamMigrationHelpers.addDeferrableUniqueConstraint(
    db,
    'graph_edge_nodes_uniq_on_edge_id_node_id_position',
    {
      table: 'graph_edge_nodes',
      columns: ['edge_id', 'node_id', 'position'],
    }
  )
}

export async function down(db: Kysely<any>): Promise<void> {
  await DreamMigrationHelpers.dropConstraint(db, 'graph_edge_nodes_uniq_on_edge_id_node_id_position', {
    table: 'graph_edge_nodes',
  })

  await db.schema.dropTable('graph_edge_nodes').execute()
}
