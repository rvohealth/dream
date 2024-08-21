/**
 * Calls the decorated method whenever a dream has finished
 * being destroyed. If the destroy takes place within a transaction,
 * this method will not be called until the transaction is
 * committed. However, if the destroy is not taking place in
 * a transaction, the method will be run after the save
 * is complete.
 *
 * class User extends ApplicationModel {
 *   @AfterDestroyCommit()
 *   public doSomething() {
 *     ...
 *   }
 * }
 */
export default function AfterDestroyCommit(): any;
