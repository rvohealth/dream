export const primaryKeyTypes = ['uuid7', 'uuid4', 'bigserial', 'bigint', 'integer'] as const
export const TRIGRAM_OPERATORS = ['%', '<%', '<<%'] as const
class RequiredAttribute {
  constructor() {}
}
class PassthroughAttribute {
  constructor() {}
}

export const DreamConst = {
  passthrough: PassthroughAttribute,
  required: RequiredAttribute,
}

export const openapiPrimitiveTypes = [
  'boolean',
  'date-time',
  'date',
  'integer',
  'null',
  'number',
  'string',
] as const

export const openapiShorthandPrimitiveTypes = [
  ...openapiPrimitiveTypes,
  'boolean[]',
  'date-time[]',
  'date[]',
  'decimal',
  'decimal[]',
  'integer[]',
  'json',
  'number[]',
  'string[]',
] as const
