import DreamApp from '../../dream-app/index.js'
import Dream from '../../Dream.js'
import DreamTransaction from '../DreamTransaction.js'

/**
 * How many times a destroy or undestroy that opened its own transaction runs
 * before a failure caused by a concurrent writer escapes. One such failure
 * needs another writer of the same rows or sort scope during the operation;
 * three in a row is contention past the point of retrying.
 */
export const MAX_CONCURRENT_WRITER_ATTEMPTS = 3

/**
 * @internal
 *
 * Runs `callback` in a transaction of the model's own, and runs it again when
 * that transaction is undone by a concurrent writer: a deadlock, or a unique
 * constraint refusing the COMMIT.
 *
 * A cascaded destroy or undestroy does its sortable position work without the
 * scope lock a direct one takes (see `@deco.Sortable`), so a concurrent writer
 * of the same sort scope can leave two live rows sharing a position, which the
 * scope's deferrable unique constraint refuses at COMMIT — or, when both
 * writers reach COMMIT together, as a deadlock between their two checks. A
 * cascade holding row locks can deadlock against another writer of the same
 * rows mid-statement as well. Either way the database has undone the whole
 * transaction, nothing has committed and no commit hook has run, so running
 * the operation again reads the rows as the other writer left them. The last
 * attempt's error is the adapter's own.
 *
 * A unique violation raised by a statement inside the callback is not a
 * collision but a write that violates a constraint outright, and is not
 * retried; only a refusal of the COMMIT itself is, which is why the callback
 * having resolved is part of the test.
 *
 * Only a transaction Dream opens is retried. Inside a caller's transaction the
 * failure is the caller's, and the caller retries the whole transaction.
 */
export default async function withConcurrentWriterRetry<R>(
  dreamClass: typeof Dream,
  callback: (txn: DreamTransaction<any>) => Promise<R>
): Promise<R> {
  const queryDriverClass = DreamApp.getOrFail().dbConnectionQueryDriverClass(
    dreamClass.prototype.connectionName
  )

  for (let attempt = 1; ; attempt++) {
    let callbackResolved = false

    try {
      return await dreamClass.transaction(async txn => {
        const result = await callback(txn)
        callbackResolved = true
        return result
      })
    } catch (error) {
      const undoneByConcurrentWriter =
        queryDriverClass.isDeadlock(error) ||
        (callbackResolved && queryDriverClass.isUniqueConstraintViolation(error))

      if (!undoneByConcurrentWriter || attempt === MAX_CONCURRENT_WRITER_ATTEMPTS) throw error
    }
  }
}
