export const POSTGRES_MAX_IDENTIFIER_BYTES = 63
export const POSTGRES_MAX_IDENTIFIER_COMPONENT_BYTES = 31

export default class IdentifierExceedsMaxLengthForDatabase extends Error {
  public identifier: string
  public snakeCaseIdentifier: string
  public identifierByteLength: number
  public identifierType: string
  public maxLength: number

  constructor({
    identifier,
    snakeCaseIdentifier,
    identifierByteLength,
    identifierType,
    maxLength = POSTGRES_MAX_IDENTIFIER_BYTES,
  }: {
    identifier: string
    snakeCaseIdentifier: string
    identifierByteLength: number
    identifierType: string
    maxLength?: number
  }) {
    super()
    this.identifier = identifier
    this.snakeCaseIdentifier = snakeCaseIdentifier
    this.identifierByteLength = identifierByteLength
    this.identifierType = identifierType
    this.maxLength = maxLength
  }

  public override get message() {
    if (this.maxLength < POSTGRES_MAX_IDENTIFIER_BYTES) {
      return `\
The ${this.identifierType} "${this.identifier}" is ${this.identifierByteLength} bytes in \
snake_case ("${this.snakeCaseIdentifier}"), exceeding the ${this.maxLength}-byte component limit. \
PostgreSQL silently truncates namespaced identifiers (e.g. table_name.column_name) at \
${POSTGRES_MAX_IDENTIFIER_BYTES} bytes total, so individual components must be kept short enough \
that their combined form fits. Please shorten this ${this.identifierType} so that its snake_case \
form is at most ${this.maxLength} bytes, or provide an explicit shorter name using the \
--table-name option.`
    }

    return `\
PostgreSQL silently truncates identifiers longer than ${POSTGRES_MAX_IDENTIFIER_BYTES} bytes \
(NAMEDATALEN - 1), which causes column values to come back as undefined. \
The ${this.identifierType} "${this.identifier}" exceeds this limit at \
${this.identifierByteLength} bytes (snake_case: "${this.snakeCaseIdentifier}"). \
Please shorten this ${this.identifierType} so that its snake_case form is at most \
${POSTGRES_MAX_IDENTIFIER_BYTES} bytes.`
  }
}
