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

export function isOpenapiShorthand(openapi: any): boolean {
  const openapiShorthand = maybeNullOpenapiShorthandToOpenapiShorthand(openapi)
  if (typeof openapiShorthand !== 'string') return false
  return openapiShorthandPrimitiveTypes.includes(
    openapiShorthand as (typeof openapiShorthandPrimitiveTypes)[number]
  )
}

function maybeNullOpenapiShorthandToOpenapiShorthand(openapi: any) {
  if (openapi === undefined) return undefined
  if (typeof openapi === 'string') return openapi
  if (!Array.isArray(openapi)) return undefined
  if (openapi.length !== 2) return undefined
  if (openapi[1] === 'null') return openapi[0]
  if (openapi[0] === 'null') return openapi[1]
}
