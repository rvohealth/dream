import { SelectQueryBuilder } from 'kysely'
import Dream from '../Dream.js'
import Query from '../dream/Query.js'
import OpsStatement from '../ops/ops-statement.js'
import CalendarDate from './CalendarDate.js'
import { DateTime } from './DateTime.js'
import { Range } from './range.js'
import { isObject } from './typechecks.js'

/**
 * Accepts any value and returns a valid clone of that object.
 * Dream instances, Query instances, and other special types are
 * automatically cloned using their specialized cloning methods.
 *
 * @param original - The value to clone
 * @param unsupportedTypeCloneFunction - Optional function to handle cloning of unsupported types.
 *   If not provided, an error will be thrown for unsupported types.
 * @returns Either a clone of the original value, or the original value itself for immutable types
 * @throws {TypeUnsupportedByClone} When an unsupported type is encountered and no unsupportedTypeCloneFunction is provided
 */
export default function cloneDeepSafe<T>(original: T, unsupportedTypeCloneFunction?: <U>(x: U) => U): T {
  if (original === undefined) return original
  if (original === null) return original
  if (typeof original === 'string') return original
  if (['number', 'boolean', 'bigint', 'symbol'].includes(typeof original)) return original
  if (original instanceof DateTime) return original
  if (original instanceof CalendarDate) return original
  if (original instanceof Range) return original
  if (original instanceof OpsStatement) return original

  if ((original as unknown as Dream)?.isDreamInstance) return (original as unknown as Dream)['clone']() as T
  if ((original as unknown as Query<Dream>)?.isDreamQuery)
    return (original as unknown as Query<Dream>).clone() as T
  if ((original as unknown as SelectQueryBuilder<any, any, any>)?.isSelectQueryBuilder) return original

  if (Array.isArray(original))
    return original.map(value => cloneDeepSafe(value, unsupportedTypeCloneFunction)) as T

  if (isObject(original) && original.constructor.name === 'Object') {
    const clone = { ...original }
    Object.keys(clone).forEach(
      key => ((clone as any)[key] = cloneDeepSafe((clone as any)[key], unsupportedTypeCloneFunction))
    )
    return clone
  }

  if (unsupportedTypeCloneFunction) return unsupportedTypeCloneFunction(original) as T
  throw new TypeUnsupportedByClone(original)
}

export class TypeUnsupportedByClone extends Error {
  constructor(private original: any) {
    super()
  }

  public override get message() {
    return `Type unsupported by cloneDeepSafe:
${this.original}
${this.original.toString()}
${this.original.constructor?.name}
${typeof this.original}
`
  }
}
