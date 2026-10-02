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
    for (const hook of this.commitHooks) {
      await runCommitHook(hook.hookStatement, hook.dreamInstance)
    }
  }
}
