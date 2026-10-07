import UnrecognizedAssociationConditionKeys from '../../../errors/associations/UnrecognizedAssociationConditionKeys.js'
import isObject from '../../../helpers/isObject.js'

/**
 * The keys a condition object on an association accepts, whether it is
 * passed in a chain (`preload('posts', { and: { ... } })`), returned from a
 * `preloadFor`/`loadFor` modifier, or passed to `associationQuery`.
 */
export const ASSOCIATION_CONDITION_KEYS = ['and', 'andNot', 'andAny'] as const

/**
 * The keys accepted by `destroyAssociation`, `reallyDestroyAssociation`
 * and `undestroyAssociation`.
 */
export const DESTROY_ASSOCIATION_OPTION_KEYS = [
  ...ASSOCIATION_CONDITION_KEYS,
  'bypassAllDefaultScopes',
  'defaultScopesToBypass',
  'cascade',
  'skipHooks',
] as const

/**
 * The keys accepted by `updateAssociation`.
 */
export const UPDATE_ASSOCIATION_OPTION_KEYS = [
  ...ASSOCIATION_CONDITION_KEYS,
  'bypassAllDefaultScopes',
  'defaultScopesToBypass',
  'skipHooks',
] as const

/**
 * Throws UnrecognizedAssociationConditionKeys when `value` is an object
 * carrying any own key outside `acceptedKeys`, including a key whose value
 * is `undefined`. Dream reads only the accepted keys, so an unrecognized key
 * would otherwise be silently ignored (and, for the destroy family, act on
 * every associated row instead of the ones the caller meant to select).
 * Non-object values (`undefined`, `null`) pass through untouched.
 *
 * @param value - The condition object or options object to check
 * @param acceptedKeys - The keys `value` may carry
 * @param associationName - The association the object applies to, for the error message
 * @param methodName - The public method the options were passed to, or null for a chain condition
 */
export default function assertRecognizedAssociationConditionKeys(
  value: unknown,
  acceptedKeys: readonly string[],
  associationName: string | number | symbol,
  methodName: string | null = null
) {
  if (!isObject(value)) return

  const unrecognizedKeys = Object.keys(value as object).filter(key => !acceptedKeys.includes(key))
  if (unrecognizedKeys.length)
    throw new UnrecognizedAssociationConditionKeys(
      String(associationName),
      unrecognizedKeys,
      acceptedKeys,
      methodName
    )
}
