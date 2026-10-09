import * as path from 'node:path'
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
import { IntrospectedDatabase, IntrospectedTable } from '../../types/db.js'
import camelize from '../camelize.js'
import intersection from '../intersection.js'
import sortBy from '../sortBy.js'
import uniq from '../uniq.js'
import ASTBuilder, {
  SchemaBuilderAssociationData,
  SchemaBuilderColumnData,
  SchemaData,
} from './ASTBuilder.js'
import { dbTypesName, dbTypesReservedNames } from './dbTypesNaming.js'
import resolveIgnoredColumns from './resolveIgnoredColumns.js'
import tableMatchesPattern from './tableMatchesPattern.js'

/**
 * @internal
 *
 * This is a base class, which is inherited by the ASTSchemaBuilder and
 * the ASTDbTypesBuilder, each of which builds one of the type files a
 * connection's sync writes, from the same introspection of the connection.
 *
 * This base class is just a container for common methods used by both
 * classes. It requires a connectionName to be provided, unlike the underlying
 * ASTBuilder class, and provides methods which leverage the connectionName
 *
 */
export default class ASTConnectionBuilder extends ASTBuilder {
  public hasForeignKeyError: boolean = false

  private introspection: Promise<IntrospectedDatabase> | undefined

  constructor(protected connectionName: string) {
    super()
  }

  /**
   * @internal
   *
   * the connection's tables, sorted by their key in the DB interface, and its
   * enums, read through the query driver once per builder. The tables that
   * `tableIncludePattern` leaves out, or `tableExcludePattern` names, are left
   * out.
   */
  protected async introspectedDatabase(): Promise<IntrospectedDatabase> {
    this.introspection ||= (async () => {
      const dbDriverClass = Query.dbDriverClass<Dream>(this.connectionName)
      const database = await dbDriverClass.introspectDatabase(this.connectionName)
      const credentials = DreamApp.getOrFail().dbCredentialsFor(this.connectionName)
      const includePattern = credentials?.tableIncludePattern
      const excludePattern = credentials?.tableExcludePattern

      return {
        ...database,
        tables: database.tables
          .filter(
            table =>
              (!includePattern || tableMatchesPattern(table, includePattern)) &&
              !(excludePattern && tableMatchesPattern(table, excludePattern))
          )
          .sort((a, b) => this.tableKey(a).localeCompare(this.tableKey(b))),
      }
    })()

    return await this.introspection
  }

  /**
   * @internal
   *
   * the table's key in the DB interface and in Dream's schema: its name, or
   * `<schema>.<name>` outside the connection's default schema
   */
  protected tableKey(table: IntrospectedTable) {
    return table.inDefaultSchema ? table.name : `${table.schema}.${table.name}`
  }

  /**
   * @internal
   *
   * the TypeScript name of each enum the connection's tables use, keyed by
   * the enum's database name (see dbTypesName), with a number added when it
   * would repeat an earlier enum's name or a name types/db.ts reserves
   */
  protected async enumTypeNames(): Promise<Map<string, string>> {
    const database = await this.introspectedDatabase()
    const usedEnumNames = new Set(
      database.tables.flatMap(table => table.columns.map(column => column.enumName).filter(name => !!name))
    )
    const takenNames = new Set(dbTypesReservedNames(database.tables))
    const typeNames = new Map<string, string>()

    for (const enumName of [...usedEnumNames].sort()) {
      typeNames.set(enumName!, dbTypesName(enumName!, takenNames))
    }

    return typeNames
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
   * builds up the schema data for every table into an object, which
   * can be read and injected into AST nodes.
   */
  protected async getSchemaData() {
    const database = await this.introspectedDatabase()
    const enumTypeNames = await this.enumTypeNames()

    const schemaData: SchemaData = {}
    for (const table of database.tables) {
      schemaData[this.tableKey(table)] = this.tableData(table, enumTypeNames)
    }

    return schemaData
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
        } catch {
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
  private tableData(table: IntrospectedTable, enumTypeNames: Map<string, string>) {
    const tableName = this.tableKey(table)
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
      columns: this.withoutIgnoredColumns(this.columnData(table, associationData, enumTypeNames), tableName),
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
   * resolves the ignored columns declared by the models backed by the
   * given table (validating the declarations; see resolveIgnoredColumns)
   */
  protected ignoredColumnsForTable(tableName: string): Set<string> {
    const dreamApp = DreamApp.getOrFail()
    const allModels = Object.values(dreamApp.models).filter(
      model => model.prototype?.connectionName === this.connectionName
    )
    const models = allModels.filter(model => model.table === tableName)

    return resolveIgnoredColumns(models, tableName, allModels)
  }

  /**
   * @internal
   *
   * returns the provided column data without the columns that the table's
   * models declare in ignoredColumns. This is what removes ignored columns
   * from the generated dream schema file: `columns()` reads the generated
   * schema at runtime, so every column enumeration built from `columns()`
   * (preload and join-load select lists, save hydration, attribute
   * definition) inherits this filtering. A column that is ignored but not
   * present in the introspected table (e.g. after the drop migration has
   * run but before the declaration is removed) is a no-op.
   */
  private withoutIgnoredColumns<T extends Record<string, unknown>>(columnData: T, tableName: string): T {
    const ignoredColumns = this.ignoredColumnsForTable(tableName)
    if (!ignoredColumns.size) return columnData

    return Object.keys(columnData)
      .filter(columnName => !ignoredColumns.has(columnName))
      .reduce((filtered, columnName) => {
        ;(filtered as Record<string, unknown>)[columnName] = columnData[columnName]
        return filtered
      }, {} as T)
  }

  /**
   * @internal
   *
   * the columns of an introspected table, as Dream's schema records them,
   * keyed by camelized column name
   */
  private columnData(
    table: IntrospectedTable,
    allTableAssociationData: { [key: string]: SchemaBuilderAssociationData },
    enumTypeNames: Map<string, string>
  ) {
    const columnData: { [key: string]: SchemaBuilderColumnData } = {}

    for (const column of table.columns) {
      const enumType = column.enumName ? enumTypeNames.get(column.enumName)! : null
      columnData[camelize(column.name)] = {
        dbType: column.dbType,
        valueType: column.valueType,
        allowNull: column.allowNull,
        enumType,
        enumValues: enumType ? `${enumType}Values` : null,
        isArray: column.isArray,
        foreignKey: allTableAssociationData[column.name]?.foreignKey || null,
      }
    }

    return Object.keys(columnData)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = columnData[key]!
          return acc
        },
        {} as { [key: string]: SchemaBuilderColumnData }
      )
  }
}
