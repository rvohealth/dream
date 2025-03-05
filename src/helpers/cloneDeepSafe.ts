import { SelectQueryBuilder } from 'kysely'
import { DateTime } from 'luxon'
import Dream from '../Dream'
import Query from '../dream/Query'
import OpsStatement from '../ops/ops-statement'
import CalendarDate from './CalendarDate'
import { Range } from './range'
import { isObject } from './typechecks'

/**
 * @internal
 *
 * accepts any value, and will return a valid clone of
 * that object. Any dream or query instances passed
 * will automatically be cloned using special cloning
 * methods.
 *
 * @param original - the value to clone
 * @param includePrimaryKey - Whether or not to copy the primary key when cloning a dream instance
 * @returns Either a clone, or else the original value
 */
export default function cloneDeepSafe<T>(original: T): T {
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

  if (Array.isArray(original)) return original.map(value => cloneDeepSafe(value)) as T

  if (isObject(original) && original.constructor.name === 'Object') {
    const clone = { ...original }
    Object.keys(clone).forEach(key => (clone[key] = cloneDeepSafe(clone[key])))
    return clone
  }

  throw new TypeUnsupportedByClone(original)
}

export class TypeUnsupportedByClone extends Error {
  constructor(private original: any) {
    super()
  }

  public get message() {
    return `Type unsupported by cloneDeepSafe:
${this.original}
${this.original.toString()}
${this.original.constructor?.name}
${typeof this.original}
`
  }
}
