import { Kysely } from 'kysely'
import CalendarDate from '../utils/datetime/CalendarDate.js'
import ClockTime from '../utils/datetime/ClockTime.js'
import { DateTime } from '../utils/datetime/DateTime.js'

export async function findEnumArrayOids(kyselyDb: Kysely<any>): Promise<number[]> {
  const result = await kyselyDb.selectFrom('pg_type').select('typarray').where('typtype', '=', 'e').execute()
  return result.map(values => values.typarray)
}

export async function findCitextArrayOid(kyselyDb: Kysely<any>): Promise<number | undefined> {
  const result = await kyselyDb
    .selectFrom('pg_type')
    .select('typarray')
    .where('typname', '=', 'citext')
    .executeTakeFirst()
  return result?.typarray
}

export async function findCorrespondingArrayOid(
  kyselyDb: Kysely<any>,
  oid: number
): Promise<number | undefined> {
  const result = await kyselyDb
    .selectFrom('pg_type')
    .select('typarray')
    .where('oid', '=', oid)
    .executeTakeFirst()
  return result?.typarray
}

export function parsePostgresDate(dateString: string | null) {
  return dateString ? CalendarDate.fromSQL(dateString) : dateString
}

export function parsePostgresDatetime(datetimeString: string | null) {
  if (!datetimeString) return datetimeString

  // TIMESTAMP (without time zone) columns have no timezone info in the string.
  // Parse in UTC like we always have.
  return DateTime.fromSQL(datetimeString, { zone: 'UTC' })
}

export function parsePostgresDatetimeTz(datetimeString: string | null) {
  if (!datetimeString) return datetimeString

  // TIMESTAMPTZ values are normalized to UTC DateTime objects for consistent behavior.
  return DateTime.fromSQL(datetimeString, { zone: 'UTC' })
}

export function parsePostgresTime(timeString: string | null) {
  if (!timeString) return timeString
  return ClockTime.fromSQL(timeString)
}

export function parsePostgresTimeTz(timeString: string | null) {
  if (!timeString) return timeString
  // TIMETZ values are normalized to UTC ClockTime objects for consistent behavior.
  return ClockTime.fromSQL(timeString, { zone: 'UTC' })
}

export function parsePostgresDecimal(numberString: string | null) {
  return numberString ? parseFloat(numberString) : numberString
}

export function parsePostgresBigint(numberString: string | null) {
  /**
   * JSON.stringify() throws an error when it encounters a bigint anywhere, and they are
   * troublesome overall to handle. Instead, we serialize bigints as strings, but allow
   * numerical operations to be performed on them in the database (e.g. when passing an
   * `ops` query ina `where` clause)
   */
  return numberString
}
