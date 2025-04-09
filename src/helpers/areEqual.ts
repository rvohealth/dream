import Dream from '../Dream.js'
import CalendarDate from './CalendarDate.js'
import { DateTime } from './DateTime.js'

export default function areEqual(a: any, b: any): boolean {
  return areEqualOrUndefined(a, b) ?? areEqualOrUndefined(b, a) ?? JSON.stringify(a) === JSON.stringify(b)
}

function areEqualOrUndefined(a: any, b: any): boolean | undefined {
  if (a === null) return b === null
  if (a === undefined) return b === undefined
  if (typeof a === 'boolean') return a === b
  if (typeof a === 'number') return a === b
  if (typeof a === 'string') return a === b
  if (a instanceof DateTime) return b instanceof DateTime && a.equals(b)
  if (a instanceof CalendarDate) return b instanceof CalendarDate && a.equals(b)

  if (Array.isArray(a))
    return Array.isArray(b) && a.length === b.length && !a.find((value, index) => !areEqual(value, b[index]))

  if ((a as Dream)?.isDreamInstance) return (a as Dream).equals(b)

  return undefined
}
