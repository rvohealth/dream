import Dream from '../dream'
import AttemptingToMarshalInvalidArrayType from '../exceptions/attempting-to-marshal-invalid-array-type'
import { isString } from './typechecks'

export default function marshalDBArrayValue<
  T extends typeof Dream,
  DB extends InstanceType<T>['DB'],
  TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
  Table extends DB[keyof DB] = DB[TableName],
  Column extends keyof Table = keyof Table,
>(dreamClass: T, value: string | any[] | null | undefined): Table[Column] | null | undefined {
  if (value === null) return null
  if (value === undefined) return undefined

  if (Array.isArray(value)) {
    return value as Table[Column]
  } else if (isString(value)) {
    return parsePostgresArray(value, (val: string) => val) as Table[Column]
  } else {
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
        // eslint-disable-next-line
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
