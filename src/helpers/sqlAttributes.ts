import Dream from '../Dream.js'
import { normalizeDataForDb } from './db/normalizeDataForDb.js'

export default function sqlAttributes(dream: Dream) {
  const attributes = dream.dirtyAttributes()
  const dreamClass = dream.constructor as typeof Dream

  return Object.keys(attributes).reduce(
    (result, column) => {
      const val = attributes[column]
      if (val === undefined) return result
      result[column] = normalizeDataForDb({ val, dreamClass, column })
      return result
    },
    {} as { [key: string]: any }
  )
}
