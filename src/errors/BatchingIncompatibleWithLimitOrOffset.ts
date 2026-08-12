export default class BatchingIncompatibleWithLimitOrOffset extends Error {
  public override get message() {
    // batched iteration re-applies the Query's conditions to every batch
    // window, so a limit or offset would be re-applied per batch — skipping or
    // truncating rows inside each window — rather than bounding the run as a
    // whole; and a single-statement set update has no way to express a limit
    // or offset in SQL. Silently clearing them instead would touch rows the
    // caller asked to scope out, so fail loudly before any row is touched.
    return `
A batched or set-write operation was called on a query carrying a \`limit\`
or \`offset\`.

These operations process the entire matched set, so a limit or offset cannot
be honored: batched iteration re-applies the query's conditions to every
batch window, where the limit or offset would be re-applied per batch —
silently skipping or truncating rows within each window instead of bounding
the run as a whole — and a single-statement set update cannot express a
limit or offset in SQL at all.

fix:
  remove the \`limit\`/\`offset\` from the query, and scope the affected rows
  with \`where\` conditions instead
`
  }
}
