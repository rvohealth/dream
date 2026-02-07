import * as path from 'node:path'
import ts from 'typescript'
import DreamApp from '../../dream-app/index.js'
import { DreamConst } from '../../dream/constants.js'
import EnvInternal from '../EnvInternal.js'

const f = ts.factory

/**
 * @internal
 *
 * This is a base class, which is inherited by the ASTSchemaBuilder,
 * the ASTKyselyCodegenEnhancer, and the ASTGlobalSchemaBuilder,
 * each of which is responsible for building up the output of the various
 * type files consumed by dream internally.
 *
 * This base class is just a container for common methods used by all
 * classes.
 */
export default class ASTBuilder {
  /**
   * @internal
   *
   * builds a new line, useful for injecting new lines into AST statements
   */
  protected newLine() {
    return f.createIdentifier('\n')
  }

  /**
   * @internal
   *
   * given an interface declaration, it will extrace the relevant property statement
   * by the given property name.
   */
  protected getPropertyFromInterface(
    interfaceNode: ts.InterfaceDeclaration,
    propertyName: string
  ): ts.PropertySignature | null {
    for (const member of interfaceNode.members) {
      if (ts.isPropertySignature(member)) {
        if (ts.isIdentifier(member.name) && member.name.text === propertyName) {
          return member
        }
      }
    }

    return null
  }

  /**
   * @internal
   *
   * returns an array of string type literals which were extracted from
   * either a type or type union, depending on what is provided
   * for the typeAlias. this allows you to safely and easily collect
   * an array of types given an alias
   */
  protected extractStringLiteralTypeNodesFromTypeOrUnion(
    typeAlias: ts.TypeAliasDeclaration
  ): // this return type is mangled a bit, so that on the other side it will be
  // easy to extract the text field from the literal without additional type checking.
  // if isStringLiteral is true, then the text field will be present, but abstracting this
  // out to a common function has caused type recognition to degrade here, forcing me to
  // be a little more direct.
  (ts.LiteralTypeNode & { literal: { text: string } })[] {
    const literals: ReturnType<ASTBuilder['extractStringLiteralTypeNodesFromTypeOrUnion']> = []

    if (ts.isUnionTypeNode(typeAlias.type)) {
      typeAlias.type.types.forEach(typeNode => {
        if (ts.isLiteralTypeNode(typeNode) && ts.isStringLiteral(typeNode.literal)) {
          literals.push(typeNode as (typeof literals)[number])
        }
      })
    } else if (ts.isLiteralTypeNode(typeAlias.type) && ts.isStringLiteral(typeAlias.type.literal)) {
      literals.push(typeAlias.type as (typeof literals)[number])
    }

    return literals
  }

  /**
   * @internal
   *
   * returns an array of type literals which were extracted from
   * either a type or type union, depending on what is provided
   * for the typeAlias. this allows you to safely and easily collect
   * an array of types given an alias
   */
  protected extractTypeNodesFromTypeOrUnion(
    typeAlias: ts.TypeAliasDeclaration | ts.PropertySignature
  ): ts.TypeNode[] {
    const literals: ts.TypeNode[] = []

    if (typeAlias.type && ts.isUnionTypeNode(typeAlias.type)) {
      typeAlias.type.types.forEach(typeNode => {
        literals.push(typeNode)
      })
    } else if (typeAlias.type) {
      literals.push(typeAlias.type)
    }

    return literals
  }

  /**
   * @internal
   *
   * returns the provided node iff
   *   a.) the node is an exported type alias
   *   b.) the exported name matches the provided name (or else there was no name provided)
   *
   *  otherwise, returns null
   */
  protected exportedTypeAliasOrNull(node: ts.Node, exportName?: string): ts.TypeAliasDeclaration | null {
    if (
      ts.isTypeAliasDeclaration(node) &&
      node?.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) &&
      (!exportName ? true : node.name.text === exportName)
    )
      return node

