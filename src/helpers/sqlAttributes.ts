import { DateTime } from 'luxon'
import Dream from '../dream'
import isDate from './db/types/isDateColumn'

export default function sqlAttributes(dream: Dream) {
  const attributes = dream.dirtyAttributes()

  return Object.keys(attributes).reduce(
    (result, key) => {
      let val = attributes[key]

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
