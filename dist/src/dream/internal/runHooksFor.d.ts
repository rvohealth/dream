import { HookStatement, HookType } from '../../decorators/hooks/shared';
import Dream from '../../dream';
import DreamTransaction from '../transaction';
export default function runHooksFor<T extends Dream>(key: HookType, dream: T, alreadyPersisted: boolean, beforeSaveChanges: Partial<Record<string, {
    was: any;
    now: any;
}>> | null, txn?: DreamTransaction<any>): Promise<void>;
export declare function runHook<T extends Dream>(statement: HookStatement, dream: T, txn?: DreamTransaction<any>): Promise<void>;
