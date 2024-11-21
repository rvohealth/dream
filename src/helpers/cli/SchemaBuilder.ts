import fs from 'fs/promises'
import { sql } from 'kysely'
import sortBy from 'lodash.sortby'
import path from 'path'
import _db from '../../db'
import { isPrimitiveDataType } from '../../db/dataTypes'
import DreamApplication from '../../dream-application'
import { DreamConst, SerializableDreamClassOrViewModelClass } from '../../dream/types'
import FailedToIdentifyAssociation from '../../exceptions/schema-builder/FailedToIdentifyAssociation'
import camelize from '../camelize'
import { envBool } from '../envHelpers'
import pascalize from '../pascalize'
import uniq from '../uniq'

export default class SchemaBuilder {
  public async build() {
    const { schemaConstContent, passthroughColumns, allDefaultScopeNames } = await this.buildSchemaContent()
    const imports = await this.getSchemaImports(schemaConstContent)

    const importStr = imports.length
      ? `\
import {
  ${imports.sort().join(',\n  ')}
} from './sync'`
      : ''

    const calendarDateImportStatement = envBool('DREAM_CORE_DEVELOPMENT')
      ? "import CalendarDate from '../../src/helpers/CalendarDate'"
      : "import { CalendarDate } from '@rvohealth/dream'"

    const dreamApp = DreamApplication.getOrFail()

    const newSchemaFileContents = `\
${calendarDateImportStatement}
import { DateTime } from 'luxon'
${importStr}

${schemaConstContent}

export const globalSchema = {
  passthroughColumns: ${stringifyArray(uniq(passthroughColumns.sort()), { indent: 4 })},
  allDefaultScopeNames: ${stringifyArray(uniq(allDefaultScopeNames.sort()), { indent: 4 })},
  globalNames: {
    models: ${this.globalModelNames()},
    serializers: ${stringifyArray(Object.keys(dreamApp.serializers || {}).sort(), { indent: 6 })},
  },
} as const
`
    // const newSchemaFileContents = `\
    // ${schemaConstContent}
    // `
    const schemaPath = path.join(dreamApp.projectRoot, dreamApp.paths.db, 'schema.ts')
    await fs.writeFile(schemaPath, newSchemaFileContents)
  }

  private globalModelNames() {
    const dreamApp = DreamApplication.getOrFail()
    return `{
      ${Object.keys(dreamApp.models)
        .map(key => `'${key}': '${dreamApp.models[key].prototype.table}'`)
        .join(',\n      ')}
    }`
  }

  private async buildSchemaContent() {
    let passthroughColumns: string[] = []
    let allDefaultScopeNames: string[] = []

    const schemaData = await this.getSchemaData()
    const fileContents = await this.loadDbSyncFile()

    const schemaConstContent = `\
export const schema = {
  ${Object.keys(schemaData)
    .map(tableName => {
      const tableData = schemaData[tableName as keyof typeof schemaData]
      const defaultScopeNames = tableData.scopes.default
      const namedScopeNames = tableData.scopes.named
      allDefaultScopeNames = [...allDefaultScopeNames, ...defaultScopeNames]

      return `\
${tableName}: {
    primaryKey: '${tableData.primaryKey}',
    createdAtField: '${tableData.createdAtField}',
    updatedAtField: '${tableData.updatedAtField}',
    deletedAtField: '${tableData.deletedAtField}',
    serializerKeys: ${stringifyArray(tableData.serializerKeys)},
    scopes: {
      default: ${stringifyArray(defaultScopeNames)},
      named: ${stringifyArray(namedScopeNames)},
    },
    columns: {
      ${Object.keys(schemaData[tableName as keyof typeof schemaData].columns)
        .sort()
        .map(columnName => {
          const columnData = tableData.columns[columnName as keyof typeof tableData.columns]
          const kyselyType = this.kyselyType(tableName, columnName, fileContents)
          return `${columnName}: {
        coercedType: {} as ${this.coercedType(kyselyType, columnData.dbType)},
        enumType: ${columnData.enumType ? `{} as ${columnData.enumType}` : 'null'},
        enumValues: ${columnData.enumValues ?? 'null'},
        dbType: '${columnData.dbType}',
        allowNull: ${columnData.allowNull},
        isArray: ${columnData.isArray},
      },`
        })
        .join('\n      ')}
    },
    virtualColumns: ${stringifyArray(schemaData[tableName as keyof typeof schemaData].virtualColumns)},
    associations: {
      ${Object.keys(schemaData[tableName as keyof typeof schemaData].associations)
        .sort()
        .map(associationName => {
          const associationMetadata = tableData.associations[associationName as keyof typeof tableData]
          const whereStatement = associationMetadata.where
          const requiredWhereClauses =
            whereStatement === null
              ? []
              : Object.keys(whereStatement).filter(column => whereStatement[column] === DreamConst.required)
          passthroughColumns =
            whereStatement === null
              ? passthroughColumns
              : [
                  ...passthroughColumns,
                  ...Object.keys(whereStatement).filter(
                    column => whereStatement[column] === DreamConst.passthrough
                  ),
                ]
          return `${associationName}: {
        type: '${associationMetadata.type}',
        foreignKey: ${associationMetadata.foreignKey ? `'${associationMetadata.foreignKey}'` : 'null'},
        tables: ${stringifyArray(associationMetadata.tables)},
        optional: ${associationMetadata.optional},
        requiredWhereClauses: ${requiredWhereClauses.length === 0 ? 'null' : stringifyArray(requiredWhereClauses)},
      },`
        })
        .join('\n      ')}
    },
  },\
`
    })
    .join('\n  ')}
} as const`

    return { schemaConstContent, passthroughColumns, allDefaultScopeNames }
  }

