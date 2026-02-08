import DreamApp from '../dream-app/index.js'
import Dream from '../Dream.js'
import DataTypeColumnTypeMismatch from '../errors/db/DataTypeColumnTypeMismatch.js'
import { DateTime } from '../utils/dateAndTime/DateTime.js'
import CalendarDate from './CalendarDate.js'
import isDatetimeOrDatetimeArrayColumn from './db/types/isDatetimeOrDatetimeArrayColumn.js'
import isTextOrTextArrayColumn from './db/types/isTextOrTextArrayColumn.js'
import normalizeUnicode from './normalizeUnicode.js'

export default function sqlAttributes(dream: Dream) {
  const attributes = dream.dirtyAttributes()
  const dreamClass = dream.constructor as typeof Dream
  const queryDriverClass = DreamApp.getOrFail().dbConnectionQueryDriverClass(dream.connectionName)

  return Object.keys(attributes).reduce(
    (result, key) => {
      let val = attributes[key]
      if (val === undefined) return result

      if (Array.isArray(val)) {
        if (isDatetimeOrDatetimeArrayColumn(dreamClass, key))
          val = val.map(aVal => valueToDatetime(dream, aVal))
        else if (isTextOrTextArrayColumn(dreamClass, key)) val = val.map(normalizeUnicode)
      } else {
        if (isDatetimeOrDatetimeArrayColumn(dreamClass, key)) val = valueToDatetime(dream, val)
        else if (isTextOrTextArrayColumn(dreamClass, key)) val = normalizeUnicode(val)
      }

      if (val instanceof DateTime || val instanceof CalendarDate) {
        const dateOrDatetime = val instanceof DateTime ? 'datetime' : 'date'
        // Converting toJSDate resulted in the correct timezone, but even with process.env.TZ=UTC,
        // Kysely inserted into the database with the machine timezone, which can shift the date
        // (e.g., toJSDate resulted in a JS Date that formats as "1987-04-07T00:00:00.000Z", but
        // Kysely inserted "1907-04-06"  into the database). By converting to an SQL string before
        // handing off to Kysely, we bypass Javascript dates altogether, sending the string into the
        // database for storage as a date or datetime.
        result[key] = queryDriverClass.serializeDbType(dateOrDatetime, val)
      } else {
        result[key] = val
      }

      return result
    },
    {} as { [key: string]: any }
  )
}

/**
 * Convert datetimes to UTC
 */
function valueToDatetime(dream: Dream, val: any) {
  if (typeof val !== 'string') return val
  let datetime: DateTime

  try {
    datetime = DateTime.fromISO(val, { zone: 'UTC' })
  } catch (error) {
    throw new DataTypeColumnTypeMismatch({
      dream,
      error: error instanceof Error ? error : new Error('database column type error'),
    })
  }

  return datetime.isValid ? datetime : val
}
