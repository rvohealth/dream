import ts from 'typescript'
import type Dream from '../../Dream.js'
import type { EncryptedAttributeStatement } from '../../decorators/field/Encrypted.js'
import type { JSONColumnShapeStatement } from '../../decorators/field/JSON.js'
import type { VirtualAttributeStatement } from '../../decorators/field-or-getter/Virtual.js'
import { OpenapiColumnFacts, openapiColumnShape } from '../../openapi/declaredShape.js'
import expandOpenapiShorthand, { OpenapiShorthandSegment } from '../../openapi/expandOpenapiShorthand.js'
import { propertyName } from './ASTBuilder.js'

const f = ts.factory

/**
 * @internal
 *
 * The TypeScript types a declared shape gives a property: `read`, the type of
 * the value Dream hands back, and `write`, the type of the value it takes.
 * They differ only where the shape has a `date` or `date-time` string: the
 * value is stored as JSON, so it reads back as a string, while a write may
 * also give a `CalendarDate` (for `date`) or a `DateTime` (for `date-time`),
 * which JSON encoding turns into that string. `same` is true when the two
 * are the same type.
 */
export interface DeclaredShapeTypes {
  read: ts.TypeNode
  write: ts.TypeNode
  same: boolean
}

/**
 * @internal
 *
 * The types of a `@deco.JSON` column, from the shape the table's models declare
 * for it, wrapped for the column as the declared-shape check wraps it (see
 * `openapiColumnShape`), using the column facts just read from the database
 * rather than the generated schema the app booted with, which a migration may
 * have made stale. `undefined` when no model of the table declares the column
 * with `@deco.JSON`.
 */
export function jsonColumnTypes(
  models: (typeof Dream)[],
  column: string,
  facts: OpenapiColumnFacts
): DeclaredShapeTypes | undefined {
  const shapes = models.flatMap(model =>
    ((model['jsonColumnShapes'] ?? []) as readonly JSONColumnShapeStatement[])
      .filter(statement => statement.column === column)
      .map(statement => statement.openapi)
  )

  return declaredShapesTypes(shapes, facts)
}

/**
 * @internal
 *
 * The types of each `@deco.Encrypted` property the table's models declare,
 * keyed by property and sorted by it. A property's value is the shape its
 * decorator declares, `'string'` for a bare `@deco.Encrypted()`, and `null`
 * besides when its backing column allows null (the backing column holds the
 * encrypted value as text, so only its nullability is the value's). When STI
 * children declare one property with different shapes, its types are the
 * union of theirs. `columnAllowsNull` answers from the database as just read.
 */
export function encryptedAttributeTypes(
  models: (typeof Dream)[],
  columnAllowsNull: (column: string) => boolean
): Map<string, DeclaredShapeTypes> {
  const shapesByProperty = new Map<string, { shape: OpenapiShorthandSegment; allowNull: boolean }[]>()

  for (const model of models) {
    const virtualAttributes = (model['virtualAttributes'] ?? []) as readonly VirtualAttributeStatement[]

    for (const statement of (model['encryptedAttributes'] ?? []) as readonly EncryptedAttributeStatement[]) {
      const declaredShape = statement.shapeDeclared
        ? virtualAttributes.find(attribute => attribute.property === statement.property)?.type
        : undefined

      const shapes = shapesByProperty.get(statement.property) ?? []
      shapes.push({
        shape: (declaredShape ?? 'string') as OpenapiShorthandSegment,
        allowNull: columnAllowsNull(statement.encryptedColumnName),
      })
      shapesByProperty.set(statement.property, shapes)
    }
  }

  const types = new Map<string, DeclaredShapeTypes>()
  for (const property of [...shapesByProperty.keys()].sort()) {
    const branches = shapesByProperty
      .get(property)!
      .map(({ shape, allowNull }) => declaredShapesTypes([shape], { isArray: false, allowNull })!)

    types.set(property, unionOfTypes(branches))
  }

  return types
}

/**
 * @internal
 *
 * The TypeScript type of the values an expanded, reference-free OpenAPI schema
 * accepts, read as the declared-shape check reads it:
 *
 * - `type` gives `string`, `number` (for `integer` and `number`), `boolean`,
 *   `null`, an array of the `items` type, or an object; a list of types gives
 *   their union. A `date` string, written, also takes a `CalendarDate`, and a
 *   `date-time` string a `DateTime`.
 * - `enum` and `const` give a union of their literal values.
 * - An object's `properties` are optional unless `required` lists them. It
 *   takes other keys too (an index signature of `unknown`), unless
 *   `additionalProperties` is `false`; an `additionalProperties` schema types
 *   them.
 * - `anyOf` and `oneOf` give the union of their branches, and `allOf` the
 *   intersection, beside whatever the schema's own `type` gives.
 * - Anything the schema does not constrain is `unknown`. Keywords a type
 *   cannot express (`minimum`, `pattern`, `not`, …) are not read, so the type
 *   may accept a value the check refuses, never the other way round.
 */
