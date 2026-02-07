import Dream from '../../Dream.js'
import DataTypeColumnTypeMismatch from '../../errors/db/DataTypeColumnTypeMismatch.js'
import BaseClockTime from '../../utils/datetime/BaseClockTime.js'
import CalendarDate from '../../utils/datetime/CalendarDate.js'
import ClockTime from '../../utils/datetime/ClockTime.js'
import ClockTimeTz from '../../utils/datetime/ClockTimeTz.js'
import { DateTime } from '../../utils/datetime/DateTime.js'
import normalizeUnicode from '../normalizeUnicode.js'
import {
  DATE_OR_DATE_ARRAY_COLUMN_CHECK_REGEXP,
  DATETIME_OR_DATETIME_ARRAY_COLUMN_CHECK_REGEXP,
  STRING_OR_STRING_ARRAY_COLUMN_CHECK_REGEXP,
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
  } else if (val instanceof CalendarDate || DATE_OR_DATE_ARRAY_COLUMN_CHECK_REGEXP.test(columnType)) {
    return dateTimeOrDateToSql(CalendarDate, val as any)
    //
  } else if (val instanceof ClockTime || TIME_WITHOUT_TIMEZONE_COLUMN_CHECK_REGEXP.test(columnType)) {
    return clockTimeOrClockTimeTzToSql(ClockTime, val as any)
    //
  } else if (val instanceof ClockTimeTz || TIME_WITH_TIMEZONE_COLUMN_CHECK_REGEXP.test(columnType)) {
    return clockTimeOrClockTimeTzToSql(ClockTimeTz, val as any)
    //
  } else if (typeof val === 'string' || STRING_OR_STRING_ARRAY_COLUMN_CHECK_REGEXP.test(columnType)) {
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
    if (val === null || val === undefined) return val
    if (val instanceof DateTime || val instanceof CalendarDate) return val.toSQL()

    try {
      if (typeof val !== 'string') {
        throw new DataTypeColumnTypeMismatch(
          new Error(`database column type error: invalid ${dateClass.name} (received ${typeof val})`)
        )
      }

      return dateClass.fromISO(val, { zone: 'UTC' }).toSQL()
    } catch (error) {
      throw new DataTypeColumnTypeMismatch(
        error instanceof Error
          ? error
          : new Error(
              `database column type error: invalid ${dateClass.name} (received ${typeof val}: ${val})`
            )
      )
    }
  })

  return alreadyAnArray ? normalizedValueArray : normalizedValueArray[0]
}

function clockTimeOrClockTimeTzToSql(
  clockTimeClass: typeof ClockTime | typeof ClockTimeTz,
  _val: string | string[] | (ClockTime | ClockTimeTz) | (ClockTime | ClockTimeTz)[]
) {
  const alreadyAnArray = Array.isArray(_val)
  const normalizedValueArray = (alreadyAnArray ? _val : [_val]).map(val => {
    if (val === null || val === undefined) return val
    if (val instanceof BaseClockTime) return val.toSQL()

    try {
      if (typeof val !== 'string') {
        throw new DataTypeColumnTypeMismatch(
          new Error(`database column type error: invalid ${clockTimeClass.name} (received ${typeof val})`)
        )
      }

      return clockTimeClass.fromISO(val, { zone: 'UTC' }).toSQL()
    } catch (error) {
      throw new DataTypeColumnTypeMismatch(
        error instanceof Error
          ? error
          : new Error(
              `database column type error: invalid ${clockTimeClass.name} (received ${typeof val}: ${val})`
            )
      )
    }
  })

  return alreadyAnArray ? normalizedValueArray : normalizedValueArray[0]
}
