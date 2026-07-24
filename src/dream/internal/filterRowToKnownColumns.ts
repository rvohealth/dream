import protectAgainstPollutingAssignment from '../../helpers/protectAgainstPollutingAssignment.js'

/**
 * @internal
 *
 * Returns an object containing only the keys of `row` that are columns
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
 * Identity fast path: when every key of `row` is a known column (the
 * no-skew steady state), `row` itself is returned unchanged, without
 * allocating a copy; a filtered copy is built only when at least one
 * unknown key is present.
 *
 * @param row - a raw database row
 * @param columns - the compiled column set for the Dream class being hydrated
 * @returns `row` itself when every key is a known column; otherwise a new
 * object containing only the known-column entries of `row`
 */
export default function filterRowToKnownColumns(
  row: Record<string, any>,
  columns: Set<string>
): Record<string, any> {
  const keys = Object.keys(row)

  if (keys.every(key => columns.has(key))) return row

  const filtered: Record<string, any> = {}

  keys.forEach(key => {
    if (columns.has(key)) filtered[protectAgainstPollutingAssignment(key)] = row[key]
  })

  return filtered
}
