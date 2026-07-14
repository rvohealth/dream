import Dream from '../../Dream.js'
import Query from '../../dream/Query.js'
import StiChildIncompatibleWithSoftDeleteDecorator from '../../errors/sti/StiChildIncompatibleWithSoftDeleteDecorator.js'
import { scopeImplementation } from '../static-method/Scope.js'

export const SOFT_DELETE_SCOPE_NAME = 'dream:SoftDelete'

/**
 * Instructs the model to set a timestamp when deleting,
 * rather than actually removing the record from the
 * database.
 *
 * By default, the SoftDelete decorator will expect a
 * `deletedAt` field to be set on your model, pointing
 * to a `timestamp` field in the database, like so:
 *
 * ```ts
 * export async function up(db: Kysely<any>): Promise<void> {
 *   await db.schema
 *     .createTable('posts')
 *     .addColumn('id', 'bigint', col => col.primaryKey().generatedByDefaultAsIdentity())
 *     .addColumn('deleted_at', 'timestamp', col => col.defaultTo(null))
 *     .addColumn('created_at', 'timestamp', col => col.notNull())
 *     .addColumn('updated_at', 'timestamp', col => col.notNull())
 *     .execute()
 * }
 *
 * @SoftDelete()
 * class Post extends ApplicationModel {}
 * ```
 *
 * If you would like to use a different column to hold the
 * deleted status, you can specify a custom column in your model,
 * like so:
 *
 * @SoftDelete()
 * class Post extends ApplicationModel {
 *   public get deletedAtField() {
 *     return 'customDatetimeField' as const
 *   }
 * }
 *
 * Note on indexing: Dream deliberately does not index `deleted_at`.
 * The default scope's `WHERE deleted_at IS NULL` matches nearly every
 * row on a healthy table, so a plain b-tree on the column is rarely
 * chosen by the planner while still costing index size and write
 * amplification, and Dream itself never issues a query such an index
 * could serve. If your app needs one, add it yourself based on your
 * own access patterns — on Postgres, the two useful shapes are a
 * composite partial index on your hot lookup columns with
 * `WHERE deleted_at IS NULL` (fast scoped reads), or a partial index
 * `WHERE deleted_at IS NOT NULL` (purge/GC sweeps over soft-deleted
 * rows). Both are Postgres-specific syntax.
 */
export default function SoftDelete() {
  return function (target: typeof Dream): void {
    if (target['isSTIChild']) throw new StiChildIncompatibleWithSoftDeleteDecorator(target)

    target['softDelete'] = true
    ;(target as any)[SOFT_DELETE_SCOPE_NAME] = function (query: Query<any, any>) {
      return query.where({ [target.prototype['_deletedAtField']]: null } as any)
    }

    scopeImplementation(target, SOFT_DELETE_SCOPE_NAME, { default: true })
  }
}
