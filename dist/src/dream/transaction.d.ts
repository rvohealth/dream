import { Transaction } from 'kysely';
import { HookStatement } from '../decorators/hooks/shared';
import Dream from '../dream';
export interface TransactionCommitHookStatement {
    hookStatement: HookStatement;
    dreamInstance: Dream;
}
export default class DreamTransaction<T extends Dream, DB extends T['DB'] = T['DB']> {
    private _kyselyTransaction;
    private commitHooks;
    get kyselyTransaction(): Transaction<DB>;
    set kyselyTransaction(txn: Transaction<DB>);
    addCommitHook(hookStatement: HookStatement, dreamInstance: Dream): void;
    runAfterCommitHooks(txn: DreamTransaction<any>): Promise<void>;
}
