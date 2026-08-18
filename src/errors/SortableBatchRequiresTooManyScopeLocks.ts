/**
 * Raised when a batch of a locked `Query#destroy` or `Query#update` on a
 * sortable model would carry its transaction past the number of advisory
 * sort-scope locks Dream is willing to hold at once.
 *
 * The batched, row-locking query APIs take every advisory scope key the batch
 * needs before they claim a single row — one key per sort scope the batch's
 * candidate records occupy, per sortable field the model declares. Advisory
 * locks live in Postgres's cluster-wide shared lock table, whose size is fixed
 * at startup (`max_locks_per_transaction` × `max_connections`), and they are
 * held until the transaction ends. A batch over a table whose sort scope has
 * very high cardinality can therefore consume a meaningful fraction of a
 * resource every other connection in the cluster shares, and exhausting it
 * fails unrelated transactions rather than only this one.
 *
 * So the preflight counts first and refuses, before claiming any row. The count
 * is the whole transaction's: the keys it already holds plus the keys the
 * refused batch would add, since advisory locks are released only when the
 * transaction ends. Inside a transaction Dream opens for the batch that is the
 * batch's own key set and nothing has been locked when this is raised; inside a
 * transaction you own, it also counts every key the run's earlier batches took,
 * and those stay held.
 *
 * The fix is almost always a smaller `batchSize`: the keys one batch needs are
 * bounded by how many distinct sort scopes its records span, so halving the
 * batch size halves the worst case. If the run itself is what accumulates them
 * — a long multi-batch run inside a transaction you opened — either let Dream
 * open a transaction per batch (do not pass a transaction of your own) or
 * commit between runs, which is what releases the locks as it goes.
 */
export default class SortableBatchRequiresTooManyScopeLocks extends Error {
  constructor(
    public dreamClassName: string,
    public keyCount: number,
    public maxKeyCount: number
  ) {
    super()
  }

  public override get message() {
    return `\
A locked batch over ${this.dreamClassName} would leave its transaction holding ${this.keyCount} sort scope locks, and the limit is ${this.maxKeyCount}.

Sortable takes one advisory lock per sort scope a batch touches, per sortable field, before the
batch claims any row, and holds them until the transaction ends. Advisory locks come out of a
lock table the whole Postgres cluster shares, so a batch that would carry its transaction past
this limit is refused rather than risking every other connection's transactions.

Use a smaller batchSize. The keys one batch needs are bounded by the number of distinct sort
scopes its records span, so a smaller batch takes proportionally fewer. If this operation runs
inside a transaction you opened, note that the locks of earlier batches are still held while
later batches preflight, and are counted here; letting Dream open a transaction per batch
releases them as it goes.
`
  }
}
