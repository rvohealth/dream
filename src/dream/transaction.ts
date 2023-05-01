import { Transaction } from 'kysely'
import { DB } from '../sync/schema'
import { HookStatement } from '../decorators/hooks/shared'
import Dream from '../dream'
import { runHook } from './internal/runHooksFor'

export interface TransactionCommitHookStatement {
  hookStatement: HookStatement
  dreamInstance: Dream
}

// though this class is called `DreamTransaction`, it is not itself
// a transaction class, as much as a collector for various callbacks
// that must be run after the underlying transaction is commited (i.e.
// AfterCreateCommit, AfterUpdateCommit, etc...).
export default class DreamTransaction {
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

  public async runAfterCommitHooks() {
    for (const hook of this.commitHooks) {
      await runHook(hook.hookStatement, hook.dreamInstance)
    }
  }
}
