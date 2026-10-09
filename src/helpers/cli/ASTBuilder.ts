import * as path from 'node:path'
import ts from 'typescript'
import DreamApp from '../../dream-app/index.js'
import { DreamConst } from '../../dream/constants.js'
import { IntrospectedValueType } from '../../types/db.js'
import EnvInternal from '../EnvInternal.js'

const f = ts.factory

/**
 * @internal
 *
 * This is a base class, which is inherited by the ASTSchemaBuilder,
 * the ASTDbTypesBuilder, and the ASTGlobalSchemaBuilder,
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

      const clockTimeImport = ts.factory.createImportClause(true, f.createIdentifier('ClockTime'), undefined)
      const clockTimeImportDeclaration = ts.factory.createImportDeclaration(
        undefined,
        clockTimeImport,
        ts.factory.createStringLiteral('../../src/utils/datetime/ClockTime.js')
      )

      const clockTimeTzImport = ts.factory.createImportClause(
        true,
        f.createIdentifier('ClockTimeTz'),
        undefined
      )
      const clockTimeTzImportDeclaration = ts.factory.createImportDeclaration(
        undefined,
        clockTimeTzImport,
        ts.factory.createStringLiteral('../../src/utils/datetime/ClockTimeTz.js')
      )

      return [
        calendarImportDeclaration,
        dateTimeImportDeclaration,
        clockTimeImportDeclaration,
        clockTimeTzImportDeclaration,
      ]
    } else {
      const namedImports = ts.factory.createNamedImports(
        ['CalendarDate', 'DateTime', 'ClockTime', 'ClockTimeTz'].map(importName =>
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
   * returns an array of global names for all serializers in the app
   */
  protected globalSerializerNames(): string[] {
    const dreamApp = DreamApp.getOrFail()
    const serializers = dreamApp.serializers
    return Object.keys(serializers)
  }

  /**
   * @internal
   *
   * checks if a database type is a date type (with optional array suffix)
   */
  protected isDateDbType(dbType: string): boolean {
    return /^date[[\]]*$/.test(dbType)
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
  valueType: IntrospectedValueType
  allowNull: boolean
  enumType: string | null
  enumValues: string | null
  foreignKey: string | null
  isArray: boolean
}
