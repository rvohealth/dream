import { DateTime } from 'luxon'
import Dream from '../Dream'
import CalendarDate from './CalendarDate'
import isDateTimeColumn from './db/types/isDateTimeColumn'
import { isString } from './typechecks'
import ModifierStatement from '../modifiers/modifier-statement'
import { sql } from 'kysely'
import snakeify from './snakeify'

export default function sqlAttributes(dream: Dream) {
  const attributes = dream.dirtyAttributes()

  return Object.keys(attributes).reduce(
    (result, key) => {
      let val = attributes[key]

      if (isString(val) && isDateTimeColumn(dream.constructor as typeof Dream, key))
        val = DateTime.fromISO(val, { zone: 'UTC' })

      if (val instanceof DateTime || val instanceof CalendarDate) {
        // Converting toJSDate resulted in the correct timezone, but even with process.env.TZ=UTC,
        // Kysely inserted into the database with the machine timezone, which can shift the date
        // (e.g., toJSDate resulted in a JS Date that formats as "1987-04-07T00:00:00.000Z", but
        // Kysely inserted "1907-04-06"  into the database). By converting to an SQL string before
        // handing off to Kysely, we bypass Javascript dates altogether, sending the string into the
        // database for storage as a date or datetime.
        result[key] = val.toSQL()
      } else if (val instanceof ModifierStatement) {
        result[key] = modifierStatementToVal(dream.table, key, val)
      } else if (val !== undefined) {
        result[key] = val
      }

      return result
    },
    {} as { [key: string]: any }
  )
}

function modifierStatementToVal(
  tableName: string,
  columnName: string,
  modifierStatement: ModifierStatement<any, any>
) {
  switch (modifierStatement.operator) {
    case 'arrayCat':
      return sql`array_cat(${sql.raw(tableName)}.${sql.raw(snakeify(columnName))}, ${modifierStatement.value})`

    case 'arrayAppend':
      return sql`array_append(${sql.raw(tableName)}.${sql.raw(snakeify(columnName))}, ${modifierStatement.value})`

    case 'arrayRemove':
      return sql`array_remove(${sql.raw(tableName)}.${sql.raw(snakeify(columnName))}, ${modifierStatement.value})`
  }
}
