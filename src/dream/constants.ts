export const primaryKeyTypes = ['bigserial', 'bigint', 'uuid', 'integer'] as const
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
  'string',
  'boolean',
  'number',
  'date',
  'date-time',
  'double',
  'integer',
  'null',
] as const

export const openapiShorthandPrimitiveTypes = [
  ...openapiPrimitiveTypes,
  'decimal',
  'string[]',
  'boolean[]',
  'number[]',
  'date[]',
  'date-time[]',
  'decimal[]',
  'double[]',
  'integer[]',
  'json',
] as const
