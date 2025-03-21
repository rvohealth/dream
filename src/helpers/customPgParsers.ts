import { Kysely } from 'kysely'
import CalendarDate from './CalendarDate.js'
import { DateTime } from './DateTime.js'

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
  return datetimeString ? DateTime.fromSQL(datetimeString, { zone: 'UTC' }) : datetimeString
}

export function parsePostgresDecimal(numberString: string | null) {
  return numberString ? parseFloat(numberString) : numberString
}
