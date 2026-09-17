import Dream from '../../../Dream.js'
import { DecoratorContext } from '../../DecoratorContextType.js'
import scopeArray from './helpers/scopeArray.js'

/**
 * Marks an integer column as a sortable position: Dream keeps the positions of
 * every record in a sort scope contiguous, starting at 1, as records are
 * created, moved, destroyed and undestroyed.
 *
 * ```ts
 * class Post extends ApplicationModel {
 *   @deco.Sortable({ scope: 'user' })
 *   public position: number
 * }
 *
 * await post.update({ position: 2 }) // the records at 2 and above shift up
 * ```
 *
 * A position past the end of the scope is clamped to the end, and a position
 * below 1 — or none at all — lands the record at the end.
 *
 * **A save that changes the sort scope ignores a position given alongside it.**
 * The record lands at the end of the scope it moves into, whatever position the
 * same `update` supplied:
 *
 * ```ts
 * await post.update({ user: otherUser, position: 1 })
 * // post is now the last record in otherUser's scope, not the first
 * ```
 *
 * Move it in two saves to place it: `await post.update({ user: otherUser })`,
 * then `await post.update({ position: 1 })`.
 *
 * Sortable requires a query driver that supports advisory transaction locks —
 * the `PostgresQueryDriver` does — since every position write serializes the
 * writers of its sort scope on one. This concurrency guarantee first shipped
 * in Dream 2.28.0 and begins only after every writer is running a lock-aware
 * release. During the first rolling deployment, older processes take no
 * advisory locks and can still race the upgraded processes.
 *
 * All participating Dream writers of one hot scope serialize. Ordinary saves
 * and destroys with `skipHooks`, direct query writes, raw SQL, and older
 * pre-lock Dream processes bypass Sortable maintenance and do not participate
 * in its locking protocol. Undestroy still performs stabilized Sortable
 * maintenance and acquires scope locks with `skipHooks: true`; locked query
 * batches likewise acquire their scope locks during preflight, before any
 * per-record callbacks, even when those callbacks skip hooks. A waiter that
 * enters the protocol holds a pooled connection until the holder finishes or
 * `sortableScopeLockTimeout` expires; sustained contention can therefore
 * produce latency waves, timeouts, and pool starvation. Keep database work
 * inside the lock window short, and avoid cross-region database latency for
 * hot scopes.
 *
 * PostgreSQL advisory locks share the cluster-wide lock pool with regular
 * locks. Dream limits each transaction to 40 distinct Sortable scope locks by
 * default through `sortableMaxScopeLocksPerTransaction`. This is a framework
 * safety policy, not a mathematically safe PostgreSQL threshold. Reduce
 * transaction breadth or a locked query's `batchSize` before cautiously
 * raising it based on database provisioning and concurrent workload.
 *
 * `SortableScopeDidNotStabilize` and `SortableScopeLockWaitTimedOut` are the
 * expected Dream errors an application may choose to retry. Database deadlocks
 * remain native adapter errors (for example PostgreSQL code `40P01` or MySQL
 * errno `1213`) so their driver fields and stacks remain intact. A database
 * deadlock aborts the whole transaction: retry by starting the transaction
 * again from the beginning, never by continuing it or retrying only the failed
 * statement. Recurrent deadlocks call for shorter transactions or a consistent
 * multi-resource acquisition order; they do not by themselves prove Sortable
 * caused the cycle.
 *
 * ```ts
 * import {
 *   SortableScopeDidNotStabilize,
 *   SortableScopeLockWaitTimedOut,
 * } from '@rvoh/dream/errors'
 *
 * const runTransaction = async () =>
 *   await ApplicationModel.transaction(async txn => {
 *     // bind every operation in the attempt to txn
 *   })
 *
 * try {
 *   await runTransaction()
 * } catch (error) {
 *   const adapterDeadlock =
 *     (error as { code?: string }).code === '40P01' ||
 *     (error as { errno?: number }).errno === 1213
 *   const retryable =
 *     error instanceof SortableScopeDidNotStabilize ||
 *     error instanceof SortableScopeLockWaitTimedOut ||
 *     adapterDeadlock
 *   if (!retryable) throw error
 *
 *   await runTransaction() // one whole-transaction retry
 * }
 * ```
 */
export default function Sortable(opts: SortableOpts = {}): any {
  return function (_: undefined, context: DecoratorContext) {
    const key = context.name

    context.addInitializer(function (this: Dream) {
      const dream = this
      const dreamClass: typeof Dream = dream.constructor as typeof Dream
      if (!dreamClass['globallyInitializingDecorators']) return

      if (!Object.getOwnPropertyDescriptor(dreamClass, 'sortableFields')) {
        // This pattern allows `sortableFields` on a base STI class and on
        // child STI classes. The new `sortableFields` property will be created
        // on the child STI class, but it will include all the `sortableFields`
        // already declared on the base STI class.
        dreamClass['sortableFields'] = [...dreamClass['sortableFields']]
      }

      // an STI child inherits its base's sortable fields via the copy above, and
      // the base's field initializers run again while the child is globally
      // initialized, so without this guard the child registers a second config
      // for the same position field whenever the base is initialized first
      // (models are globally initialized in filesystem order). Every duplicate
      // config repeats the child's position work on each save, so positions
      // advance by the number of duplicates instead of by 1
      if (dreamClass['sortableFields'].some(conf => conf.positionField === key)) {
        return
      }

      // the decorator registers nothing but this metadata: none of a sortable
      // field's runtime work runs as hooks. A save's preparation and position
      // write run as phases in `saveDream` (`prepareSortableFieldsForSave`,
      // `performSortablePositionWork`), a destroy's lock acquisition, snapshot
      // read and compaction as phases in `destroyDream`
      // (`prepareSortableFieldsForDestroy`, `performSortableDestroyWork`), and
      // an undestroy's restore inline in `undestroyDream` — each seated
      // relative to the user's hooks by the caller, so no user hook code can
      // interleave with the position work and every after-hook observes
      // computed positions and compacted scopes
      ;(dreamClass['sortableFields'] as SortableFieldConfig[]).push({
        scope: scopeArray(opts.scope),
        positionField: key,
      })
    })
  }
}

interface SortableOpts {
  /**
   * A column name or array of column names that define the scope within which
   * position values are unique. Records are sorted independently within each scope.
   *
   * ```ts
   * @deco.Sortable({ scope: 'species' })
   * public positionWithinSpecies: number
   * ```
   */
  scope?: string | string[]
}

export interface SortableFieldConfig {
  scope: string[]
  positionField: string
}
