/**
 * Raised when a model declaring sortable fields is used on a query driver that
 * cannot take transaction-scoped advisory locks.
 *
 * Sortable computes position values under a lock on the sort scope, without
 * which concurrent writers collide on the same position. A driver that cannot
 * provide that lock fails loudly here rather than racing silently.
 */
export default class SortableRequiresAdvisoryTransactionLocks extends Error {
  constructor(private queryDriverClassName: string) {
    super()
  }

  public override get message() {
    return `\
${this.queryDriverClassName} cannot be used with the Sortable decorator.

Sortable computes position values under a transaction-scoped advisory lock on the sort
scope, without which concurrent writers collide on the same position. Implement
\`acquireAdvisoryTransactionLocks\` on ${this.queryDriverClassName} and set
\`supportsAdvisoryTransactionLocks = true\`, or use the PostgresQueryDriver for models
that declare sortable fields.
`
  }
}
