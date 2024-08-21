import Dream from '../../dream';
import { AfterHookOpts } from './shared';
/**
 * Calls the decorated method whenever a dream has finished
 * being updated. If the save takes place within a transaction,
 * this method will not be called until the transaction is
 * committed. However, if the save is not taking place in
 * a transaction, the method will be run after the save
 * is complete.
 *
 * class User extends ApplicationModel {
 *   @AfterUpdateCommit()
 *   public doSomething() {
 *     ...
 *   }
 * }
 *
 * @param opts.ifChanged - Optional. A list of columns which should must change in order for this function to be called.
 */
export default function AfterUpdateCommit<T extends Dream | null = null>(opts?: AfterHookOpts<T>): any;
