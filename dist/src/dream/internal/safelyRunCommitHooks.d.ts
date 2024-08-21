import { CommitHookType } from '../../decorators/hooks/shared';
import Dream from '../../dream';
import DreamTransaction from '../transaction';
export default function safelyRunCommitHooks<DreamInstance extends Dream>(dream: DreamInstance, hookType: CommitHookType, alreadyPersisted: boolean, beforeSaveChanges: Partial<Record<string, {
    was: any;
    now: any;
}>> | null, txn?: DreamTransaction<Dream> | null): Promise<void>;
