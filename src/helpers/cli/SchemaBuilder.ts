import { sql } from 'kysely'
import { schemaPath } from '../path'
import _db from '../../db'
import { promises as fs } from 'fs'
import loadDreamconfFile from '../path/loadDreamconfFile'
import sortBy from 'lodash.sortby'
import loadModels from '../loadModels'
import camelize from '../camelize'
import pascalize from '../pascalize'
import { isPrimitiveDataType } from '../../db/dataTypes'
import dbSyncPath from '../path/dbSyncPath'

export default class SchemaBuilder {
  public async build() {
    const schemaConstContent = await this.buildSchemaContent()
    const schemaFileContents = await this.loadSchemaFile()
    const imports = await this.getSchemaImports(schemaFileContents)

    const importStr = imports.length
      ? `\
import {
  ${imports.join(',\n  ')}
} from './sync'`
      : ''

    const newSchemaFileContents = `\
import { DateTime } from 'luxon'
${importStr}

${schemaConstContent}
`
    // const newSchemaFileContents = `\
    // ${schemaConstContent}
    // `
    await fs.writeFile(await schemaPath(), newSchemaFileContents)
  }

  private async buildSchemaContent() {
    const schemaData = await this.getSchemaData()
    const fileContents = await this.loadDbTypesFile()

    return `\
export const schema = {
  ${Object.keys(schemaData)
    .map(tableName => {
      const tableData = schemaData[tableName as keyof typeof schemaData]

      return `\
${tableName}: {
    columns: {
      ${Object.keys(schemaData[tableName as keyof typeof schemaData].columns)
        .map(columnName => {
          const columnData = tableData.columns[columnName as keyof typeof tableData.columns]
          const kyselyType = this.kyselyType(tableName, columnName, fileContents)
          return `${columnName}: {
        coercedType: {} as ${this.coercedType(kyselyType)},
        enumType: ${columnData.enumType ? `{} as ${columnData.enumType}` : 'null'},
        enumValues: ${columnData.enumValues ?? 'null'},
        dbType: '${columnData.dbType}',
        allowNull: ${columnData.allowNull},
        isArray: ${columnData.isArray},
      },`
        })
        .join('\n      ')}
    },
    virtualColumns: [${schemaData[tableName as keyof typeof schemaData].virtualColumns?.map((attr: string) => `'${attr}'`)?.join(', ') || ''}],
    associations: {
      ${Object.keys(schemaData[tableName as keyof typeof schemaData].associations)
        .map(associationName => {
          const associationMetadata = tableData.associations[associationName as keyof typeof tableData]
          return `${associationName}: {
        type: '${associationMetadata.type}',
        foreignKey: ${associationMetadata.foreignKey ? `'${associationMetadata.foreignKey}'` : 'null'},
        tables: [${associationMetadata.tables.map((table: string) => `'${table}'`).join(', ')}],
        optional: ${associationMetadata.optional},
      },`
        })
        .join('\n      ')}
    },
  },\
`
    })
    .join('\n  ')}
} as const`
  }

