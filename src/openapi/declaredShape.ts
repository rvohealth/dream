import type { ValidateFunction } from 'ajv'
import type Dream from '../Dream.js'
import type { EncryptedAttributeStatement } from '../decorators/field/Encrypted.js'
import type { JSONColumnShapeStatement } from '../decorators/field/JSON.js'
import type {
  VirtualAttributeShape,
  VirtualAttributeStatement,
} from '../decorators/field-or-getter/Virtual.js'
import type { ModelShapeDecoratorName } from '../errors/ModelDeclaredShapeContainsReference.js'
import { OpenapiSchemaBody, OpenapiShorthandPrimitiveTypes } from '../types/openapi.js'
import createOpenapiAjv from './createOpenapiAjv.js'
import expandOpenapiShorthand, { OpenapiShorthandSegment } from './expandOpenapiShorthand.js'
import { openapiSchemaAcceptsNull, openapiSchemaWithNull } from './openapiSchemaNullability.js'

/**
 * @internal
 *
 * What a column says about the value a declared shape describes: whether it is
 * an array of such values (a json[]/jsonb[] column), and whether it may be
 * null.
 */
export interface OpenapiColumnFacts {
  isArray: boolean
  allowNull: boolean
}

/**
 * @internal
 *
 * A shape a model declares for one of its properties, with the decorator that
 * declared it and, for `@deco.JSON` and `@deco.Encrypted`, what the column
 * backing it says about the value.
 */
export interface ModelDeclaredShape {
  decorator: ModelShapeDecoratorName
  shape: VirtualAttributeShape | JSONColumnShapeStatement['openapi']
  column: OpenapiColumnFacts | null
}

/**
 * @internal
 *
 * One AJV error of a declared-shape check, copied out of the validator so a
 * later check cannot overwrite it. It names where in the value the check
 * failed (`instancePath`), which can include a key of the checked value.
 */
export interface DeclaredShapeError {
  instancePath: string
  keyword: string
  message: string | undefined
}

/**
 * @internal
 */
export type DeclaredShapeCheck = { isValid: true } | { isValid: false; errors: DeclaredShapeError[] }

/**
 * @internal
 *
 * The column wrapper: the full schema of a column, or of an attribute backed by
 * a column, whose declared shape describes one non-null value. On a
 * json[]/jsonb[] column the shape describes each element, so the column is an
 * array of it; a column that allows null adds `null` to the shape, unless the
 * shape already accepts it. `@deco.JSON` and `@deco.Encrypted` both take their
 * array-ness and nullability from their column this way.
 */
export function openapiColumnShape(shape: OpenapiSchemaBody, column: OpenapiColumnFacts): OpenapiSchemaBody {
  if (column.isArray)
    return {
      type: column.allowNull ? ['array', 'null'] : 'array',
      items: shape,
    } as OpenapiSchemaBody

  if (column.allowNull && !openapiSchemaAcceptsNull(shape))
    return openapiSchemaWithNull(shape) as OpenapiSchemaBody

  return shape
}

/**
 * @internal
 *
 * The shape `dreamClass` declares for `property`: its `@deco.JSON` column
 * shape, or the shape of its `@deco.Virtual` or `@deco.Encrypted` attribute
 * (a bare `@deco.Encrypted()` declares `'string'`). `undefined` when the
 * property declares none.
 */
export function modelDeclaredShape(
  dreamClass: typeof Dream,
  property: string
): ModelDeclaredShape | undefined {
  const jsonColumnShapes = (dreamClass['jsonColumnShapes'] ?? []) as readonly JSONColumnShapeStatement[]
  const jsonColumnShape = jsonColumnShapes.find(statement => statement.column === property)
  if (jsonColumnShape)
    return {
      decorator: '@deco.JSON',
      shape: jsonColumnShape.openapi,
      column: columnFacts(dreamClass, property),
    }

  const virtualAttributes = (dreamClass['virtualAttributes'] ?? []) as readonly VirtualAttributeStatement[]
  const shape = virtualAttributes.find(statement => statement.property === property)?.type
  if (shape === undefined) return undefined

  const encryptedAttributes = (dreamClass['encryptedAttributes'] ??
    []) as readonly EncryptedAttributeStatement[]
  const encryptedAttribute = encryptedAttributes.find(statement => statement.property === property)
  if (encryptedAttribute)
    return {
      decorator: '@deco.Encrypted',
      shape,
      // the backing column holds the encrypted value as text, so only its
      // nullability is the value's
      column: {
        isArray: false,
        allowNull: columnFacts(dreamClass, encryptedAttribute.encryptedColumnName).allowNull,
      },
    }

  return { decorator: '@deco.Virtual', shape, column: null }
}

