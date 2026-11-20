import { OpenapiSchemaBody, OpenapiSchemaBodyShorthand } from '../types/openapi.js'

const NULL_OBJECT_OPENAPI: OpenapiSchemaBody = { type: 'null' }

// the subschema applicators whose effect on null is read from their branches
const COMBINATORS = ['allOf', 'anyOf', 'oneOf'] as const

// the other root keywords that apply a subschema to the value itself; their
// effect on null is not read, so a schema carrying one is not known to accept
// null
const OTHER_SUBSCHEMA_APPLICATORS = ['not', 'if', '$ref'] as const

// root keywords that apply a subschema to the value itself; any of them can
// still reject null after the schema's own `type` admits it
const SUBSCHEMA_APPLICATORS = [...COMBINATORS, ...OTHER_SUBSCHEMA_APPLICATORS] as const

function hasSubschemaApplicator(schemaRecord: Record<string, unknown>): boolean {
  return SUBSCHEMA_APPLICATORS.some(keyword => schemaRecord[keyword] !== undefined)
}

function openapiTypeIncludesNull(type: unknown): boolean {
  return type === 'null' || (Array.isArray(type) && type.includes('null'))
}

/**
 * @internal
 *
 * Whether the schema is known to accept null: its `type`, `enum` and `const`
 * all admit null, and each combinator applied to the value does too (an
 * `anyOf` with a branch that accepts null, a `oneOf` with exactly one such
 * branch and every other branch known to reject null, an `allOf` whose
 * branches all accept null). A schema with neither a `type` nor a combinator,
 * and a schema applying any other subschema to the value (a `$ref`, `not` or
 * `if`), answers false, as does any schema this cannot prove accepts null.
 */
export function openapiSchemaAcceptsNull(schema: OpenapiSchemaBodyShorthand): boolean {
  if (typeof schema !== 'object' || schema === null) return false

  const schemaRecord = schema as Record<string, unknown>

  if (Array.isArray(schemaRecord.enum) && !schemaRecord.enum.includes(null)) return false
  if ('const' in schemaRecord && schemaRecord.const !== null) return false
  if (schemaRecord.type !== undefined && !openapiTypeIncludesNull(schemaRecord.type)) return false

  if (OTHER_SUBSCHEMA_APPLICATORS.some(keyword => schemaRecord[keyword] !== undefined)) return false

  const combinators = COMBINATORS.filter(keyword => schemaRecord[keyword] !== undefined)
  if (schemaRecord.type === undefined && combinators.length === 0) return false

  return combinators.every(keyword => combinatorAcceptsNull(keyword, schemaRecord[keyword]))
}

function combinatorAcceptsNull(keyword: (typeof COMBINATORS)[number], branches: unknown): boolean {
  if (!Array.isArray(branches)) return false
  const members = branches as OpenapiSchemaBodyShorthand[]

  switch (keyword) {
    case 'anyOf':
      return members.some(openapiSchemaAcceptsNull)

    case 'allOf':
      return members.length > 0 && members.every(openapiSchemaAcceptsNull)

    case 'oneOf': {
      // null passes a oneOf only when it matches exactly one branch
      const accepting = members.filter(openapiSchemaAcceptsNull)
      return (
        accepting.length === 1 && members.every(member => accepting.includes(member) || rejectsNull(member))
      )
    }
  }
}

/**
 * Whether the schema is known to reject null: its `type`, `enum` or `const`
 * excludes null, or a combinator does (an `anyOf` or `oneOf` whose branches
 * all reject null, an `allOf` with a branch that does). A schema this cannot
 * prove rejects null answers false.
 */
function rejectsNull(schema: OpenapiSchemaBodyShorthand): boolean {
  if (typeof schema !== 'object' || schema === null) return false

  const schemaRecord = schema as Record<string, unknown>

  if (Array.isArray(schemaRecord.enum) && !schemaRecord.enum.includes(null)) return true
  if ('const' in schemaRecord && schemaRecord.const !== null) return true
  if (schemaRecord.type !== undefined && !openapiTypeIncludesNull(schemaRecord.type)) return true

  const { allOf, anyOf, oneOf } = schemaRecord
  if (Array.isArray(allOf) && (allOf as OpenapiSchemaBodyShorthand[]).some(rejectsNull)) return true
  return [anyOf, oneOf].some(
    branches =>
      Array.isArray(branches) &&
      branches.length > 0 &&
      (branches as OpenapiSchemaBodyShorthand[]).every(rejectsNull)
  )
}

/**
 * @internal
 *
 * Widens a schema to also accept null. When its `type`, `enum` and `const` are
 * the only keywords that can reject null, null is added to each in place
 * (a `const` becomes an `enum` of its value and null), matching how a nullable
 * enum column renders. Otherwise (no `type`, a subschema applied beside it, or
 * both an `enum` and a `const`) the result is `anyOf` the schema or null.
 */
export function openapiSchemaWithNull(schema: OpenapiSchemaBodyShorthand): OpenapiSchemaBodyShorthand {
  const schemaRecord = schema as Record<string, unknown>
  const { type } = schemaRecord
  const hasConst = 'const' in schemaRecord

  if (
    type === undefined ||
    hasSubschemaApplicator(schemaRecord) ||
    (hasConst && schemaRecord.enum !== undefined)
  )
    return { anyOf: [schema, NULL_OBJECT_OPENAPI] }

  const { const: constValue, ...schemaWithoutConst } = schemaRecord
  const types = Array.isArray(type) ? (type as unknown[]) : [type]
  const allowedValues = hasConst ? [constValue] : schemaRecord.enum

  return {
    ...schemaWithoutConst,
    type: openapiTypeIncludesNull(type) ? type : [...types, 'null'],
    ...(Array.isArray(allowedValues)
      ? { enum: allowedValues.includes(null) ? allowedValues : [...(allowedValues as unknown[]), null] }
      : {}),
  } as OpenapiSchemaBodyShorthand
}