export function openapiSchemaTypeNode(schema: unknown, mode: 'read' | 'write'): ts.TypeNode {
  return new OpenapiSchemaTypeNodeBuilder(mode).typeNode(schema)
}

/**
 * The types of a property whose shape is any of `shapes` (more than one only
 * when several models of one table declare it), each expanded and wrapped for
 * its column. `undefined` when there is no shape.
 */
function declaredShapesTypes(
  shapes: readonly OpenapiShorthandSegment[],
  facts: OpenapiColumnFacts
): DeclaredShapeTypes | undefined {
  if (!shapes.length) return undefined

  return unionOfTypes(
    shapes.map(shape => {
      const schema = openapiColumnShape(expandOpenapiShorthand(shape), facts)
      const read = openapiSchemaTypeNode(schema, 'read')
      const write = openapiSchemaTypeNode(schema, 'write')
      return { read, write, same: printTypeNode(read) === printTypeNode(write) }
    })
  )
}

function unionOfTypes(types: DeclaredShapeTypes[]): DeclaredShapeTypes {
  if (types.length === 1) return types[0]!

  const read = unionTypeNode(types.map(type => type.read))
  const write = unionTypeNode(types.map(type => type.write))
  return { read, write, same: printTypeNode(read) === printTypeNode(write) }
}

class OpenapiSchemaTypeNodeBuilder {
  constructor(private mode: 'read' | 'write') {}

  public typeNode(schema: unknown): ts.TypeNode {
    if (schema === true) return keyword(ts.SyntaxKind.UnknownKeyword)
    if (schema === false) return keyword(ts.SyntaxKind.NeverKeyword)
    if (!schema || typeof schema !== 'object' || Array.isArray(schema))
      return keyword(ts.SyntaxKind.UnknownKeyword)

    const schemaRecord = schema as Record<string, unknown>
    const ownType = this.ownTypeNode(schemaRecord)

    const members: ts.TypeNode[] = []
    if (ownType) members.push(ownType)
    if (Array.isArray(schemaRecord.allOf))
      members.push(...schemaRecord.allOf.map(branch => this.typeNode(branch)))
    for (const combinator of ['anyOf', 'oneOf'] as const) {
      const branches = schemaRecord[combinator]
      if (Array.isArray(branches) && branches.length)
        members.push(unionTypeNode(branches.map(branch => this.typeNode(branch))))
    }

    if (!members.length) return keyword(ts.SyntaxKind.UnknownKeyword)
    if (members.length === 1) return members[0]!
    return f.createIntersectionTypeNode(members)
  }

  /**
   * The type the schema's own `const`, `enum` or `type` gives, or `undefined`
   * when it has none of them.
   */
  private ownTypeNode(schema: Record<string, unknown>): ts.TypeNode | undefined {
    const formatTypes = this.formatTypes(schema)

    if ('const' in schema) return literalTypeNode(schema.const) ?? this.declaredTypeNode(schema)

    if (Array.isArray(schema.enum)) {
      const literals = schema.enum.map(literalTypeNode)
      if (literals.every(literal => literal !== undefined))
        return unionTypeNode([...literals, ...(literals.length ? formatTypes : [])])
    }

    return this.declaredTypeNode(schema)
  }

  private declaredTypeNode(schema: Record<string, unknown>): ts.TypeNode | undefined {
    const types = Array.isArray(schema.type) ? (schema.type as unknown[]) : [schema.type]
    if (schema.type === undefined) return undefined

    return unionTypeNode(types.map(type => this.typeNodeForType(type, schema)))
  }

  private typeNodeForType(type: unknown, schema: Record<string, unknown>): ts.TypeNode {
    switch (type) {
      case 'string':
        return unionTypeNode([keyword(ts.SyntaxKind.StringKeyword), ...this.formatTypes(schema)])

      case 'integer':
      case 'number':
        return keyword(ts.SyntaxKind.NumberKeyword)

      case 'boolean':
        return keyword(ts.SyntaxKind.BooleanKeyword)

      case 'null':
        return f.createLiteralTypeNode(f.createNull())

      case 'array':
        return f.createArrayTypeNode(
          schema.items === undefined ? keyword(ts.SyntaxKind.UnknownKeyword) : this.typeNode(schema.items)
        )

      case 'object':
        return this.objectTypeNode(schema)

      default:
        return keyword(ts.SyntaxKind.UnknownKeyword)
    }
  }

