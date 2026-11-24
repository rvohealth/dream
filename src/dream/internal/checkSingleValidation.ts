import Dream from '../../Dream.js'
import InternalEncrypt from '../../encrypt/InternalEncrypt.js'
import NonLoadedAssociation from '../../errors/associations/NonLoadedAssociation.js'
import DecryptionError from '../../errors/encrypt/DecryptionError.js'
import DecryptionParseError from '../../errors/encrypt/DecryptionParseError.js'
import DecryptionRotationError from '../../errors/encrypt/DecryptionRotationError.js'
import UnexpectedUndefined from '../../errors/UnexpectedUndefined.js'
import { normalizeDataForDb } from '../../helpers/db/normalizeDataForDb.js'
import isJsonColumn from '../../helpers/db/types/isJsonColumn.js'
import { validateDeclaredShape } from '../../openapi/declaredShape.js'
import { AssociationMetadataMap, AssociationStatement } from '../../types/associations/shared.js'
import { ValidationStatement } from '../../types/validation.js'

export default function checkSingleValidation(dream: Dream, validation: ValidationStatement) {
  // read as stored, never through the property's getter (see
  // checkDeclaredShape), so it skips the read below
  if (validation.type === 'declaredShape') return checkDeclaredShape(dream, validation.column)

  let value: any
  try {
    value = (dream as any)[validation.column]
  } catch (error) {
    if ((error as any).constructor !== NonLoadedAssociation) throw error
  }

  let parsedFloat: number
  let metadataMap: AssociationMetadataMap
  let associationMetadata: AssociationStatement | undefined

  switch (validation.type) {
    case 'presence':
      return !isBlank(value)

    case 'numericality':
      if (isBlank(value)) return true
      if (isNaN(value)) return false

      parsedFloat = parseFloat(value)
      if (
        validation.options?.numericality?.max?.constructor === Number &&
        parsedFloat > validation.options?.numericality?.max
      )
        return false

      if (
        validation.options?.numericality?.min?.constructor === Number &&
        parsedFloat < validation.options?.numericality?.min
      )
        return false

      return true

    case 'contains':
      switch (validation.options!.contains!.value.constructor) {
        case String:
          return new RegExp(validation.options!.contains!.value).test(value)
        case RegExp:
          return (validation.options!.contains!.value as RegExp).test(value)
      }
      break

    case 'length':
      return (
        value?.length &&
        value.length >= validation.options!.length!.min &&
        validation.options!.length!.max &&
        value.length <= validation.options!.length!.max
      )

    case 'requiredBelongsTo':
      metadataMap = dream['associationMetadataMap']()
      associationMetadata = metadataMap[validation.column]
      if (associationMetadata === undefined) throw new UnexpectedUndefined()

      return !!(value || (dream as any)[associationMetadata.foreignKey()])

    default: {
      // protection so that if a new ValidationType is ever added, this will throw a type error at build time
      const _never: never = validation.type
      throw new Error(`Unhandled ValidationType: ${_never as string}`)
    }
  }
}

/**
 * Whether the value `dream` would store for `property` matches the shape its
 * `@deco.JSON` or `@deco.Encrypted` declaration registers, checked as given,
 * with no coercion. An unset (`undefined`) value is not checked: nothing is
 * written for it, so the column's default applies.
 *
 * The value is read as stored, never through the property's getter:
 * - for `@deco.JSON`, a json/jsonb column holds JSON text, which is parsed
 *   here, so text that is not JSON fails the check rather than throwing a
 *   `SyntaxError` from the getter; a json[]/jsonb[] column holds the array,
 *   which is checked as the JSON it is stored as.
 * - for `@deco.Encrypted`, the backing column is decrypted directly, so the
 *   check never fires `encryption:legacy-key-used` (whose listener might
 *   assign the property mid-save) and never assigns or re-encrypts anything,
 *   leaving the record as clean as it was. Ciphertext that does not decrypt
 *   fails the check. A null backing column is the value null, taken without
 *   decrypting, so it needs no column encryption config; the column's
 *   nullability then decides it.
 *
 * Only whether the value matches is used. The checker's errors name paths
 * and keys of the value, which for an encrypted value are plaintext, so they
 * are discarded and never reach the validation error or a log.
 */
function checkDeclaredShape(dream: Dream, property: string): boolean {
  const dreamClass = dream.constructor as typeof Dream
  const encryptedAttribute = dreamClass['encryptedAttributes'].find(
    statement => statement.property === property
  )
  const column = encryptedAttribute?.encryptedColumnName ?? property
  const stored: unknown = (dream as any).getAttribute(column)
  if (stored === undefined) return true

  let value: unknown
  try {
    value = encryptedAttribute
      ? stored === null
        ? null
        : InternalEncrypt.decryptColumn(stored)
      : storedJsonColumnValue(dreamClass, column, stored)
  } catch (error) {
    if (
      error instanceof SyntaxError ||
      error instanceof DecryptionError ||
      error instanceof DecryptionParseError ||
      error instanceof DecryptionRotationError
    )
      return false
    throw error
  }

  return validateDeclaredShape(dreamClass, property, value).isValid
}

/**
 * The value a json, jsonb, json[] or jsonb[] column stores for `stored`, the
 * attribute as the column's accessor keeps it: the accessor of a json/jsonb
 * column keeps JSON text (a string given for it is taken as already-encoded
 * JSON), and any other column, a json[]/jsonb[] one included, keeps the value
 * as assigned, whose elements the database stores as their JSON.
 *
 * The attribute is read as `normalizeDataForDb` sends it to the database.
 * That Unicode-normalizes JSON text, which can change a string's length and
 * turn two of an object's keys into one (the Kelvin sign U+212A becomes `K`),
 * so the value the text encodes before it is normalized is not the value
 * stored.
 */
function storedJsonColumnValue(dreamClass: typeof Dream, column: string, stored: unknown): unknown {
  if (stored === null) return null

  const sent = normalizeDataForDb({ val: stored, dreamClass, column })
  if (typeof sent === 'string' && isJsonColumn(dreamClass, column as any)) return JSON.parse(sent)
  return JSON.parse(JSON.stringify(sent))
}

function isBlank(value: any) {
  return [undefined, null, ''].includes(value)
}
