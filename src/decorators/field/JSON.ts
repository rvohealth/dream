import Dream from '../../Dream.js'
import JSONDecoratorRequiresJsonColumn from '../../errors/JSONDecoratorRequiresJsonColumn.js'
import JSONDecoratorShapeAdmitsString from '../../errors/JSONDecoratorShapeAdmitsString.js'
import JSONDecoratorShapeAllowsNull from '../../errors/JSONDecoratorShapeAllowsNull.js'
import ModelDeclaredShapeContainsReference from '../../errors/ModelDeclaredShapeContainsReference.js'
import {
  OpenapiSchemaBodyShorthandWithoutRefs,
  OpenapiSchemaCommonFields,
  OpenapiSchemaInteger,
  OpenapiSchemaNull,
  OpenapiSchemaNumber,
  OpenapiSchemaShorthandPrimitiveGeneric,
  OpenapiShorthandPrimitiveBaseTypes,
} from '../../types/openapi.js'
import { DecoratorContext } from '../DecoratorContextType.js'
import { markDeclarationInMetadata } from '../helpers/declarationMetadata.js'
import findOpenapiShapeReference from '../helpers/findOpenapiShapeReference.js'
import registerOnce from '../helpers/registerOnce.js'

const JSON_DB_TYPES = ['json', 'jsonb', 'json[]', 'jsonb[]']

/**
 * The decorator metadata key under which `@deco.JSON` records the columns a
 * class declares itself, read by `STI()` to refuse `@deco.JSON` on an STI
 * child.
 */
export const JSON_DECLARATION_METADATA_KEY = Symbol('dream:jsonDeclarationNames')

/**
 * The implementation behind `@deco.JSON`, documented on `Decorators#JSON`.
 *
 * Registers the declared shape under `jsonColumnShapes` (never
 * `virtualAttributes`: the decorated property is a real column, so readers
 * keep applying the column's nullability and array-ness), and refuses, when
 * models are initialized at boot, a shape that contains a reference (one that
 * got past the types). It also marks the declaration on the class's decorator
 * metadata, so `STI()` refuses it on an STI child when the child class is
 * defined.
 *
 * The refusals that read the generated schema (a property that is not a
 * json/jsonb column, a shape that declares null for a non-array column, a
 * shape that admits a string) are not made here but by
 * `validateJsonColumnShapes`, which `DreamApp#init` runs with its other
 * checks of the models against the schema.
 */
export default function JSONDecorator(shape: JSONColumnShape): any {
  return function (_: undefined, context: DecoratorContext) {
    const key = context.name

    markDeclarationInMetadata(context, JSON_DECLARATION_METADATA_KEY)

    context.addInitializer(function (this: Dream) {
      const dreamClass: typeof Dream = this.constructor as typeof Dream
      if (!dreamClass['globallyInitializingDecorators']) return

      const reference = findOpenapiShapeReference(shape)
      if (reference)
        throw new ModelDeclaredShapeContainsReference(
          dreamClass,
          '@deco.JSON',
          key,
          reference.key,
          reference.path
        )

      registerOnce(
        dreamClass,
        'jsonColumnShapes',
        { column: key, openapi: shape } satisfies JSONColumnShapeStatement,
        (existing, entry) => existing.column === entry.column
      )
    })
  }
}

/**
 * Refuses each `@deco.JSON` on `dreamClass` whose property is not a json/jsonb
 * column, whose shape declares null for a column that is not an array, or
 * whose shape admits a string (for a json[]/jsonb[] column, as an element).
 *
 * A string is refused because Dream stores a string given for a json/jsonb
 * value as already-encoded JSON text, so a string value cannot round-trip:
 * `'{"admin":true}'` is saved and read back as an object, and `'hello'` is
 * not JSON and fails when it is saved. A shape that admits a string would let
 * a client store any JSON value by sending it encoded, past the shape.
 *
 * These refusals read the generated schema, so `DreamApp#init` runs this with
 * its other checks of the models against the schema, which the commands that
 * regenerate the schema (`sync`, `db:migrate`, `g:migration`) bypass with
 * `bypassDreamIntegrityChecks`: until they regenerate it, the schema they boot
 * against need not have a column that was just added or changed.
 */
export function validateJsonColumnShapes(dreamClass: typeof Dream) {
  // an STI child's shapes are its base's (`@deco.JSON` on an STI child is
  // refused), so they are checked, and named, on the base
  if (dreamClass['isSTIChild']) return

  const columns = dreamClass.prototype.schema[dreamClass.table]?.['columns'] as
    | Record<string, { dbType: string; isArray: boolean } | undefined>
    | undefined

  for (const { column, openapi } of dreamClass['jsonColumnShapes']) {
    const columnMetadata = columns?.[column]

    if (!columnMetadata || !JSON_DB_TYPES.includes(columnMetadata.dbType))
      throw new JSONDecoratorRequiresJsonColumn(dreamClass, column, columnMetadata?.dbType ?? null)

    // on a json[]/jsonb[] column the shape describes each element, and an
    // element may be null whether or not the column is
    if (!columnMetadata.isArray && shapeAllowsNull(openapi))
      throw new JSONDecoratorShapeAllowsNull(dreamClass, column)

    // on a json[]/jsonb[] column the shape describes each element, which is
    // stored the same way, so it is refused there too
    if (shapeAdmitsString(openapi))
      throw new JSONDecoratorShapeAdmitsString(dreamClass, column, columnMetadata.isArray)
  }
}

