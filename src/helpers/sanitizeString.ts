import { AttributeSerializationSanitizationStrategy } from '../types/serializer.js'

export default function sanitizeString<T extends string | null | undefined>(
  value: T,
  sanitizationStrategy: AttributeSerializationSanitizationStrategy
): T {
  switch (sanitizationStrategy) {
    case 'unicodeString':
      return sanitizeStringUnicodeStringStrategy(value)

    case 'htmlEntity':
      return sanitizeStringHtmlEntityStrategy(value)

    default:
      if (typeof sanitizationStrategy === 'function') return sanitizationStrategy(value)
      throw new UnrecognizedAttributeSerializationSanitizationStrategy(sanitizationStrategy)
  }
}

function sanitizeStringUnicodeStringStrategy<T extends string | null | undefined>(str: T): T {
  if (str === undefined || str === null) return str

  return str
    .replace(/\\/g, '\\u005c')
    .replace(/&/g, '\\u0026')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\//g, '\\u002f')
    .replace(/'/g, '\\u0027')
    .replace(/"/g, '\\u0022') as T
}

function sanitizeStringHtmlEntityStrategy<T extends string | null | undefined>(str: T): T {
  if (str === undefined || str === null) return str

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\//g, '&#x2F;')
    .replace(/'/g, '&#x27;')
    .replace(/"/g, '&quot;') as T
}

class UnrecognizedAttributeSerializationSanitizationStrategy extends Error {
  constructor(private sanitizationStrategy: AttributeSerializationSanitizationStrategy) {
    super()
  }

  public override get message() {
    return `Unrecognized attribute serialization sanitization strategy:
${this.sanitizationStrategy.toString()}`
  }
}
