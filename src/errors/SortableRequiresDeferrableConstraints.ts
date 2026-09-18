/**
 * Raised when a model declaring sortable fields is used on a query driver whose
 * database cannot defer a unique constraint to commit time.
 *
 * Sortable's position writes pass through transiently duplicated positions, and
 * the optimistic cascade paths rely on a commit-time check to turn a concurrent
 * intruder into a clean abort rather than a committed duplicate. A driver
 * without deferred constraint checking fails loudly here rather than committing
 * a duplicate position.
 */
export default class SortableRequiresDeferrableConstraints extends Error {
  constructor(private queryDriverClassName: string) {
    super()
  }

  public override get message() {
    return `\
${this.queryDriverClassName} cannot be used with the Sortable decorator.

Sortable writes positions that are transiently duplicated within a sort scope, and
relies on a \`DEFERRABLE INITIALLY DEFERRED\` unique constraint — the one
\`DreamMigrationHelpers.addDeferrableUniqueConstraint\` declares — to check the scope
once, at commit. On a database that checks per statement those writes are rejected
mid transaction, and a cascade's optimistic position work loses the clean abort it
depends on. Set \`supportsDeferrableConstraints = true\` on
${this.queryDriverClassName} once its database defers constraint checks, or use the
PostgresQueryDriver for models that declare sortable fields.
`
  }
}
