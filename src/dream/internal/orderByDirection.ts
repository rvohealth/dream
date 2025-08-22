import { OrderByItemBuilder } from 'kysely'
import { OrderDir } from '../../types/dream.js'

export default function orderByDirection(
  dir: OrderDir | null
): (obj: OrderByItemBuilder) => OrderByItemBuilder {
  switch (dir) {
    case 'asc':
    case null:
      return (obj: OrderByItemBuilder) => obj.asc().nullsFirst()

    case 'desc':
      return (obj: OrderByItemBuilder) => obj.desc().nullsLast()

    default: {
      // protection so that if a new OrderDir is ever added, this will throw a type error at build time
      const _never: never = dir
      throw new Error(`Unhandled OrderDir: ${_never as string}`)
    }
  }
}
