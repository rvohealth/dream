import { Kysely } from 'kysely'
import { DateTime } from 'luxon'
import CalendarDate from './CalendarDate'

export async function enumArrayOids(kyselyDb: Kysely<any>): Promise<number[]> {
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

export async function correspondingArrayOid(kyselyDb: Kysely<any>, oid: number): Promise<number | undefined> {
  const result = await kyselyDb
    .selectFrom('pg_type')
    .select('typarray')
    .where('oid', '=', oid)
    .executeTakeFirst()
  return result?.typarray
}

export function parsePostgresDate(dateString: string | null | undefined) {
  return dateString ? CalendarDate.fromSQL(dateString) : dateString
}

export function parsePostgresDatetime(datetimeString: string | null | undefined) {
  return datetimeString ? DateTime.fromSQL(datetimeString, { zone: 'UTC' }) : datetimeString
}

export function parsePostgresDecimal(numberString: string | null | undefined) {
  return numberString ? parseFloat(numberString) : numberString
}

export function parsePostgresArrayWithTransformation(
  transformer: typeof parsePostgresDate | typeof parsePostgresDatetime | typeof parsePostgresDecimal
) {
  return (value: any) => parsePostgresArray(value, transformer)
}

// copied and adapted from:
// https://github.com/bendrucker/postgres-array/blob/master/index.js
// if anyone finds a better typescript approach to serializing PG arrays,
// swap it out here. My first attempt at this was:
//
// return (value as string)
//   .replace(/^\{/, '')
//   .replace(/\}$/, '')
//   .split(/\s?,\s?/) as Table[Attr]
//
// but it was too simple to handle really complex enum values (i.e. values that contained commas and special chars)
export function parsePostgresArray(source: string, transform?: any, nested = false) {
  if (source === null) return null
  if (source === undefined) return undefined
  if (Array.isArray(source)) return transform ? source.map(value => transform(value)) : source

  let character = ''
  let quote = false
  let position = 0
  let dimension = 0
  const entries: any[] = []
  let recorded = ''

  const newEntry = function (includeEmpty: boolean = false) {
    let entry: any = recorded

    if (entry.length > 0 || includeEmpty) {
      if (entry === 'NULL' && !includeEmpty) {
        entry = null
      }

      if (entry !== null && transform) {
        entry = transform(entry)
      }

      entries.push(entry)
      recorded = ''
    }
  }

  if (source[0] === '[') {
    while (position < source.length) {
      const char = source[position++]

      if (char === '=') {
        break
      }
    }
  }

  while (position < source.length) {
    let escaped = false
    character = source[position++]

    if (character === '\\') {
      character = source[position++]
      escaped = true
    }

    if (character === '{' && !quote) {
      dimension++

      if (dimension > 1) {
        const parser: any = parsePostgresArray(source.substr(position - 1), transform, true)

        entries.push(parser.entries)
        position += parser.position - 2
      }
    } else if (character === '}' && !quote) {
      dimension--

      if (!dimension) {
        newEntry()

        if (nested) {
          return {
            entries,
            position,
          }
        }
      }
    } else if (character === '"' && !escaped) {
      if (quote) {
        newEntry(true)
      }

      quote = !quote
    } else if (character === ',' && !quote) {
      newEntry()
    } else {
      recorded += character
    }
  }

  if (dimension !== 0) {
    throw new Error('array dimension not balanced')
  }

  return entries
}