  private async getSchemaImports(schemaContent: string) {
    const allExports = await this.getExportedModulesFromDbSync()

    const schemaContentWithoutImports = schemaContent.replace(/import {[^}]*}/gm, '')
    return allExports.filter(exportedModule => {
      if (new RegExp(`coercedType: {} as ${exportedModule}`).test(schemaContentWithoutImports)) return true
      if (new RegExp(`coercedType: {} as ArrayType<${exportedModule}`).test(schemaContentWithoutImports))
        return true
      if (new RegExp(`enumType: {} as ${exportedModule}`).test(schemaContentWithoutImports)) return true
      if (new RegExp(`enumValues: ${exportedModule}`).test(schemaContentWithoutImports)) return true

      return false
    })
  }

  private async tableData(tableName: string) {
    const dreamApp = DreamApplication.getOrFail()
    const models = Object.values(dreamApp.models)
    const model = models.find(model => model.table === tableName)

    if (!model)
      throw new Error(`
Could not find a Dream model with table "${tableName}".

If you recently changed the name of a table in a migration, you
may need to update the table getter in the corresponding Dream.
`)

    const associationData = this.getAssociationData(tableName)
    let serializers: any
    try {
      serializers =
        (model as unknown as SerializableDreamClassOrViewModelClass)?.prototype?.['serializers'] || {}
    } catch {
      serializers = {}
    }

    return {
      primaryKey: model.prototype.primaryKey,
      createdAtField: model.prototype.createdAtField,
      updatedAtField: model.prototype.updatedAtField,
      deletedAtField: model.prototype.deletedAtField,
      scopes: {
        default: model['scopes'].default.map(scopeStatement => scopeStatement.method),
        named: model['scopes'].named.map(scopeStatement => scopeStatement.method),
      },
      columns: await this.getColumnData(tableName, associationData),
      virtualColumns: this.getVirtualColumns(tableName),
      associations: associationData,
      serializerKeys: Object.keys(serializers),
    }
  }

  private async getColumnData(tableName: string, associationData: { [key: string]: AssociationData }) {
    const db = _db('primary')
    const sqlQuery = sql`SELECT column_name, udt_name::regtype, is_nullable, data_type FROM information_schema.columns WHERE table_name = ${tableName}`
    const columnToDBTypeMap = await sqlQuery.execute(db)
    const rows = columnToDBTypeMap.rows as InformationSchemaRow[]

    const columnData: {
      [key: string]: ColumnData
    } = {}
    rows.forEach(row => {
      const isEnum = ['USER-DEFINED', 'ARRAY'].includes(row.dataType) && !isPrimitiveDataType(row.udtName)
      const isArray = ['ARRAY'].includes(row.dataType)
      const associationMetadata = associationData[row.columnName]

      columnData[camelize(row.columnName)] = {
        dbType: row.udtName,
        allowNull: row.isNullable === 'YES',
        enumType: isEnum ? this.enumType(row) : null,
        enumValues: isEnum ? `${this.enumType(row)}Values` : null,
        isArray,
        foreignKey: associationMetadata?.foreignKey || null,
      }
    })

    return Object.keys(columnData)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = columnData[key]
          return acc
        },
        {} as { [key: string]: ColumnData }
      )
  }

  private enumType(row: InformationSchemaRow) {
    const enumName = pascalize(row.udtName.replace(/\[\]$/, ''))
    return enumName
  }

  private getVirtualColumns(tableName: string) {
    const dreamApp = DreamApplication.getOrFail()
    const models = sortBy(Object.values(dreamApp.models), m => m.table)
    const model = models.find(model => model.table === tableName)
    return model?.['virtualAttributes']?.map(prop => prop.property) || []
  }

  private async getSchemaData() {
    const tables = await this.getTables()

    const schemaData: SchemaData = {}
    for (const table of tables) {
      schemaData[table] = await this.tableData(table)
    }

    return schemaData
  }

  private getAssociationData(tableName: string, targetAssociationType?: string) {
    const dreamApp = DreamApplication.getOrFail()
    const models = sortBy(Object.values(dreamApp.models), m => m.table)
    const tableAssociationData: { [key: string]: AssociationData } = {}

    for (const model of models.filter(model => model.table === tableName)) {
      for (const associationName of model.associationNames) {
        const associationMetaData = model['associationMetadataMap']()[associationName]
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
            ? associationMetaData.where || null
            : null

        // NOTE
        // this try-catch is here because the SchemaBuilder currently needs to be run twice to generate foreignKey
        // correctly. The first time will raise, since calling Dream.columns is dependant on the schema const to
        // introspect columns during a foreign key check. This will be repaired once kysely types have been successfully
        // split off into a separate file from the types we diliver in schema.ts
        let foreignKey: string | null = null
        try {
          const _foreignKey = associationMetaData.foreignKey()
          foreignKey = _foreignKey
        } catch {
          // noop
        }

        tableAssociationData[associationName] ||= {
          tables: [],
          type: associationMetaData.type,
          polymorphic: associationMetaData.polymorphic,
          foreignKey,
          optional,
          where,
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
      }
    }

    return Object.keys(tableAssociationData)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = tableAssociationData[key]
          return acc
        },
        {} as { [key: string]: AssociationData }
      )
  }

  private async getExportedModulesFromDbSync() {
    const fileContents: string = await this.loadDbSyncFile()
    const exportedConsts = [...fileContents.matchAll(/export\s+const\s+([a-zA-Z0-9_]+)/g)].map(res => res[1])
    const exportedTypes = [...fileContents.matchAll(/export\s+type\s+([a-zA-Z0-9_]+)/g)].map(res => res[1])
    const exportedInterfaces = [...fileContents.matchAll(/export\s+interface\s+([a-zA-Z0-9_]+)/g)].map(
      res => res[1]
    )

    const allExports: string[] = [...exportedConsts, ...exportedTypes, ...exportedInterfaces]
    return allExports
  }

  private async getTables() {
    const fileContents = await this.loadDbSyncFile()
    const tableLines = /export interface DB {([^}]*)}/.exec(fileContents)![1]
    const tables = tableLines
      .split('\n')
      .map(line => line.split(':')[0].replace(/\s*/, ''))
      .filter(line => !!line)
    return tables
  }

  private kyselyType(tableName: string, columnName: string, fileContents: string) {
    const tableLines = /export interface DB {([^}]*)}/.exec(fileContents)![1]
    const interfaceName = tableLines
      .split('\n')
      .filter(line => !!line)
      .filter(line => new RegExp(`^  ${tableName}:`).test(line))[0]
      .split(':')[1]
      ?.replace(/[\s;]*/g, '')

    const interfaceLines = new RegExp(`export interface ${interfaceName} {([^}]*)}`).exec(fileContents)![1]
    const kyselyType = interfaceLines
      .split('\n')
      .filter(line => !!line)
      .filter(line => new RegExp(`  ${columnName}:`).test(line))[0]
      .split(':')[1]
      ?.replace(/[\s;]*/g, '')

    return kyselyType
  }

  private coercedType(kyselyType: string, dbType: string) {
    const postfix = /\[\]$/.test(dbType) ? '[]' : ''

    return kyselyType
      .replace(/\s/g, '')
      .replace(/Generated<(.*)>/g, '$1')
      .replace(/ArrayType<(.*)>/g, '$1[]')
      .split('|')
      .map(individualType => {
        switch (individualType) {
          case 'Numeric':
          case 'Numeric[]':
            return `number${postfix}`

          case 'Timestamp':
          case 'Timestamp[]':
            return /^date[[\]]*$/.test(dbType) ? `CalendarDate${postfix}` : `DateTime${postfix}`

          case 'Int8':
          case 'Int8[]':
            return `IdType${postfix}`

          default:
            return individualType
        }
      })
      .join(' | ')
  }

  private async loadDbSyncFile() {
    const dreamApp = DreamApplication.getOrFail()
    const dbSyncPath = path.join(dreamApp.projectRoot, dreamApp.paths.db, 'sync.ts')
    return (await fs.readFile(dbSyncPath)).toString()
  }
}

