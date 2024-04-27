import { sql } from 'kysely'
import { schemaPath } from '../path'
import _db from '../../db'
import { promises as fs } from 'fs'
import loadDreamconfFile from '../path/loadDreamconfFile'
import sortBy from 'lodash.sortby'
import loadModels from '../loadModels'
import camelize from '../camelize'

export default class SchemaBuilder {
  public async build() {
    const schemaConstContent = await this.buildSchemaContent()
    const schemaFileContents = await this.loadSchemaFile()

    const newSchemaFileContents = `\
${schemaFileContents
  .replace(/export const schema = {(.*)\n} as const/ms, '')
  .replace(/export interface SchemaType {(.*)\n}/ms, '')
  .replace(/\n(\n*)$/, '\n')}
${schemaConstContent}
`
    await fs.writeFile(await schemaPath(), newSchemaFileContents)
  }

  private async buildSchemaContent() {
    const schemaData = await this.getSchemaData()
    const fileContents = await this.loadSchemaFile()

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
        dbType: '${columnData.dbType}',
        allowNull: ${columnData.allowNull},
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

  private async getSchemaData() {
    const tables = await this.getTables()

    const schemaData: any = {}
    for (const table of tables) {
      schemaData[table] = await this.tableData(table)
    }

    return schemaData
  }

  private async tableData(tableName: string) {
    return {
      columns: await this.getColumnData(tableName),
      virtualColumns: await this.getVirtualColumns(tableName),
      associations: await this.getAssociationData(tableName),
    }
  }

  private async getColumnData(tableName: string) {
    const dreamconf = await loadDreamconfFile()
    const db = _db('primary', dreamconf)
    const sqlQuery = sql`SELECT column_name, udt_name::regtype, is_nullable FROM information_schema.columns WHERE table_name = ${tableName}`
    const columnToDBTypeMap = await sqlQuery.execute(db)
    const rows = columnToDBTypeMap.rows as InformationSchemaRow[]

    const columnData: any = {}
    rows.forEach(row => {
      columnData[camelize(row.columnName)] = {
        dbType: row.udtName,
        allowNull: row.isNullable === 'YES',
      }
    })

    return columnData
  }

  private async getVirtualColumns(tableName: string) {
    const models = sortBy(Object.values(await loadModels()), m => m.table)
    const model = models.find(model => model.table === tableName)
    if (!model) throw new Error(`Failed to find a model matching the table name: ${tableName}`)
    return model['virtualAttributes']?.map(prop => prop.property) || []
  }

  private async getAssociationData(tableName: string, targetAssociationType?: string) {
    const models = sortBy(Object.values(await loadModels()), m => m.table)
    const tableAssociationData: any = {}

    for (const model of models.filter(model => model.table === tableName)) {
      for (const associationName of model.associationNames) {
        const associationMetaData = model.associationMap()[associationName]
        if (targetAssociationType && associationMetaData.type !== targetAssociationType) continue

        const dreamClassOrClasses = associationMetaData.modelCB()
        const optional =
          associationMetaData.type === 'BelongsTo' ? (associationMetaData as any).optional === true : null

        tableAssociationData[associationName] ||= {
          tables: [],
          type: associationMetaData.type,
          polymorphic: associationMetaData.polymorphic,
          optional,
        }

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

  private async getTables() {
    const fileContents = await this.loadSchemaFile()
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

  private async loadSchemaFile() {
    return (await fs.readFile(await schemaPath())).toString()
  }
}

interface InformationSchemaRow {
  columnName: string
  udtName: string
  isNullable: 'YES' | 'NO'
}
