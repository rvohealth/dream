import '../src/helpers/loadEnv'
import _db from '../src/db'
import loadDreamconfFile from '../shared/helpers/path/loadDreamconfFile'
import pluralize from 'pluralize'
import path from 'path'
import { promises as fs } from 'fs'
import sspawn from '../shared/helpers/sspawn'
import compact from '../shared/helpers/compact'
import snakeify from '../shared/helpers/snakeify'
import camelize from '../shared/helpers/camelize'
import ConnectionConfRetriever from './cli/connection-conf-retriever-primitive'
import loadDreamYamlFile from '../shared/helpers/path/loadDreamYamlFile'
import shouldOmitDistFolder from '../shared/helpers/path/shouldOmitDistFolder'
import { Kysely, sql } from 'kysely'
import uniq from 'lodash.uniq'

export default async function sync() {
  console.log('writing schema...')
  await writeSchema()
  console.log('sync complete!')
}
// eslint-disable-next-line
sync()

async function writeSchema() {
  const yamlConf = await loadDreamYamlFile()
  const dbConf = await new ConnectionConfRetriever().getConnectionConf('primary')

  const updirsToDreamRoot = shouldOmitDistFolder() ? ['..'] : ['..', '..']
  let absoluteSchemaPath = path.join(__dirname, ...updirsToDreamRoot, yamlConf.schema_path)
  let absoluteSchemaWritePath = path.join(
    __dirname,
    ...updirsToDreamRoot,
    '..',
    '..',
    '..',
    yamlConf.schema_path
  )
  if (process.env.DREAM_CORE_DEVELOPMENT === '1') {
    absoluteSchemaWritePath = path.join(__dirname, '..', yamlConf.schema_path)
    absoluteSchemaPath = path.join(__dirname, '..', yamlConf.schema_path)
  }

  await sspawn(
    `kysely-codegen --url=postgres://${process.env[dbConf.user]}@${process.env[dbConf.host]}:${
      process.env[dbConf.port]
    }/${process.env[dbConf.name]} --out-file=${absoluteSchemaPath}`
  )

  // intentionally bypassing helpers here, since they often end up referencing
  // from the dist folder, whereas dirname here is pointing to true src folder.
  const file = (await fs.readFile(absoluteSchemaPath)).toString()
  const enhancedSchema = await enhanceSchema(file)

  await fs.writeFile(absoluteSchemaWritePath, enhancedSchema as string)

  console.log('done enhancing schema!')
}

// begin: schema helpers

