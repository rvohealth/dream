import { DateTime } from 'luxon'
import isDecimalColumn from './db/types/isDecimalColumn'
import isDatabaseArrayColumn from './db/types/isDatabaseArrayColumn'
import marshalDBArrayValue from './marshalDBArrayValue'
import Dream from '../dream'
import isDateTimeColumn from './db/types/isDateTimeColumn'
import isDateColumn from './db/types/isDateColumn'
import CalendarDate from './CalendarDate'

export function marshalDBValue<
  T extends typeof Dream,
  DB extends InstanceType<T>['DB'],
  TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
  Table extends DB[keyof DB] = DB[TableName],
>(dreamClass: T, column: keyof Table, value: any) {
  if (value !== null && value !== undefined && isDecimalColumn(dreamClass, column))
    return parseFloat(value as string)

  if (value instanceof Date) {
    if (isDateTimeColumn(dreamClass, column)) {
      return DateTime.fromJSDate(value, { zone: 'UTC' })
    } else if (isDateColumn(dreamClass, column)) {
      const dateString = value.toISOString().split('T')[0]
      return CalendarDate.fromISO(dateString, { zone: 'UTC' })
    } else {
      throw new Error(`marshalDBValue() received Javascript Date, but isDateTimeColumn and isDateColumn
return false for column '${column.toString()}' on '${dreamClass.name}'`)
    }
  }

  if (typeof value === 'string' && isDateTimeColumn(dreamClass, column)) {
    return DateTime.fromISO(value, { zone: 'UTC' })
  } else if (typeof value === 'string' && isDateColumn(dreamClass, column)) {
    return CalendarDate.fromISO(value, { zone: 'UTC' })
  }

  if (isDatabaseArrayColumn(dreamClass, column)) {
    return marshalDBArrayValue(dreamClass, value as string)
  }

  return value
}