// the shorthand types that render as `type: 'string'` ('decimal' renders as a
// number and 'json' as an object)
const STRING_SHORTHAND_TYPES = ['string', 'date', 'date-time'] as const

/**
 * Whether the shape itself admits a string, by JSON Schema: a string must get
 * past every keyword the shape has, so its `type` must admit one, its `enum`
 * list one, every `allOf` branch admit one and some `anyOf` and `oneOf`
 * branch admit one. A shape with none of these admits anything. As in
 * `shapeAllowsNull`, `properties` and `items` are never read: a string inside
 * the shape is not a string value of the column.
 */
function shapeAdmitsString(shape: unknown): boolean {
  if (typeof shape === 'string') return (STRING_SHORTHAND_TYPES as readonly string[]).includes(shape)
  if (Array.isArray(shape)) return shape.some(shapeAdmitsString)
  if (!shape || typeof shape !== 'object') return false

  const schema = shape as {
    type?: unknown
    enum?: unknown
    allOf?: unknown
    anyOf?: unknown
    oneOf?: unknown
  }

  if (schema.type !== undefined && !shapeAdmitsString(schema.type)) return false
  if (Array.isArray(schema.enum) && !schema.enum.some(value => typeof value === 'string')) return false
  if (Array.isArray(schema.allOf) && !schema.allOf.every(shapeAdmitsString)) return false

  return [schema.anyOf, schema.oneOf].every(
    branches => !Array.isArray(branches) || branches.some(shapeAdmitsString)
  )
}

/**
 * Whether the shape itself admits null. Only the shape's own `type`,
 * `maybeNull` and compositions are read, never its `properties` or `items`:
 * a nullable property or element inside the shape is not a null value of the
 * column.
 */
function shapeAllowsNull(shape: unknown): boolean {
  if (shape === 'null') return true
  if (Array.isArray(shape)) return shape.includes('null')
  if (!shape || typeof shape !== 'object') return false

  const schema = shape as {
    type?: unknown
    allOf?: unknown
    anyOf?: unknown
    oneOf?: unknown
    maybeNull?: unknown
  }

  if (schema.maybeNull === true) return true
  if (schema.type !== undefined && shapeAllowsNull(schema.type)) return true

  // a value matches an allOf only when it matches every branch, so null
  // passes one only when every branch admits it
  if (Array.isArray(schema.allOf) && schema.allOf.length > 0 && schema.allOf.every(shapeAllowsNull))
    return true

  return [schema.anyOf, schema.oneOf].some(
    branches => Array.isArray(branches) && branches.some(branch => shapeAllowsNull(branch))
  )
}

type StringShorthandType = (typeof STRING_SHORTHAND_TYPES)[number]
type NonStringShorthandBaseType = Exclude<OpenapiShorthandPrimitiveBaseTypes, StringShorthandType>
type NonStringShorthandType =
  | NonStringShorthandBaseType
  | [NonStringShorthandBaseType, 'null']
  | ['null', NonStringShorthandBaseType]

/**
 * The shape `@deco.JSON` accepts: any shape without a reference, except one
 * whose own type is a string (`'string'`, `'date'`, `'date-time'`, or
 * `{ type: 'string' }`), which `validateJsonColumnShapes` refuses at boot. A
 * string reached through a composition (an `anyOf` or `oneOf` branch) is not a
 * compile error, only refused at boot. `Exclude` takes out every member whose
 * `type` is a primitive (string, integer, number, null and the generic
 * shorthand); the non-string ones are added back.
 */
export type JSONColumnShape =
  | NonStringShorthandType
  | Exclude<OpenapiSchemaBodyShorthandWithoutRefs, OpenapiSchemaShorthandPrimitiveGeneric>
  | OpenapiSchemaInteger
  | OpenapiSchemaNumber
  | OpenapiSchemaNull
  | OpenapiSchemaCommonFields<{ type: NonStringShorthandType }>

/**
 * The decorator returned by `deco.JSON(shape)`. It accepts only a class field
 * named after one of the model's json/jsonb columns, so decorating any other
 * property is a compile error.
 */
export type JSONColumnDecorator<ColumnName extends string> = (
  value: undefined,
  context: ClassFieldDecoratorContext<any, any> & { name: ColumnName }
) => void

export interface JSONColumnShapeStatement {
  column: string
  openapi: JSONColumnShape
}