async function enhanceSchema(file: string) {
  file = removeUnwantedExports(file)
  file = replaceBlankExport(file)
  file = replaceJsonType(file)

  const interfaces = file.split(/export interface /g)
  const results = interfaces.slice(1, interfaces.length)
  const dbInterface = results.find(str => /^DB \{/.test(str))!
  const camelDbInterface = camelcasify(dbInterface)

  file = camelcasify(file)
  file = file.replace(camelDbInterface, dbInterface)
  file = addCustomImports(file)

  const interfaceKeyIndexes = compact(results.map(result => indexInterfaceKeys(result)))
  const allColumnsString = allColumns(results)

  const dreamCoercedInterfaces = results.map(result => buildDreamCoercedInterfaces(result))

  const dreamconf = await loadDreamconfFile()
  const db = _db('primary', dreamconf)
  const dbTypeMap = await Promise.all(results.map(async result => await buildDBTypeMap(db, result)))

  let transformedNames = compact(results.map(result => transformName(result))) as string[]

  // BEGIN FILE CONTENTS BUILDING
  const newFileContents = `${file}

${interfaceKeyIndexes.join('\n')}

${allColumnsString}

${dreamCoercedInterfaces.join('\n\n')}
${dbTypeMap.join('\n\n')}

export class DBClass {
  ${
    transformedNames.length
      ? transformedNames
          .map(name => `${snakeify(name)}: ${name}`)
          .sort()
          .join('\n  ')
      : 'placeholder: []'
  }
}

export interface InterpretedDB {
  ${
    transformedNames.length
      ? transformedNames
          .map(name => `${snakeify(name)}: ${pluralize.singular(name)}Attributes`)
          .sort()
          .join(',\n  ')
      : 'placeholder: []'
  }
}

export class InterpretedDBClass {
  ${
    transformedNames.length
      ? transformedNames
          .map(name => `${snakeify(name)}: ${pluralize.singular(name)}Attributes`)
          .sort()
          .join('\n  ')
      : 'placeholder: []'
  }
}

export const DBColumns = {
  ${
    transformedNames.length
      ? transformedNames
          .map(name => `${snakeify(name)}: ${pluralize.singular(name)}Columns`)
          .sort()
          .join(',\n  ')
      : 'placeholder: []'
  }
}

export const DBTypeCache = {
  ${
    transformedNames.length
      ? transformedNames
          .map(name => `${snakeify(name)}: ${name}DBTypeMap`)
          .sort()
          .join(',\n  ')
      : 'placeholder: []'
  }
} as Partial<Record<keyof DB, any>>
`

  const sortedFileContents = alphaSortInterfaceProperties(newFileContents)
  return sortedFileContents
}

function removeUnwantedExports(file: string) {
  return file.replace(
    '\nexport type Timestamp = ColumnType<Date, Date | string, Date | string>;',
    `\
type IdType = string | number | bigint | undefined
type Timestamp = ColumnType<DateTime>`
  )
}

function addCustomImports(file: string) {
  const customImports = `import { DateTime } from 'luxon'`

  return `${customImports}
${file}`
}

function replaceBlankExport(str: string) {
  return str.replace(/export interface DB \{\}/, 'export interface DB { placeholder: {} }')
}

function replaceJsonType(str: string) {
  return str.replace(
    'export type Json = ColumnType<JsonValue, string, string>',
    'export type Json = ColumnType<JsonValue, string | JsonValue, string | JsonValue>'
  )
}

function camelcasify(str: string) {
  return _camelcasify(str)
}

function _camelcasify(str: string): string {
  const camelString = str.replace(
    /([( .])([a-z][a-zA-Z0-9]*)_([a-z0-9])([a-z0-9]*)/g,
    (match, p1, p2, p3, p4) => `${p1}${p2}${p3.toUpperCase()}${p4}`
  )

  return camelString === str ? camelString : _camelcasify(camelString)
}

function indexInterfaceKeys(str: string) {
  const name = str.split(' {')[0].replace(/\s/g, '')
  if (name === 'DB') return null

  const keys = tableInterfaceToColumns(str)

  return `export const ${pluralize.singular(name)}Columns = [${keys.join(', ')}] as const`
}

function allColumns(tableInterfaces: string[]) {
  const columns: string[] = uniq(
    compact(tableInterfaces.flatMap(tableInterface => tableInterfaceToColumns(tableInterface)))
  ).sort() as string[]

  return `export const AllColumns = [${columns.join(', ')}] as const`
}

function tableInterfaceToColumns(str: string): string[] {
  return str
    .split('{')[1]
    .split('\n')
    .filter(str => !['', '}'].includes(str.replace(/\s/g, '')))
    .map(attr => "'" + camelize(attr.split(':')[0].replace(/\s/g, '')) + "'")
    .sort()
}

function alphaSortInterfaceProperties(str: string) {
  return str.replaceAll(/(export interface [^\n{]+){\n([^}]+)\n}/g, (_match, interfaceDeclaration, lines) => {
    const props = lines.split(/\n/)

    return `${interfaceDeclaration}{
${props.sort().join('\n')}
}`
  })
}

async function buildDBTypeMap(db: Kysely<any>, str: string) {
  const name = str.split(' {')[0].replace(/\s/g, '')
  if (name === 'DB') return null

  const tableName = snakeify(name)
  const sqlQuery = sql`SELECT column_name, udt_name::regtype FROM information_schema.columns WHERE table_name = ${tableName}`
  const columnToDBTypeMap = await sqlQuery.execute(db)

  return `export const ${name}DBTypeMap = {
  ${(columnToDBTypeMap.rows as { columnName: string; udtName: string }[])
    .map(mapping => `${camelize(mapping.columnName)}: '${mapping.udtName}'`)
    .sort()
    .join(',\n  ')}
}\
`
}

function buildDreamCoercedInterfaces(str: string) {
  const name = str.split(' {')[0].replace(/\s/g, '')
  if (name === 'DB') return null

  const keysAndValues = str
    .split('{')[1]
    .split('\n')
    .filter(str => !['', '}'].includes(str.replace(/\s/g, '')))
    .map(attr => [attr.split(':')[0].replace(/\s/g, ''), attr.split(':')[1].replace(/;$/, '')])

  return `export interface ${pluralize.singular(name)}Attributes {
  ${keysAndValues
    .map(([key, value]) => `${camelize(key)}: ${coercedTypeString(value)}`)
    .sort()
    .join('\n  ')}
}\
  `
}

function coercedTypeString(typeString: string) {
  return typeString
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

function transformName(str: string): string | null {
  const name = str.split(' {')[0].replace(/\s/g, '')
  if (name === 'DB') return null
  return name
}
