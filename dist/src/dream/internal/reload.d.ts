import Dream from '../../dream';
import DreamTransaction from '../transaction';
export default function reload<DreamInstance extends Dream>(dream: DreamInstance, txn?: DreamTransaction<Dream> | null): Promise<DreamInstance>;