    return null
  }

  /**
   * @internal
   *
   * returns the provided node iff
   *   a.) the node is an exported interface
   *   b.) the exported name matches the provided name (or else there was no name provided)
   *
   *  otherwise, returns null
   */
  protected exportedInterfaceOrNull(node: ts.Node, exportName?: string): ts.InterfaceDeclaration | null {
    if (
      ts.isInterfaceDeclaration(node) &&
      node?.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) &&
      (!exportName ? true : node.name.text === exportName)
    )
      return node

    return null
  }

  /**
   * @internal
   *
   * extracts the exportName from the provided dbSourceFile
   */
  protected findDbExport(dbSourceFile: ts.SourceFile, exportName: string) {
    let foundNode: ts.Node | undefined

    ts.forEachChild(dbSourceFile, node => {
      const hasModifiers =
        ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isVariableStatement(node) ||
        ts.isTypeAliasDeclaration(node)

      if (hasModifiers) {
        const isExported = node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)

        if (isExported && ts.isVariableStatement(node)) {
          const declarations = node.declarationList.declarations
          const name = declarations?.[0]?.name as ts.Identifier

          if (declarations.length > 0 && ts.isIdentifier(name) && name?.text === exportName) {
            foundNode = node
            return true // Stop traversal
          }
        }

        const declarationWithName = node as any
        if (
          isExported &&
          declarationWithName.name &&
          ts.isIdentifier(declarationWithName.name) &&
          declarationWithName.name.text === exportName
        ) {
          foundNode = node
          return true // Stop traversal
        }
      }
    })

    return foundNode
  }

  /**
   * @internal
   *
   * returns the path to the dream.globals.ts file
   */
  protected globalSchemaPath() {
    const dreamApp = DreamApp.getOrFail()
    return path.join(dreamApp.projectRoot, dreamApp.paths.types, 'dream.globals.ts')
  }

  /**
   * @internal
   *
   * safely runs prettier against the provided output. If prettier
   * is not installed, then the original output is returned
   */
  protected async prettier(output: string): Promise<string> {
    try {
      // dynamically, safely bring in prettier.
      // ini the event that it fails, we will return the
      // original output, unformatted, since prettier
      // is technically not a real dependency of dream,
      // though psychic and dream apps are provisioned
      // with prettier by default, so this should usually work
      const prettier = (await import('prettier')).default as {
        format: (str: string, opts: object) => Promise<string>
      }

      const results = await prettier.format(output, {
        parser: 'typescript',
        semi: false,
        singleQuote: true,
        tabWidth: 2,
        lineWidth: 80,
      })

      return typeof results === 'string' ? results : output
    } catch {
      // intentional noop, we don't want to raise if prettier
      // fails, since it is possible for the end user to not
      // want to use prettier, and it is not a required peer
      // dependency of dream
      return output
    }
  }

  /**
   * @internal
   *
   * given a type node, it will send back the first found generic
   * provided to that type.
   */
  protected getFirstGenericType(node: ts.Node): ts.TypeNode | null {
    if (ts.isTypeReferenceNode(node)) {
      if (node.typeArguments && node.typeArguments.length > 0) {
        return node.typeArguments[0]!
      }
    } else if (ts.isCallExpression(node)) {
      if (node.typeArguments && node.typeArguments.length > 0) {
        return node.typeArguments[0]!
      }
    }

    return null
  }

  /**
   * @internal
   *
   * returns the DateTime and CalendarDate imports. This is fairly
   * tricky, since it considers whether or not we are in the dream
   * internals (i.e. when testing dream). If we are, it will return
   * valid internal import paths to those files. Otherwise, it will
   * import them both from @rvoh/dream.
   */
  protected dateAndDateTimeImports(): ts.ImportDeclaration[] {
    if (EnvInternal.boolean('DREAM_CORE_DEVELOPMENT')) {
      const calendarImport = ts.factory.createImportClause(
        true,
        f.createIdentifier('CalendarDate'),
        undefined
      )
      const calendarImportDeclaration = ts.factory.createImportDeclaration(
        undefined,
        calendarImport,
        ts.factory.createStringLiteral('../../src/utils/datetime/CalendarDate.js')
      )

      const dateTimeNamedImports = ts.factory.createNamedImports([
        f.createImportSpecifier(true, undefined, ts.factory.createIdentifier('DateTime')),
      ])
      const dateTimeImportClause = ts.factory.createImportClause(
        false, // isTypeOnly: false for the clause itself if not all imports are type only
        undefined, // name: undefined for default import
        dateTimeNamedImports // namedBindings
      )
      const dateTimeImportDeclaration = ts.factory.createImportDeclaration(
        undefined,
        dateTimeImportClause,
        ts.factory.createStringLiteral('../../src/utils/datetime/DateTime.js')
      )

      return [calendarImportDeclaration, dateTimeImportDeclaration]
    } else {
      const namedImports = ts.factory.createNamedImports(
        ['CalendarDate', 'DateTime'].map(importName =>
          f.createImportSpecifier(true, undefined, ts.factory.createIdentifier(importName))
        )
      )

      const importClause = ts.factory.createImportClause(
        false, // isTypeOnly: false for the clause itself if not all imports are type only
        undefined, // name: undefined for default import
        namedImports // namedBindings
      )

      const importDeclaration = ts.factory.createImportDeclaration(
        undefined, // modifiers: e.g., 'export' or 'declare'
        importClause,
        ts.factory.createStringLiteral('@rvoh/dream')
      )
      return [importDeclaration]
    }
  }

  /**
   * @internal
   *
   * for a given table name (i.e. balloon_lines), it will return the exported
   * `BalloonLines` interface within the dbSourceFile
   */
  protected getTableInterfaceDeclaration(dbSourceFile: ts.SourceFile, tableName: string) {
    const DB = this.findDbExport(dbSourceFile, 'DB') as ts.InterfaceDeclaration

    let targetProperty: ts.PropertySignature | null = null
    for (const member of DB.members) {
      if (ts.isPropertySignature(member) && member.name.getText(dbSourceFile) === tableName) {
        targetProperty = member
        break
      }
    }

    const tableInterfaceName = (targetProperty?.type as unknown as { typeName: { escapedText: string } })
      .typeName?.escapedText
    if (!tableInterfaceName) throw new Error(`failed to find table interface for table: ${tableName}`)

    const tableInterface = this.findDbExport(dbSourceFile, tableInterfaceName)
    return tableInterface as ts.InterfaceDeclaration
  }

  /**
   * @internal
   *
   * returns an array of global names for all serializers in the app
   */
  protected globalSerializerNames(): string[] {
    const dreamApp = DreamApp.getOrFail()
    const serializers = dreamApp.serializers
    return Object.keys(serializers)
  }
}

export interface SchemaData {
  [key: string]: TableData
}

export interface TableData {
  serializerKeys: readonly string[]
  scopes: {
    default: readonly string[]
    named: readonly string[]
  }
  columns: Readonly<{ [key: string]: SchemaBuilderColumnData }>
  virtualColumns: readonly string[]
  associations: Readonly<{ [key: string]: SchemaBuilderAssociationData }>
}

export interface SchemaBuilderAssociationData {
  tables: string[]
  type: 'BelongsTo' | 'HasOne' | 'HasMany'
  polymorphic: boolean
  optional: boolean | null
  foreignKey: string | null
  foreignKeyTypeColumn: string | null
  and: Record<string, string | typeof DreamConst.passthrough | typeof DreamConst.required> | null
}

export interface SchemaBuilderColumnData {
  dbType: string
  allowNull: boolean
  enumType: string | null
  enumValues: string | null
  foreignKey: string | null
  isArray: boolean
}

export interface SchemaBuilderInformationSchemaRow {
  columnName: string
  udtName: string
  dataType: string
  isNullable: 'YES' | 'NO'
}
