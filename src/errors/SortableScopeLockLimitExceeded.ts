import type { SortableTransactionOrigin } from '../decorators/field/sortable/helpers/heldSortableScopeLockKeys.js'

/** @internal */
export default class SortableScopeLockLimitExceeded extends Error {
  constructor(
    private dreamClassName: string,
    private attemptedLockCount: number,
    private configuredLimit: number,
    private newlyRequestedLockCount: number,
    private origin: SortableTransactionOrigin | undefined
  ) {
    super()
    this.name = 'SortableScopeLockLimitExceeded'
  }

  public override get message() {
    return `\
A ${this.dreamClassName} Sortable acquisition would make this transaction hold ${this.attemptedLockCount} distinct Sortable scope locks, but the configured limit is ${this.configuredLimit}.

The acquisition was refused before adding its ${this.newlyRequestedLockCount} newly requested ${this.newlyRequestedLockCount === 1 ? 'lock' : 'locks'}. Any
Sortable locks this transaction already holds remain held until the transaction ends. On PostgreSQL,
these advisory locks share the cluster-wide lock pool with regular locks.

${this.originGuidance()}

Do not catch this specific ceiling failure as an ongoing retry or control-flow mechanism. Permanently
reduce the operation's transaction breadth. Only raise \`sortableMaxScopeLocksPerTransaction\` cautiously,
after database provisioning and concurrent workload have been evaluated.
`
  }

  private originGuidance() {
    if (this.origin?.type === 'locked-batch') {
      return `Dream aborts this locked batch transaction. Configure a smaller batchSize so each batch touches fewer distinct Sortable scopes.`
    }

    if (this.origin?.type === 'operation') {
      return `Dream aborts this ${this.origin.operation} transaction. Permanently reduce the ${this.origin.operation} or cascade breadth so the operation needs fewer distinct Sortable scopes.`
    }

    return `This ran inside a transaction you opened. Loops across many Sortable scopes are a common cause. The transaction must end; permanently reduce the transaction breadth, or avoid one shared transaction when atomicity is unnecessary.`
  }
}
