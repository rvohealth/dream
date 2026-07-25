export default class RowLockIncompatibleWithDistinct extends Error {
  public override get message() {
    // `SELECT DISTINCT ON (...) ... FOR UPDATE` is rejected by the database
    // ("FOR UPDATE is not allowed with DISTINCT clause"), so fail here, with a
    // message that names the two incompatible parts, rather than surfacing a
    // raw driver error from inside a per-batch transaction.
    return `
An exclusive row lock was requested on a query that also calls \`distinct\`.

A locked read cannot be combined with DISTINCT. Drop the \`distinct\` call, or
drop the lock.
`
  }
}