/**
 * @internal
 *
 * The full OpenAPI schema of the shape `dreamClass` declares for `property`:
 * for a `@deco.JSON` column and a `@deco.Encrypted` attribute, the expanded
 * declaration wrapped by its column (see `openapiColumnShape`); for a
 * `@deco.Virtual` attribute, the expanded declaration. `undefined` when the
 * property declares no shape.
 *
 * This is the schema `validateDeclaredShape` checks a value against, and the
 * one Psychic renders for the property, so the two never differ. A
 * declaration does not change after boot, so the schema is built once per
 * model and property.
 */
export function declaredShapeSchema(
  dreamClass: typeof Dream,
  property: string
): OpenapiSchemaBody | undefined {
  return memoizedPerProperty(declaredShapeSchemas, dreamClass, property, () => {
    const declaration = modelDeclaredShape(dreamClass, property)
    if (!declaration) return undefined

    const expanded = expandOpenapiShorthand(
      declaration.shape as OpenapiShorthandPrimitiveTypes | OpenapiShorthandSegment
    )
    return declaration.column ? openapiColumnShape(expanded, declaration.column) : expanded
  })
}

/**
 * @internal
 *
 * Checks `value` against the shape `dreamClass` declares for `property`, as
 * given: no coercion, no defaults, nothing removed. The result is a snapshot
 * of this check alone, never the validator itself, whose errors the next check
 * overwrites. Throws when the property declares no shape.
 */
export function validateDeclaredShape(
  dreamClass: typeof Dream,
  property: string,
  value: unknown
): DeclaredShapeCheck {
  const validator = declaredShapeValidator(dreamClass, property)
  if (validator(value)) return { isValid: true }

  return {
    isValid: false,
    errors: (validator.errors ?? []).map(({ instancePath, keyword, message }) => ({
      instancePath,
      keyword,
      message,
    })),
  }
}

/**
 * The validator `validateDeclaredShape` checks a property with, compiled the
 * first time the property is checked and reused after.
 */
function declaredShapeValidator(dreamClass: typeof Dream, property: string): ValidateFunction {
  return memoizedPerProperty(declaredShapeValidators, dreamClass, property, () => {
    const schema = declaredShapeSchema(dreamClass, property)
    if (schema === undefined)
      throw new Error(
        `${dreamClass.name}#${property} declares no shape to check (with @deco.JSON, @deco.Virtual or @deco.Encrypted)`
      )

    // no coercion and no defaults: the value must already match, and is
    // validated exactly as given
    return createOpenapiAjv({ coerceTypes: false, useDefaults: false, removeAdditional: false }).compile(
      schema
    )
  })
}

function columnFacts(dreamClass: typeof Dream, column: string): OpenapiColumnFacts {
  const columnMetadata = dreamClass.prototype.schema?.[dreamClass.table]?.['columns']?.[column] as
    | Partial<OpenapiColumnFacts>
    | undefined

  // a boot that bypassed the integrity checks may find no column here
  return { isArray: columnMetadata?.isArray ?? false, allowNull: columnMetadata?.allowNull ?? false }
}

// a declaration does not change after boot, so its schema and validator are
// built once per model and property
const declaredShapeSchemas = new WeakMap<typeof Dream, Map<string, OpenapiSchemaBody | undefined>>()
const declaredShapeValidators = new WeakMap<typeof Dream, Map<string, ValidateFunction>>()

function memoizedPerProperty<T>(
  cache: WeakMap<typeof Dream, Map<string, T>>,
  dreamClass: typeof Dream,
  property: string,
  build: () => T
): T {
  let entries = cache.get(dreamClass)
  if (!entries) {
    entries = new Map()
    cache.set(dreamClass, entries)
  }

  if (!entries.has(property)) entries.set(property, build())
  return entries.get(property)!
}
