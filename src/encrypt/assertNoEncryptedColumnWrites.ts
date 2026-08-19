import { EncryptedAttributeStatement } from '../decorators/field/Encrypted.js'
import Dream from '../Dream.js'
import CannotSetEncryptedColumnInQueryUpdate from '../errors/encrypt/CannotSetEncryptedColumnInQueryUpdate.js'
import { snakeifyString } from '../helpers/snakeify.js'

/**
 * @internal
 *
 * Throws when `attributes` names an @Encrypted backing column with anything other
 * than null. Guards the write paths that never instantiate a model, and so never
 * reach the throwing setter the Encrypted decorator installs for that column.
 *
 * `encryptedAttributes` is class-scoped, but every class in an STI hierarchy shares
 * one physical table, so the whole hierarchy is searched for backing columns
 * regardless of which of its classes the query is rooted at.
 *
 * Keys are matched in their snakeified form, since Kysely's CamelCasePlugin
 * resolves both the camelCase and the snake_case spelling of a key to the same
 * physical column.
 *
 * null is permitted: it clears the column, and there is no plaintext to mangle.
 */
export default function assertNoEncryptedColumnWrites(
  dreamClass: typeof Dream,
  attributes: Record<string, unknown>
) {
  const encryptedAttributes = encryptedAttributesInStiHierarchy(dreamClass)
  if (encryptedAttributes.size === 0) return

  Object.keys(attributes).forEach(key => {
    const encryptedAttribute = encryptedAttributes.get(snakeifyString(key))
    if (encryptedAttribute === undefined) return
    if (attributes[key] === null) return

    throw new CannotSetEncryptedColumnInQueryUpdate(
      encryptedAttribute.declaringClass,
      encryptedAttribute.encryptedColumnName,
      encryptedAttribute.property
    )
  })
}

interface DeclaredEncryptedAttribute extends EncryptedAttributeStatement {
  declaringClass: typeof Dream
}

/**
 * @internal
 *
 * Every @Encrypted backing column declared anywhere in `dreamClass`'s STI hierarchy —
 * on the STI base, on `dreamClass` itself, and on all of their descendants — keyed by
 * the snakeified backing column name.
 */
function encryptedAttributesInStiHierarchy(
  dreamClass: typeof Dream
): Map<string, DeclaredEncryptedAttribute> {
  const encryptedAttributes = new Map<string, DeclaredEncryptedAttribute>()

  dreamClass['stiHierarchyClasses']().forEach(stiClass => {
    stiClass['encryptedAttributes'].forEach(({ property, encryptedColumnName }) => {
      const snakeifiedColumnName = snakeifyString(encryptedColumnName)
      if (encryptedAttributes.has(snakeifiedColumnName)) return
      encryptedAttributes.set(snakeifiedColumnName, {
        property,
        encryptedColumnName,
        declaringClass: stiClass,
      })
    })
  })

  return encryptedAttributes
}
