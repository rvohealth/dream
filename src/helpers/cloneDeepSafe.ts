import { SelectQueryBuilder } from 'kysely'
import Dream from '../Dream'
import Query from '../dream/Query'
import { isString } from './typechecks'

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
  return cloneDeepWith(original, (value: any) => {
    if (value?.isDreamInstance) return (value as Dream)['clone']()
    if (value?.isDreamQuery) return (value as Query<Dream>).clone()
    if ((value as SelectQueryBuilder<any, any, any>)?.isSelectQueryBuilder) return value
  })
}

function cloneDeepWith<T>(original: T, cloneFunction: (value: T) => T): T {
  if (original === undefined) return original
  if (original === null) return original
  if (isString(original)) return `${original}` as T
  if (['number', 'boolean', 'bigint', 'symbol'].includes(typeof original)) return original

  if (Array.isArray(original)) return original.map(value => cloneFunction(value)) as T

  const clone = cloneFunction(original)
  if (clone !== undefined) return clone

  try {
    const clone = { ...original }
    Object.keys(clone).forEach(key => (clone[key] = cloneDeepWith(clone[key], cloneFunction)))
    return clone
  } catch {
    throw new TypeUnsupportedByClone(original)
  }
}

export class TypeUnsupportedByClone extends Error {
  constructor(private original: any) {
    super()
  }

  public get message() {
    return `Type unsupported by cloneDeepSafe:
${this.original}
${this.original.constructor?.name}
${typeof this.original}
`
  }
}
