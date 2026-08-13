/**
 * Raised when a position-mutating operation waited too long for another
 * transaction to release a sort scope.
 *
 * Every position-mutating path — a save, a destroy, an undestroy, a locked
 * batch, `Dream.resort` — computes its positions under an exclusive advisory
 * lock on the sort scope, held until the transaction that took it ends. A
 * writer that finds the scope already locked waits, and that wait is bounded:
 * Dream applies a `lock_timeout` (5 seconds by default, set through the
 * `sortableScopeLockTimeout` DreamApp option) to the acquisition statement
 * alone, and restores whatever `lock_timeout` was in effect afterward, so the
 * transaction's other lock waits — row locks taken by `lock: true`, foreign key
 * checks — are left exactly as the application configured them.
 *
 * This is a retryable condition: the operation touched nothing, and the holder
 * it was waiting for is a transaction that will end. What has to be retried
 * depends on who owns the transaction. When Dream opened it — a plain
 * `save()`, `destroy()`, `undestroy()` or `resort()` — only that call was rolled
 * back, and retrying the call is the whole response. Inside a transaction the
 * caller owns, the failed statement aborts **the entire transaction**: nothing
 * further can run on it, and the caller has to retry the transaction as a whole
 * rather than the sortable operation inside it.
 *
 * Hitting this bound routinely is a signal rather than a transient: it means one
 * sort scope is being written by more concurrent writers than it can serialize,
 * or that something slow is running inside a transaction that holds the scope —
 * on a destroy or an undestroy, that includes your own `afterDestroy` and
 * `afterUpdate` hooks, which run inside the lock window.
 */
export default class SortableScopeLockWaitTimedOut extends Error {
  constructor(public timeoutMs: number) {
    super()
  }

  public override get message() {
    return `\
Timed out after ${this.timeoutMs}ms waiting for another transaction to release a sort scope.

Sortable computes positions under an exclusive advisory lock on the sort scope, held until the
transaction holding it ends. This operation waited the configured bound and gave up rather than
waiting indefinitely; it changed nothing, and retrying it is the intended response — but if the
transaction this ran in was one you opened yourself, the whole transaction is aborted and has to
be retried as a whole.

Change the bound with \`dreamApp.set('sortableScopeLockTimeout', milliseconds)\` in your Dream
configuration, or set it to 0 to wait without bound.
`
  }
}
