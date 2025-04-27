import Dream from '../Dream.js'
import CalendarDate from './CalendarDate.js'
import { DateTime } from './DateTime.js'
import isDatetimeOrDatetimeArrayColumn from './db/types/isDatetimeOrDatetimeArrayColumn.js'
import isTextOrTextArrayColumn from './db/types/isTextOrTextArrayColumn.js'
import normalizeString from './normalizeString.js'
import { isString } from './typechecks.js'

export default function sqlAttributes(dream: Dream) {
  const attributes = dream.dirtyAttributes()
  const dreamClass = dream.constructor as typeof Dream

  return Object.keys(attributes).reduce(
    (result, key) => {
      let val = attributes[key]
      if (val === undefined) return result

      if (Array.isArray(val)) {
        if (isDatetimeOrDatetimeArrayColumn(dreamClass, key)) val = val.map(valueToDatetime)
        else if (isTextOrTextArrayColumn(dreamClass, key)) val = val.map(normalizeString)
      } else {
        if (isDatetimeOrDatetimeArrayColumn(dreamClass, key)) val = valueToDatetime(val)
        else if (isTextOrTextArrayColumn(dreamClass, key)) val = normalizeString(val)
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

function valueToDatetime(val: any) {
  return isString(val) ? DateTime.fromISO(val, { zone: 'UTC' }) : val
}
