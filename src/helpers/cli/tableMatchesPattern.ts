import { matchesGlob } from 'node:path'

/**
 * @internal
 *
 * Whether a table matches a `tableIncludePattern` or `tableExcludePattern`:
 * a glob in Node's `path.matchesGlob` syntax (e.g. `chalupas*`, `public.*`
 * or `public.+(users|posts)`), compared without regard to case. A pattern
 * that contains a `.` is matched against `<schema>.<name>`, and any other
 * against the table's name alone. As with micromatch, a leading `!` (one that
 * does not open an extglob `!(…)`) negates the pattern, and a backslash
 * escapes the character after it.
 */
export default function tableMatchesPattern(
  table: { schema: string | null; name: string },
  pattern: string
): boolean {
  if (/^!(?!\()/.test(pattern)) return !tableMatchesPattern(table, pattern.slice(1))

  const subject = pattern.includes('.') ? `${table.schema ?? '*'}.${table.name}` : table.name
  // matchesGlob does not read a backslash as an escape, so an escaped
  // character is matched through a class of that one character
  const glob = pattern.replace(/\\(.)/g, (_, character: string) =>
    character === ']' ? '[]]' : `[${character}]`
  )

  return matchesGlob(subject.toLowerCase(), glob.toLowerCase())
}
