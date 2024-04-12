import { DateTime } from 'luxon'
import Dream from '../dream'

export default function sqlAttributes(dream: Dream) {
  const attributes = dream.dirtyAttributes()

  return Object.keys(attributes).reduce(
    (result, key) => {
      const val = attributes[key]

      if (val?.constructor === DateTime) {
        result[key] = val.toJSDate()
      } else if (val !== undefined) {
        result[key] = val
      }

      return result
    },
    {} as { [key: string]: any }
  )
}
