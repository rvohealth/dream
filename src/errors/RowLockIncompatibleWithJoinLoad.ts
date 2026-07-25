export default class RowLockIncompatibleWithJoinLoad extends Error {
  public override get message() {
    // A join load builds its own select statement (one row per joined
    // association row, later collapsed in memory), which cannot carry the
    // Query's row lock. Rather than silently performing an unlocked read and
    // dropping the compare-and-set guarantee the caller asked for, refuse.
    return `
An exclusive row lock was requested on a query that also uses leftJoinPreload.

A join-loaded query cannot be locked. Use \`preload\` instead of
\`leftJoinPreload\`, or drop the lock.
`
  }
}
