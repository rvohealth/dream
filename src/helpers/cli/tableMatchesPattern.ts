import { matchesGlob } from 'node:path'

/**
 * @internal
 *
 * Whether a table matches a `tableIncludePattern` or `tableExcludePattern`:
 * a glob in Node's `path.matchesGlob` syntax (e.g. `chalupas*`, `public.*`
 * or `public.+(users|posts)`), compared without regard to case. A pattern
 * that contains a `.` is matched against `<schema>.<name>`, and any other
 * against the table's name alone.
 */
export default function tableMatchesPattern(table: { schema: string | null; name: string }, pattern: string) {
  const subject = pattern.includes('.') ? `${table.schema ?? '*'}.${table.name}` : table.name
  return matchesGlob(subject.toLowerCase(), pattern.toLowerCase())
}