function stringifyArray(arr: string[] = [], { indent }: { indent?: number } = {}): string {
  if (indent && arr.length > 3) {
    let spaces = ''
    for (let i = 0; i < indent; i++) {
      spaces = `${spaces} `
    }

    return `[
${spaces}${arr
      .sort()
      .map(val => `'${val}'`)
      .join(`,\n${spaces}`)}
${spaces.replace(/\s{2}$/, '')}]`
  } else {
    return `[${arr
      .sort()
      .map(val => `'${val}'`)
      .join(', ')}]`
  }
}

interface SchemaData {
  [key: string]: TableData
}

interface TableData {
  primaryKey: string
  createdAtField: string
  updatedAtField: string
  deletedAtField: string
  serializerKeys: string[]
  scopes: {
    default: string[]
    named: string[]
  }
  columns: { [key: string]: ColumnData }
  virtualColumns: string[]
  associations: { [key: string]: AssociationData }
}

interface AssociationData {
  tables: string[]
  type: 'BelongsTo' | 'HasOne' | 'HasMany'
  polymorphic: boolean
  optional: boolean | null
  foreignKey: string | null
  where: Record<string, string | typeof DreamConst.passthrough | typeof DreamConst.required> | null
}

interface ColumnData {
  dbType: string
  allowNull: boolean
  enumType: string | null
  enumValues: string | null
  isArray: boolean
  foreignKey: string | null
}

interface InformationSchemaRow {
  columnName: string
  udtName: string
  dataType: string
  isNullable: 'YES' | 'NO'
}
