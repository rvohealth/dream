import Dream from '../../dream';
import DreamTransaction from '../transaction';
import { DestroyOptions as OptionalDestroyOptions } from './destroyOptions';
type DestroyOptions<DreamInstance extends Dream> = Required<OptionalDestroyOptions<DreamInstance>>;
export interface ReallyDestroyOptions<DreamInstance extends Dream> extends DestroyOptions<DreamInstance> {
    reallyDestroy: boolean;
}
/**
 * @internal
 *
 * Destroys the Dream and any `dependent: 'destroy'` associations
 * within a transaction. If a transaction is passed, it will be used.
 * Otherwise, a new transaction will be created automatically.
 * If any of the nested associations fails to destroy, then this
 * record will also fail to destroy. If skipHooks is true, model hooks
 * will be bypassed.
 */
export default function destroyDream<I extends Dream>(dream: I, txn: DreamTransaction<I, I["DB"]> | null | undefined, options: ReallyDestroyOptions<I>): Promise<I>;
export {};
