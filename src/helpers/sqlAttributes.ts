import Dream from '../Dream.js'
import CalendarDate from './CalendarDate.js'
import { DateTime } from './DateTime.js'
import isDateTimeColumn from './db/types/isDateTimeColumn.js'
import { isString } from './typechecks.js'

export default function sqlAttributes(dream: Dream) {
  const attributes = dream.dirtyAttributes()
  const dreamClass = dream.constructor as typeof Dream

  return Object.keys(attributes).reduce(
    (result, key) => {
      let val = attributes[key]
      if (val === undefined) return result

      if (Array.isArray(val)) {
        if (isDateTimeColumn(dreamClass, key)) val = val.map(valueToDateTimeColumnValue)
      } else {
        if (isDateTimeColumn(dreamClass, key)) val = valueToDateTimeColumnValue(val)
      }

      if (val instanceof DateTime || val instanceof CalendarDate) {
        // Converting toJSDate resulted in the correct timezone, but even with process.env.TZ=UTC,
        // Kysely inserted into the database with the machine timezone, which can shift the date
        // (e.g., toJSDate resulted in a JS Date that formats as "1987-04-07T00:00:00.000Z", but
        // Kysely inserted "1907-04-06"  into the database). By converting to an SQL string before
        // handing off to Kysely, we bypass Javascript dates altogether, sending the string into the
        // database for storage as a date or datetime.
        result[key] = val.toSQL()
      } else {
        result[key] = val
      }

      return result
    },
    {} as { [key: string]: any }
  )
}

function valueToDateTimeColumnValue(val: any) {
  return isString(val) ? DateTime.fromISO(val, { zone: 'UTC' }) : val
}
