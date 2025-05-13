import { OpenapiSchemaBody, OpenapiShorthandPrimitiveTypes } from '../types/openapi.js'

interface Options {
  maybeNull?: boolean
}

export default function openapiShorthandToOpenapi(
  shorthand: OpenapiShorthandPrimitiveTypes,
  options: Options = {}
): OpenapiSchemaBody {
  const openapi = simpleOpenapiShorthandToOpenapi(shorthand)
  if (options.maybeNull) return { ...openapi, type: [openapi.type, 'null'] } as OpenapiSchemaBody
  return openapi as OpenapiSchemaBody
}

function simpleOpenapiShorthandToOpenapi(shorthand: OpenapiShorthandPrimitiveTypes) {
  switch (shorthand) {
    case 'string':
      return { type: 'string' }
    case 'boolean':
      return { type: 'boolean' }
    case 'number':
      return { type: 'number' }
    case 'date':
      return { type: 'string', format: 'date' }
    case 'date-time':
      return { type: 'string', format: 'date-time' }
    case 'decimal':
      return { type: 'number', format: 'decimal' }
    case 'integer':
      return { type: 'integer' }
    case 'null':
      return { type: 'null' }
    case 'string[]':
      return { type: 'array', items: { type: 'string' } }
    case 'boolean[]':
      return { type: 'array', items: { type: 'boolean' } }
    case 'number[]':
      return { type: 'array', items: { type: 'number' } }
    case 'date[]':
      return { type: 'array', items: { type: 'string', format: 'date' } }
    case 'date-time[]':
      return { type: 'array', items: { type: 'string', format: 'date-time' } }
    case 'decimal[]':
      return { type: 'array', items: { type: 'number', format: 'decimal' } }
    case 'integer[]':
      return { type: 'array', items: { type: 'integer' } }
    case 'json':
      return { type: 'json' }

    default:
      throw new Error(`Unrecognized OpenAPI shorthand: ${JSON.stringify(shorthand)}`)
  }
}
