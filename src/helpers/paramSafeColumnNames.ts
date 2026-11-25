import type Dream from '../Dream.js'

/**
 * @internal
 *
 * The names of the columns of `dreamClass` that may be set from request
 * params: the columns Dream considers safe by default, narrowed by the
 * model's `paramSafeColumns` and `paramUnsafeColumns`.
 */
export default function paramSafeColumnNames(dreamClass: typeof Dream): string[] {
  return dreamClass['paramSafeColumnsOrFallback']()
}
