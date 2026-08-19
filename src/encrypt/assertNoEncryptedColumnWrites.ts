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
 * `encryptedAttributes` is class-scoped, but a query rooted at an STI base spans
 * every child's rows on the shared table, so the whole hierarchy below
 * `dreamClass` is searched for backing columns.
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
 * Every @Encrypted backing column declared on `dreamClass` or on any class below
 * it in its STI hierarchy, keyed by the snakeified backing column name.
 */
function encryptedAttributesInStiHierarchy(
  dreamClass: typeof Dream,
  encryptedAttributes: Map<string, DeclaredEncryptedAttribute> = new Map()
): Map<string, DeclaredEncryptedAttribute> {
  dreamClass['encryptedAttributes'].forEach(({ property, encryptedColumnName }) => {
    const snakeifiedColumnName = snakeifyString(encryptedColumnName)
    if (encryptedAttributes.has(snakeifiedColumnName)) return
    encryptedAttributes.set(snakeifiedColumnName, {
      property,
      encryptedColumnName,
      declaringClass: dreamClass,
    })
  })

  dreamClass['extendedBy']?.forEach(stiChildClass =>
    encryptedAttributesInStiHierarchy(stiChildClass, encryptedAttributes)
  )

  return encryptedAttributes
}
