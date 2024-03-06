import { sql } from 'kysely'

export default function orderByDirection(dir: 'asc' | 'desc' | null) {
  switch (dir) {
    case 'asc':
    case null:
      return sql`asc nulls last`

    case 'desc':
      return sql`desc nulls last`

    default:
      throw new Error(`Unrecognized orderBy direction: ${dir}`)
  }
}
