import { DateTime } from 'luxon'

export function marshalDBValue(value: any) {
  if (value?.constructor === Date) return DateTime.fromJSDate(value)
  return value
}
