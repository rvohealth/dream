import Dream from '../../Dream.js'
import JSONDecoratorRequiresJsonColumn from '../../errors/JSONDecoratorRequiresJsonColumn.js'
import JSONDecoratorShapeAllowsNull from '../../errors/JSONDecoratorShapeAllowsNull.js'
import ModelDeclaredShapeContainsReference from '../../errors/ModelDeclaredShapeContainsReference.js'
import { OpenapiSchemaBodyShorthandWithoutRefs, OpenapiShorthandPrimitiveTypes } from '../../types/openapi.js'
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
 * models are initialized at boot, a property that is not a json/jsonb column,
 * a shape that declares null for a non-array column, or a shape that contains
 * a reference (one that got past the types). It also marks the
 * declaration on the class's decorator metadata, so `STI()` refuses it on an
 * STI child when the child class is defined.
 */
export default function JSONDecorator(shape: JSONColumnShape): any {
  return function (_: undefined, context: DecoratorContext) {
    const key = context.name

    markDeclarationInMetadata(context, JSON_DECLARATION_METADATA_KEY)

    context.addInitializer(function (this: Dream) {
      const dreamClass: typeof Dream = this.constructor as typeof Dream
      if (!dreamClass['globallyInitializingDecorators']) return

      const columnMetadata = (
        dreamClass.prototype.schema[dreamClass.table]?.['columns'] as
          | Record<string, { dbType: string; isArray: boolean } | undefined>
          | undefined
      )?.[key]

      if (!columnMetadata || !JSON_DB_TYPES.includes(columnMetadata.dbType))
        throw new JSONDecoratorRequiresJsonColumn(dreamClass, key, columnMetadata?.dbType ?? null)

      // on a json[]/jsonb[] column the shape describes each element, and an
      // element may be null whether or not the column is
      if (!columnMetadata.isArray && shapeAllowsNull(shape))
        throw new JSONDecoratorShapeAllowsNull(dreamClass, key)

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

function shapeAllowsNull(shape: unknown): boolean {
  if (shape === 'null') return true
  if (Array.isArray(shape)) return shape.includes('null')
  if (!shape || typeof shape !== 'object') return false

  const schema = shape as {
    type?: unknown
    anyOf?: unknown
    oneOf?: unknown
    maybeNull?: unknown
  }

  if (schema.maybeNull === true) return true
  if (schema.type !== undefined && shapeAllowsNull(schema.type)) return true

  return [schema.anyOf, schema.oneOf].some(
    branches => Array.isArray(branches) && branches.some(branch => shapeAllowsNull(branch))
  )
}

export type JSONColumnShape = OpenapiShorthandPrimitiveTypes | OpenapiSchemaBodyShorthandWithoutRefs

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
