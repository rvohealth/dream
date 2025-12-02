import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import ts from 'typescript'
import dbTypesFilenameForConnection from '../../db/helpers/dbTypesFilenameForConnection.js'
import dreamSchemaTypesFilenameForConnection from '../../db/helpers/dreamSchemaTypesFilenameForConnection.js'
import DreamApp from '../../dream-app/index.js'
import Dream from '../../Dream.js'
import Query from '../../dream/Query.js'
import {
  ExplicitForeignKeyRequired,
  InvalidComputedForeignKey,
} from '../../errors/associations/InvalidComputedForeignKey.js'
import FailedToIdentifyAssociation from '../../errors/schema-builder/FailedToIdentifyAssociation.js'
import { HasManyStatement } from '../../package-exports/types.js'
import intersection from '../intersection.js'
import sortBy from '../sortBy.js'
import uniq from '../uniq.js'
import ASTBuilder, { SchemaBuilderAssociationData, SchemaData } from './ASTBuilder.js'

/**
 * @internal
 *
 * This is a base class, which is inherited by the ASTSchemaBuilder and
 * the ASTKyselyCodegenEnhancer, both of which is responsible for building
 * up the output of the various type files consumed by dream internally.
 *
 * This base class is just a container for common methods used by both
 * classes. It requires a connectionName to be provided, unlike the underlying
 * ASTBuilder class, and provides methods which leverage the connectionName
 *
 */
export default class ASTConnectionBuilder extends ASTBuilder {
  public hasForeignKeyError: boolean = false

  constructor(protected connectionName: string) {
    super()
  }

  /**
   * @internal
   *
   * returns the path from project root to the dream.ts file
   * for the particular connection. If the connectionName is anything
   * other than default, the path will represent that by injecting
   * the connectionName into the file name, i.e. dream.alternate.ts
   */
  protected schemaPath() {
    const dreamApp = DreamApp.getOrFail()
    return path.join(
      dreamApp.projectRoot,
      dreamApp.paths.types,
      dreamSchemaTypesFilenameForConnection(this.connectionName)
    )
  }

  /**
   * @internal
   *
   * returns the path from project root to the db.ts file
   * for the particular connection. If the connectionName is anything
   * other than default, the path will represent that by injecting
   * the connectionName into the file name, i.e. db.alternate.ts
   */
  protected dbPath() {
    const dreamApp = DreamApp.getOrFail()
    return path.join(
      dreamApp.projectRoot,
      dreamApp.paths.types,
      dbTypesFilenameForConnection(this.connectionName)
    )
  }

  /**
   * @internal
   *
   * returns the db source file for the given connectionName, injecting
   * the source file with the actual file contents, so that AST nodes
   * can be built through ingesting.
   */
  protected async getDbSourceFile(): Promise<ts.SourceFile> {
    const fileContent = await this.loadDbSyncFile()
    return ts.createSourceFile('./db.js', fileContent, ts.ScriptTarget.Latest, true)
  }

  /**
   * @internal
   *
   * reads the db source file for the given connection, returning the contents
   * as a raw string
   */
  protected async loadDbSyncFile() {
    return (await fs.readFile(this.dbPath())).toString()
  }

  /**
   * @internal
   *
   * builds up the schema data for every table into an object, which
   * can be read and injected into AST nodes.
   */
  protected async getSchemaData() {
    const tables = await this.getTables()

    const schemaData: SchemaData = {}
    for (const table of tables) {
      schemaData[table] = await this.tableData(table)
    }

    return schemaData
  }

  /**
   * @internal
   *
   * used by getSchemaData to build up all table data
   */
  private async getTables() {
    const fileContents = await this.loadDbSyncFile()
    const tableLines = /export interface DB {([^}]*)}/.exec(fileContents)![1]
    if (tableLines === undefined) return []

