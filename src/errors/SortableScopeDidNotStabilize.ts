/**
 * Raised when a position-mutating operation cannot settle on the sort scope its
 * record actually occupies.
 *
 * A save, destroy, undestroy or locked batch operation locks the sort scopes it
 * believes it is touching, then reads the rows to find out which scopes they
 * physically occupy. When another writer has moved a row in between, the
 * operation takes the additional scope's lock and reads again. A row that keeps
 * moving exhausts that bound, and the operation raises rather than compacting a
 * scope the row has already left.
 *
 * This is a retryable condition: retrying the operation is the intended
 * response. One caveat for saves the caller did not wrap in a transaction: the
 * model's before-hooks run before the transaction this error aborts, so any
 * effects those hooks had outside the record's own row — writes to other
 * tables, enqueued work — are not rolled back, and run again on retry.
 */
export default class SortableScopeDidNotStabilize extends Error {
  constructor(
    public dreamClassName: string,
    public rounds: number
  ) {
    super()
  }

  public override get message() {
    return `\
The sort scope of a ${this.dreamClassName} record kept changing while its position was being computed.

Sortable locks the sort scopes an operation touches and then reads the record's actual scope
under those locks, taking any additional lock the read reveals. After ${this.rounds} rounds the
record had still been moved to another scope by a competing writer, so the operation was
abandoned rather than compacting a scope the record no longer occupies. Retrying the operation
is the intended response; note that on a save the caller did not wrap in a transaction, the
model's before-hooks ran before the transaction this error aborted, so their effects outside
the record's own row are not rolled back and run again on retry.
`
  }
}
