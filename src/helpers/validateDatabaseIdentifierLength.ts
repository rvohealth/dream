import IdentifierExceedsMaxLengthForDatabase, {
  POSTGRES_MAX_IDENTIFIER_BYTES,
} from '../errors/IdentifierExceedsMaxLengthForDatabase.js'
import { snakeifyString } from './snakeify.js'

/**
 * PostgreSQL silently truncates identifiers longer than 63 bytes (NAMEDATALEN - 1).
 * This causes insidious bugs: columns are created with truncated names, but the ORM
 * queries by the full name. PostgreSQL truncates the query identifier too, so the query
 * succeeds, but the result-set column has the truncated name. The CamelCasePlugin then
 * converts the truncated name back to a different camelCase string than what the model
 * expects, leaving properties undefined.
 *
 * Neither `pg` (node-postgres) nor Kysely provide any mechanism to detect or prevent
 * this truncation—it happens server-side before results are returned.
 *
 * This helper validates that an identifier's snake_case form (what PostgreSQL ultimately
 * sees) does not exceed the specified limit. It accepts identifiers in either camelCase
 * (as used in Dream model code, which Kysely's CamelCasePlugin converts to snake_case)
 * or already in snake_case (as used in generated migrations).
 *
 * @param identifier - The identifier to validate (camelCase or snake_case)
 * @param options.isSnakeCase - If true, the identifier is already snake_case; otherwise it will be converted
 * @param options.identifierType - A human-readable description of what the identifier represents (e.g. "column name", "index name")
 * @param options.maxLength - Maximum allowed byte length (defaults to 63 for full identifiers; use 31 for individual components like table/column names that will be combined as table.column)
 */
export default function validateDatabaseIdentifierLength(
  identifier: string,
  {
    isSnakeCase = false,
    identifierType = 'identifier',
    maxLength = POSTGRES_MAX_IDENTIFIER_BYTES,
  }: {
    isSnakeCase?: boolean
    identifierType?: string
    maxLength?: number
  } = {}
): void {
  const snakeCaseIdentifier = isSnakeCase ? identifier : snakeifyString(identifier)
  const byteLength = Buffer.byteLength(snakeCaseIdentifier, 'utf8')

  if (byteLength > maxLength) {
    throw new IdentifierExceedsMaxLengthForDatabase({
      identifier,
      snakeCaseIdentifier,
      identifierByteLength: byteLength,
      identifierType,
      maxLength,
    })
  }
}
