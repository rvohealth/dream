import { sql } from 'kysely'
import { OrderDir } from '../../types/dream.js'

export default function orderByDirection(dir: OrderDir | null) {
  switch (dir) {
    case 'asc':
    case null:
      return sql`asc nulls first`

    case 'desc':
      return sql`desc nulls last`

    default: {
      // protection so that if a new OrderDir is ever added, this will throw a type error at build time
      const _never: never = dir
      throw new Error(`Unhandled OrderDir: ${_never as string}`)
    }
  }
}
