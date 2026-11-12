import { Transaction } from 'kysely'
import Dream from '../Dream.js'
import { HookStatement } from '../types/lifecycle.js'
import { runCommitHook } from './internal/runHooksFor.js'

export interface TransactionCommitHookStatement {
  hookStatement: HookStatement
  dreamInstance: Dream
}

// though this class is called `DreamTransaction`, it is not itself
// a transaction class, as much as a collector for various callbacks
// that must be run after the underlying transaction is commited (i.e.
// AfterCreateCommit, AfterUpdateCommit, etc...).
export default class DreamTransaction<T extends Dream, DB extends T['DB'] = T['DB']> {
  private _kyselyTransaction: Transaction<DB>
  private commitHooks: TransactionCommitHookStatement[] = []

  // Set when the query driver starts the commit hooks, which it does only once
  // the transaction has committed. Read through `isCommitted`.
  private committed = false

  /**
   * Whether this transaction's COMMIT succeeded.
   *
   * Commit hooks (AfterCreateCommit, AfterUpdateCommit, AfterSaveCommit,
   * AfterDestroyCommit) run after COMMIT, so when one throws,
   * `ApplicationModel.transaction` rejects with that hook's error even though
   * the transaction's writes are already in the database. Keep the
   * transaction in an outer variable to tell the two apart after the
   * rejection:
   *
   * ```ts
   * let transaction = null as DreamTransaction<ApplicationModel> | null
   *
   * try {
   *   await ApplicationModel.transaction(async txn => {
   *     transaction = txn
   *     await User.txn(txn).create({ email: 'how@yadoin' })
   *   })
   * } catch (error) {
   *   if (transaction?.isCommitted) {
   *     // the user was created; a commit hook threw afterward
   *   }
   *   throw error
   * }
   * ```
   *
   * `true` means COMMIT succeeded; a commit hook may have thrown since.
   *
   * `false` means COMMIT has not succeeded as far as Dream knows: the
   * transaction is still open, its callback threw, or the database refused
   * the COMMIT. It does not prove the transaction was rolled back, since a
   * connection lost during COMMIT can leave the outcome unknown.
   */
  public get isCommitted(): boolean {
    return this.committed
  }

  public get kyselyTransaction() {
    return this._kyselyTransaction
  }

  public set kyselyTransaction(txn: Transaction<DB>) {
    this._kyselyTransaction = txn
  }

  public addCommitHook(hookStatement: HookStatement, dreamInstance: Dream) {
    this.commitHooks.push({ dreamInstance, hookStatement })
  }

  /**
   * Runs the commit hooks queued during the transaction, in the order they
   * were queued. A query driver calls this once the transaction has
   * committed. Each hook is called with no argument, since the transaction
   * it would otherwise receive can no longer run queries.
   */
  public async runAfterCommitHooks() {
    this.committed = true

    for (const hook of this.commitHooks) {
      await runCommitHook(hook.hookStatement, hook.dreamInstance)
    }
  }
}
