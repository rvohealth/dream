import Dream from '../../Dream.js'
import DataTypeColumnTypeMismatch from '../../errors/db/DataTypeColumnTypeMismatch.js'
import CalendarDate from '../../utils/datetime/CalendarDate.js'
import ClockTime from '../../utils/datetime/ClockTime.js'
import { DateTime } from '../../utils/datetime/DateTime.js'
import normalizeUnicode from '../normalizeUnicode.js'
import {
  DATETIME_OR_DATETIME_ARRAY_COLUMN_CHECK_REGEXP,
  TIME_WITH_TIMEZONE_COLUMN_CHECK_REGEXP,
  TIME_WITHOUT_TIMEZONE_COLUMN_CHECK_REGEXP,
} from './types/helpers.js'

export function normalizeDataForDb({
  val,
  dreamClass,
  column,
}: {
  val: unknown
  dreamClass: typeof Dream
  column: string
}): unknown {
  const columnType = dreamClass['cachedTypeFor'](column)
  if (val instanceof DateTime || DATETIME_OR_DATETIME_ARRAY_COLUMN_CHECK_REGEXP.test(columnType)) {
    return dateTimeOrDateToSql(DateTime, val as any)
    //
  } else if (val instanceof CalendarDate || /^date/.test(columnType)) {
    return dateTimeOrDateToSql(CalendarDate, val as any)
    //
  } else if (TIME_WITH_TIMEZONE_COLUMN_CHECK_REGEXP.test(columnType)) {
    return timeToSql(val as any, { includeOffset: true })
    //
  } else if (val instanceof ClockTime || TIME_WITHOUT_TIMEZONE_COLUMN_CHECK_REGEXP.test(columnType)) {
    /**
     * Test instanceof ClockTime only after first checking against time with time zone
     * If we match against ClockTime, consider it time without time zone since
     * that is a more common use case for a time column (as opposed to a datetime column)
     */
    return timeToSql(val as any, { includeOffset: false })
    //
  } else if (typeof val === 'string' || /^(text|character varying|citext)/.test(columnType)) {
    return normalizedString(val as any)
    //
  } else {
    return val
  }
}

function normalizedString(_val: string | string[]) {
  const alreadyAnArray = Array.isArray(_val)
  const normalizedValueArray = (alreadyAnArray ? _val : [_val]).map(val =>
    typeof val === 'string' ? normalizeUnicode(val) : val
  )

  return alreadyAnArray ? normalizedValueArray : normalizedValueArray[0]
}

function dateTimeOrDateToSql(
  dateClass: typeof DateTime | typeof CalendarDate,
  _val: string | string[] | (DateTime | CalendarDate) | (DateTime | CalendarDate)[]
) {
  const alreadyAnArray = Array.isArray(_val)
  const normalizedValueArray = (alreadyAnArray ? _val : [_val]).map(val => {
    if (val instanceof DateTime || val instanceof CalendarDate) return val.toSQL()
    if (typeof val !== 'string') return val

    try {
      return dateClass.fromISO(val, { zone: 'UTC' }).toSQL()
    } catch (error) {
      throw new DataTypeColumnTypeMismatch(
        error instanceof Error ? error : new Error('database column type error: invalid DateTime')
      )
    }
  })

  return alreadyAnArray ? normalizedValueArray : normalizedValueArray[0]
}

function timeToSql(
  _val: string | string[] | ClockTime | ClockTime[],
  { includeOffset }: { includeOffset: boolean }
) {
  const alreadyAnArray = Array.isArray(_val)
  const normalizedValueArray = (alreadyAnArray ? _val : [_val]).map(val => {
    if (val instanceof ClockTime) return val.toSQL({ includeOffset })
    if (typeof val !== 'string') return val

    try {
      return ClockTime.fromISO(val, { zone: 'UTC' }).toSQL({ includeOffset })
    } catch (error) {
      throw new DataTypeColumnTypeMismatch(
        error instanceof Error ? error : new Error('database column type error: invalid ClockTime')
      )
    }
  })

  return alreadyAnArray ? normalizedValueArray : normalizedValueArray[0]
}
