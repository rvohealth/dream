import Dream from '../../dream';
import DreamTransaction from '../transaction';
import { ReallyDestroyOptions } from './destroyDream';
/**
 * @internal
 *
 * Destroys all HasOne/HasMany associations on this
 * dream that are marked as `dependent: 'destroy'`
 */
export default function destroyAssociatedRecords<I extends Dream>(dream: I, txn: DreamTransaction<I>, options: ReallyDestroyOptions<I>): Promise<void>;
