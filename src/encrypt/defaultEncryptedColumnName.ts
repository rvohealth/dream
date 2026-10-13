import pascalize from '../helpers/pascalize.js'

/**
 * The column that holds an `@deco.Encrypted` property's ciphertext when the
 * decorator is not given one: the property's name, pascalized and prefixed
 * with `encrypted`. `secretPhone`, or `secret_phone`, gives
 * `encryptedSecretPhone`, which is the `encrypted_secret_phone` column.
 */
export default function defaultEncryptedColumnName(propertyName: string): string {
  return `encrypted${pascalize(propertyName)}`
}
