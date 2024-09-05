import { DateTime } from 'luxon'
import Dream from '../dream'
import CalendarDate from './CalendarDate'
import isDatabaseArrayColumn from './db/types/isDatabaseArrayColumn'
import isDateColumn from './db/types/isDateColumn'
import isDateTimeColumn from './db/types/isDateTimeColumn'
import isDecimalColumn from './db/types/isDecimalColumn'
import marshalDBArrayValue from './marshalDBArrayValue'

export function marshalDBValue<
  T extends typeof Dream,
  DB extends InstanceType<T>['DB'],
  TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
  Table extends DB[keyof DB] = DB[TableName],
>(dreamClass: T, column: keyof Table, value: any) {
  if (value !== null && value !== undefined && isDecimalColumn(dreamClass, column))
    return parseFloat(value as string)

  // NOTE: DateTime and CalendarDate conversion here is solely for standardizing
  // attributes received during `new` (so that types for unpersisted Dream models
  // are the same as if they had been persisted). Data coming out of the database
  // are standardized by `setTypeParser` in src/dream-application/index.ts
  if (value instanceof Date) {
    if (isDateTimeColumn(dreamClass, column)) {
      return DateTime.fromJSDate(value, { zone: 'UTC' })
    } else if (isDateColumn(dreamClass, column)) {
      return CalendarDate.fromDateTime(DateTime.fromJSDate(value))
    }
  } else if (value instanceof DateTime) {
    if (isDateTimeColumn(dreamClass, column)) {
      return value.setZone('UTC')
    } else if (isDateColumn(dreamClass, column)) {
      return CalendarDate.fromDateTime(value)
    }
  } else if (typeof value === 'string') {
    if (isDateTimeColumn(dreamClass, column)) {
      return DateTime.fromISO(value, { zone: 'UTC' })
    } else if (isDateColumn(dreamClass, column)) {
      return CalendarDate.fromISO(value)
    }
  }
  // end:NOTE: DateTime and CalendarDate conversion here is solely for...

  if (isDatabaseArrayColumn(dreamClass, column)) {
    return marshalDBArrayValue(dreamClass, value as string)
  }

  return value
}