  /**
   * An object's type: its `properties`, each optional unless `required` lists
   * it (a key `required` lists without a schema in `properties` is required as
   * `unknown`), and an index signature for any other key, unless
   * `additionalProperties` is `false`. The index signature also admits each
   * property's type (and `undefined`, when one is optional), which TypeScript
   * requires of the properties beside it.
   */
  private objectTypeNode(schema: Record<string, unknown>): ts.TypeNode {
    const properties =
      schema.properties && typeof schema.properties === 'object' && !Array.isArray(schema.properties)
        ? (schema.properties as Record<string, unknown>)
        : {}
    const required = new Set(
      Array.isArray(schema.required)
        ? schema.required.filter((key): key is string => typeof key === 'string')
        : []
    )

    const propertyTypes = new Map<string, ts.TypeNode>(
      Object.keys(properties).map(key => [key, this.typeNode(properties[key])])
    )
    for (const key of required) {
      if (!propertyTypes.has(key)) propertyTypes.set(key, keyword(ts.SyntaxKind.UnknownKeyword))
    }

    const members: ts.TypeElement[] = [...propertyTypes].map(([key, type]) =>
      f.createPropertySignature(
        undefined,
        propertyName(key),
        required.has(key) ? undefined : f.createToken(ts.SyntaxKind.QuestionToken),
        type
      )
    )

    const additionalProperties = schema.additionalProperties
    if (additionalProperties !== false) {
      const additionalType =
        additionalProperties === undefined || additionalProperties === true
          ? keyword(ts.SyntaxKind.UnknownKeyword)
          : this.typeNode(additionalProperties)

      const someOptional = [...propertyTypes.keys()].some(key => !required.has(key))
      members.push(
        f.createIndexSignature(
          undefined,
          [
            f.createParameterDeclaration(
              undefined,
              undefined,
              'key',
              undefined,
              keyword(ts.SyntaxKind.StringKeyword)
            ),
          ],
          unionTypeNode([
            additionalType,
            ...propertyTypes.values(),
            ...(someOptional ? [keyword(ts.SyntaxKind.UndefinedKeyword)] : []),
          ])
        )
      )
    }

    return f.createTypeLiteralNode(members)
  }

  /**
   * The classes a written `date` or `date-time` string may also be given as.
   */
  private formatTypes(schema: Record<string, unknown>): ts.TypeNode[] {
    if (this.mode === 'read') return []

    switch (schema.format) {
      case 'date':
        return [f.createTypeReferenceNode('CalendarDate')]
      case 'date-time':
        return [f.createTypeReferenceNode('DateTime')]
      default:
        return []
    }
  }
}

function keyword(kind: ts.KeywordTypeSyntaxKind) {
  return f.createKeywordTypeNode(kind)
}

function literalTypeNode(value: unknown): ts.TypeNode | undefined {
  if (value === null) return f.createLiteralTypeNode(f.createNull())
  if (typeof value === 'string') return f.createLiteralTypeNode(f.createStringLiteral(value, true))
  if (typeof value === 'boolean') return f.createLiteralTypeNode(value ? f.createTrue() : f.createFalse())
  if (typeof value === 'number' && Number.isFinite(value))
    return value < 0
      ? f.createLiteralTypeNode(
          f.createPrefixUnaryExpression(ts.SyntaxKind.MinusToken, f.createNumericLiteral(-value))
        )
      : f.createLiteralTypeNode(f.createNumericLiteral(value))
  return undefined
}

/**
 * The union of the types, without repeats (compared as printed), with
 * `unknown` absorbing every other member and a single member left unwrapped.
 */
function unionTypeNode(types: ts.TypeNode[]): ts.TypeNode {
  const flattened = types.flatMap(type => (ts.isUnionTypeNode(type) ? [...type.types] : [type]))
  if (flattened.some(type => type.kind === ts.SyntaxKind.UnknownKeyword))
    return keyword(ts.SyntaxKind.UnknownKeyword)

  const unique = new Map<string, ts.TypeNode>()
  for (const type of flattened) {
    const printed = printTypeNode(type)
    if (!unique.has(printed)) unique.set(printed, type)
  }

  const members = [...unique.values()]
  if (members.length === 0) return keyword(ts.SyntaxKind.NeverKeyword)
  if (members.length === 1) return members[0]!
  return f.createUnionTypeNode(members)
}

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
const printSourceFile = ts.createSourceFile('', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS)

/**
 * @internal
 *
 * The type as TypeScript source.
 */
export function printTypeNode(type: ts.TypeNode): string {
  return printer.printNode(ts.EmitHint.Unspecified, type, printSourceFile)
}
