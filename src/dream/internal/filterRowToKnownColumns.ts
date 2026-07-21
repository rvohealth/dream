import protectAgainstPollutingAssignment from '../../helpers/protectAgainstPollutingAssignment.js'

/**
 * @internal
 *
 * Returns a new object containing only the keys of `row` that are columns
 * the compiled schema knows about (per the provided column set).
 *
 * Under schema/image skew (e.g. a rolling deploy in which a migration adds
 * a column while containers built against the previous schema are still
 * draining, or application code is rolled back after an add-column
 * migration), a `RETURNING *` / `select *` row can include columns this
 * build has never heard of. Passing such keys to `setAttributes` would
 * assign them as plain properties — invoking a same-named user-defined
 * setter, or throwing on a getter-only property — so they must be dropped
 * before hydration.
 *
 * Keys are intersected rather than enumerated from the column set so that
 * a column missing from the row (the dropped-column direction of skew)
 * simply does not appear, rather than appearing with an `undefined` value.
 *
 * @param row - a raw database row
 * @param columns - the compiled column set for the Dream class being hydrated
 * @returns a new object containing only the known-column entries of `row`
 */
export default function filterRowToKnownColumns(
  row: Record<string, any>,
  columns: Set<string>
): Record<string, any> {
  const filtered: Record<string, any> = {}

  Object.keys(row).forEach(key => {
    if (columns.has(key)) filtered[protectAgainstPollutingAssignment(key)] = row[key]
  })

  return filtered
}
