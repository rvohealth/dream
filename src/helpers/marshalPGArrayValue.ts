import { AssociationTableNames } from '../db/reflections'
import AttemptingToMarshalInvalidArrayType from '../exceptions/attempting-to-marshal-invalid-array-type'
import { DB } from '../sync/schema'

export default function marshalPGArrayValue<
  TableName extends AssociationTableNames,
  Table extends DB[TableName] = DB[TableName],
  Attr extends keyof Table = keyof Table
>(value: string | any[], column: Attr, { table }: { table: TableName }): Table[Attr] {
  switch (value.constructor) {
    case Array:
      return value as Table[Attr]

    case String:
      return parsePostgresArray(value as string, (val: string) => val) as Table[Attr]

    default:
      throw new AttemptingToMarshalInvalidArrayType(value)
  }
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
function parsePostgresArray(source: string, transform: any, nested = false) {
  let character = ''
  let quote = false
  let position = 0
  let dimension = 0
  const entries = []
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
