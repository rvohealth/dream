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
 * `encryptedAttributes` is class-scoped, but a query rooted at an STI base reaches
 * every one of its children's rows on the shared table, so `dreamClass` and every STI
 * class below it are searched for backing columns.
 *
 * The search deliberately stops there rather than covering the whole hierarchy. A query
 * rooted at an STI child matches only that child's rows, and a backing column only a
 * sibling declares holds nothing meaningful for them: writing plaintext into it corrupts
 * no ciphertext, because there is none to corrupt. Converting such a row to the sibling
 * type is what has to clear that column, and it has to clear it whatever this guard did.
 * Widening the walk to the siblings therefore buys no protection, and this guard runs on
 * every single-statement update, so keep it narrow.
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
  const encryptedAttributes = encryptedAttributesInStiDescendants(dreamClass)
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
 * Every @Encrypted backing column declared on `dreamClass` or on an STI class below it,
 * keyed by the snakeified backing column name.
 */
function encryptedAttributesInStiDescendants(
  dreamClass: typeof Dream
): Map<string, DeclaredEncryptedAttribute> {
  const encryptedAttributes = new Map<string, DeclaredEncryptedAttribute>()

  dreamClass['selfAndStiDescendants']().forEach(stiClass => {
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
