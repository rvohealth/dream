import Dream from '../../dream';
import DreamTransaction from '../transaction';
export default function softDeleteDream(dream: Dream, txn: DreamTransaction<any>): Promise<void>;
