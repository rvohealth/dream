import Dream from '../Dream.js'
import CannotSetEncryptedColumnInQueryUpdate from '../errors/encrypt/CannotSetEncryptedColumnInQueryUpdate.js'

/**
 * @internal
 *
 * Throws when `attributes` names an @Encrypted backing column with anything other
 * than null. Guards the write paths that never instantiate a model, and so never
 * reach the throwing setter the Encrypted decorator installs for that column.
 *
 * null is permitted: it clears the column, and there is no plaintext to mangle.
 */
export default function assertNoEncryptedColumnWrites(
  dreamClass: typeof Dream,
  attributes: Record<string, unknown>
) {
  dreamClass['encryptedAttributes'].forEach(({ property, encryptedColumnName }) => {
    if (!Object.prototype.hasOwnProperty.call(attributes, encryptedColumnName)) return
    if (attributes[encryptedColumnName] === null) return

    throw new CannotSetEncryptedColumnInQueryUpdate(dreamClass, encryptedColumnName, property)
  })
}
