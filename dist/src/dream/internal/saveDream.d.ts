import Dream from '../../dream';
import DreamTransaction from '../transaction';
export default function saveDream<DreamInstance extends Dream>(dream: DreamInstance, txn?: DreamTransaction<Dream> | null, { skipHooks }?: {
    skipHooks?: boolean;
}): Promise<DreamInstance>;
