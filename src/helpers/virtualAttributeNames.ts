import type Dream from '../Dream.js'

/**
 * @internal
 *
 * The names of the attributes `dreamClass` declares with `@deco.Virtual` or
 * `@deco.Encrypted`, in the order Dream registered them.
 */
export default function virtualAttributeNames(dreamClass: typeof Dream): string[] {
  return dreamClass['virtualAttributes'].map(statement => statement.property)
}
