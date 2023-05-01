import { Transaction } from 'kysely'
import { DB } from '../sync/schema'
import { HookStatement } from '../decorators/hooks/shared'
import Dream from '../dream'
import runHooksFor, { runHook } from './internal/runHooksFor'
import db from '../db'

export interface TransactionCommitHookStatement {
  hookStatement: HookStatement
  dreamInstance: Dream
}

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

  // public async execute(callback: (txn: DreamTransaction) => Promise<void>) {
  //   let kyselyTransaction: Transaction<DB>
  //   await db.transaction().execute(async txn => {
  //     kyselyTransaction = txn
  //     callback(this)
  //   })
  // }

  public async runAfterCommitHooks() {
    for (const hook of this.commitHooks) {
      await runHook(hook.hookStatement, hook.dreamInstance)
    }
  }
}