    const tables = tableLines
      .split('\n')
      .map(line => {
        const stingArray = line.split(':')
        const substring = stingArray[0]
        if (substring === undefined) return ''
        return substring.replace(/\s*/, '')
      })
      .filter(line => !!line)
    return tables
  }

  /**
   * @internal
   *
   * finds all enums used by the app, and returns information
   * about those enums that can be used for type generating purpposes
   */
  protected async getAllEnumValueNames(): Promise<
    {
      enumValues: string
      enumType: string
    }[]
  > {
    const schemaData = await this.getSchemaData()
    const enumValueNames = Object.values(schemaData)
      .map(tableData =>
        Object.keys(tableData.columns)
          .filter(columnName => !!tableData.columns[columnName]?.enumValues)
          .map(columnName => ({
            enumValues: tableData.columns[columnName]!.enumValues as string,
            enumType: tableData.columns[columnName]!.enumType as string,
          }))
      )
      .flat()

    return enumValueNames
  }

  /**
   * @internal
   *
   * returns a tuple, where the first value is the global name, and the second value
   * is the table that that global name points to. Used to build up our global
   * model name exports within type files.
   */
  protected globalModelNames(): [string, string][] {
    const dreamApp = DreamApp.getOrFail()
    const models = dreamApp.models

    return Object.keys(models)
      .filter(key => models[key]?.prototype?.connectionName === this.connectionName)
      .map(key => [key, models[key]!.prototype.table])
  }

  /**
   * @internal
   *
   * retrieves useful association data for a given association and table, which
   * can be used to build up types
   */
  private getAssociationData(tableName: string, targetAssociationType?: string) {
    const dreamApp = DreamApp.getOrFail()
    const models = sortBy(Object.values(dreamApp.models), m => m.table)
    const tableAssociationData: { [key: string]: SchemaBuilderAssociationData } = {}

    for (const model of models.filter(model => model.table === tableName)) {
      for (const associationName of model.associationNames) {
        const associationMetaData = model['associationMetadataMap']()[associationName]
        if (associationMetaData === undefined) continue
        if (targetAssociationType && associationMetaData.type !== targetAssociationType) continue

        const dreamClassOrClasses = associationMetaData.modelCB()
        if (!dreamClassOrClasses)
          throw new FailedToIdentifyAssociation(
            model,
            associationMetaData.type,
            associationName,
            associationMetaData.globalAssociationNameOrNames
          )

        const optional =
          associationMetaData.type === 'BelongsTo' ? associationMetaData.optional === true : null

        const where =
          associationMetaData.type === 'HasMany' || associationMetaData.type === 'HasOne'
            ? associationMetaData.and || null
            : null

        // NOTE
        // this try-catch is here because the ASTSchemaBuilder currently needs to be run twice to generate foreignKey
        // correctly. The first time will raise, since calling Dream.columns is dependant on the schema const to
        // introspect columns during a foreign key check. This will be repaired once kysely types have been successfully
        // split off into a separate file from the types we diliver in types/dream.ts
        let foreignKey: string | null = null
        try {
          const isThroughAssociation = (associationMetaData as HasManyStatement<any, any, any, any>).through

          if (!isThroughAssociation) {
            const _foreignKey = associationMetaData.foreignKey()
            foreignKey = _foreignKey
          }
        } catch (err) {
          this.hasForeignKeyError = true
        }

        try {
          tableAssociationData[associationName] ||= {
            tables: [],
            type: associationMetaData.type,
            polymorphic: associationMetaData.polymorphic,
            foreignKey,
            foreignKeyTypeColumn: associationMetaData.polymorphic
              ? associationMetaData?.foreignKeyTypeField?.() || null
              : null,
            optional,
            and: where,
          }

          if (foreignKey) tableAssociationData[associationName]['foreignKey'] = foreignKey

          if (Array.isArray(dreamClassOrClasses)) {
            const tables: string[] = dreamClassOrClasses.map(dreamClass => dreamClass.table)

            tableAssociationData[associationName].tables = [
              ...tableAssociationData[associationName].tables,
              ...tables,
            ]
          } else {
            tableAssociationData[associationName].tables.push(dreamClassOrClasses.table)
          }

          // guarantee unique
          tableAssociationData[associationName].tables = [
            ...new Set(tableAssociationData[associationName].tables),
          ]
        } catch (error) {
          if (!(error instanceof ExplicitForeignKeyRequired || error instanceof InvalidComputedForeignKey))
            throw error
        }
      }
    }

    return Object.keys(tableAssociationData)
      .sort()
      .reduce(
        (acc, key) => {
          if (tableAssociationData[key] === undefined) return acc
          acc[key] = tableAssociationData[key]
          return acc
        },
        {} as { [key: string]: SchemaBuilderAssociationData }
      )
  }

  /**
   * @internal
   *
   * retrieves the table data for an individual table.
   * Can be used to build up types
   */
  private async tableData(tableName: string) {
    const dreamApp = DreamApp.getOrFail()
    const models = Object.values(dreamApp.models).filter(model => model.table === tableName)
    const maybeModel = models[0]

    if (!maybeModel)
      throw new Error(`
Could not find a Dream model with table "${tableName}".

If you recently changed the name of a table in a migration, you
may need to update the table getter in the corresponding Dream.
`)

    const baseModel = maybeModel['stiBaseClassOrOwnClass']

    const associationData = this.getAssociationData(tableName)
    const allStiChildren = models.filter(model => model['isSTIChild'])
    const modelsToCheck = allStiChildren.length ? allStiChildren : [baseModel]

    // If a table is STI, then we look only at the serializers attached to
    // all STI children (not the STI base model because the base model may not have any serializers)
    const eachModelSerializerKeys = modelsToCheck.map(model => {
      let serializers: Record<string, string> = {}

      try {
        serializers = (model as any)?.prototype?.['serializers'] || {}
      } catch {
        // no-op
      }

      return Object.keys(serializers)
    })

    const serializerKeys = intersection(...eachModelSerializerKeys).sort()

    return {
      scopes: {
        default: uniq(
          models.flatMap(model => model['scopes'].default.map(scopeStatement => scopeStatement.method))
        ),
        named: uniq(
          models.flatMap(model => model['scopes'].named.map(scopeStatement => scopeStatement.method))
        ),
      },
      columns: await this.getColumnData(tableName, associationData),
      virtualColumns: uniq(
        models.flatMap(model => model['virtualAttributes'].map(prop => prop.property) || [])
      ),
      associations: associationData,
      serializerKeys,
    }
  }

  /**
   * @internal
   *
   * retrieves the column data for an individual table and association.
   * Can be used to build up types
   */
  private async getColumnData(
    tableName: string,
    allTableAssociationData: { [key: string]: SchemaBuilderAssociationData }
  ) {
    const dbDriverClass = Query.dbDriverClass<Dream>(this.connectionName)
    return await dbDriverClass.getColumnData(this.connectionName, tableName, allTableAssociationData)
  }
}
