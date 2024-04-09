import { sql } from 'kysely'
import { OrderDir } from '../types'

export default function orderByDirection(dir: OrderDir | null) {
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