  private async getSchemaImports(schemaContent: string) {
    const allExports = await this.getExportedModulesFromDbSync()

    const schemaContentWithoutImports = schemaContent.replace(/import {[^}]*}/gm, '')
    return allExports.filter(exportedModule => {
      if (new RegExp(`coercedType: {} as ${exportedModule}`).test(schemaContentWithoutImports)) return true
      if (new RegExp(`enumType: {} as ${exportedModule}`).test(schemaContentWithoutImports)) return true
      if (new RegExp(`enumValues: ${exportedModule}`).test(schemaContentWithoutImports)) return true
      return false
    })
  }

  private async tableData(tableName: string) {
    const associationData = await this.getAssociationData(tableName)
    return {
      columns: await this.getColumnData(tableName, associationData),
      virtualColumns: await this.getVirtualColumns(tableName),
      associations: associationData,
    }
  }

  private async getColumnData(tableName: string, associationData: { [key: string]: AssociationData }) {
    const dreamconf = await loadDreamconfFile()
    const db = _db('primary', dreamconf)
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

    return columnData
  }

  private enumType(row: InformationSchemaRow) {
    const enumName = pascalize(row.udtName.replace(/\[\]$/, ''))
    return enumName
  }

  private async getVirtualColumns(tableName: string) {
    const models = sortBy(Object.values(await loadModels()), m => m.table)
    const model = models.find(model => model.table === tableName)
    if (!model) throw new Error(`Failed to find a model matching the table name: ${tableName}`)
    return model['virtualAttributes']?.map(prop => prop.property) || []
  }

  private async getSchemaData() {
    const tables = await this.getTables()

    const schemaData: SchemaData = {}
    for (const table of tables) {
      schemaData[table] = await this.tableData(table)
    }

    return schemaData
  }

  private async getAssociationData(tableName: string, targetAssociationType?: string) {
    const models = sortBy(Object.values(await loadModels()), m => m.table)
    const tableAssociationData: { [key: string]: AssociationData } = {}

    for (const model of models.filter(model => model.table === tableName)) {
      for (const associationName of model.associationNames) {
        const associationMetaData = model.associationMap()[associationName]
        if (targetAssociationType && associationMetaData.type !== targetAssociationType) continue

        const dreamClassOrClasses = associationMetaData.modelCB()
        const optional =
          associationMetaData.type === 'BelongsTo' ? (associationMetaData as any).optional === true : null

        // NOTE
        // this try-catch is here because the SchemaBuilder currently needs to be run twice to generate foreignKey
        // correctly. The first time will raise, since calling Dream.columns is dependant on the schema const to
        // introspect columns during a foreign key check. This will be repaired once kysely types have been successfully
        // split off into a separate file from the types we diliver in schema.ts
        let foreignKey: string | null = null
        try {
          const _foreignKey = associationMetaData.foreignKey()
          foreignKey = _foreignKey
        } catch (_) {
          // noop
        }

        tableAssociationData[associationName] ||= {
          tables: [],
          type: associationMetaData.type,
          polymorphic: associationMetaData.polymorphic,
          foreignKey,
          optional,
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

    return tableAssociationData
  }

  private async getExportedModulesFromDbSync() {
    const fileContents: string = await this.loadDbTypesFile()
    const exportedConsts = [...fileContents.matchAll(/export\s+const\s+([a-zA-Z0-9_]+)/g)].map(res => res[1])
    const exportedTypes = [...fileContents.matchAll(/export\s+type\s+([a-zA-Z0-9_]+)/g)].map(res => res[1])
    const exportedInterfaces = [...fileContents.matchAll(/export\s+interface\s+([a-zA-Z0-9_]+)/g)].map(
      res => res[1]
    )

    const allExports: string[] = [...exportedConsts, ...exportedTypes, ...exportedInterfaces]
    return allExports
  }

  private async getTables() {
    const fileContents = await this.loadDbTypesFile()
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

  private coercedType(kyselyType: string) {
    return kyselyType
      .replace(/\s/g, '')
      .replace(/Generated<(.*)>/, '$1')
      .split('|')
      .map(individualType => {
        const withoutGenerated = individualType.replace(/Generated<(.*)>/, '$1')
        switch (withoutGenerated) {
          case 'Numeric':
            return 'number'

          case 'Timestamp':
            return 'DateTime'

          case 'Int8':
            return 'IdType'

          default:
            return withoutGenerated
        }
      })
      .join(' | ')
  }

  private async loadDbTypesFile() {
    return (await fs.readFile(await dbSyncPath())).toString()
  }

  private async loadSchemaFile() {
    return (await fs.readFile(await schemaPath())).toString()
  }
}

interface SchemaData {
  [key: string]: TableData
}

interface TableData {
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
