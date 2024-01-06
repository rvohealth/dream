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

export default async function sync() {
  console.log('writing schema...')
  await writeSchema()
  console.log('sync complete!')
}
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

  const interfaces = file.split(/export interface /g)
  const results = interfaces.slice(1, interfaces.length)
  const dbInterface = results.find(str => /^DB \{/.test(str))!
  const camelDbInterface = camelcasify(dbInterface)

  file = camelcasify(file)
  file = file.replace(camelDbInterface, dbInterface)
  file = addCustomImports(file)

  const interfaceKeyIndexes = compact(results.map(result => indexInterfaceKeys(result)))
  const dreamCoercedInterfaces = results.map(result => buildDreamCoercedInterfaces(result))

  const dreamconf = await loadDreamconfFile()
  const db = _db('primary', dreamconf)
  const dbTypeMap = await Promise.all(results.map(async result => await buildDBTypeMap(db, result)))

  let transformedNames = compact(results.map(result => transformName(result))) as string[]

  // BEGIN FILE CONTENTS BUILDING
  const newFileContents = `${file}

${interfaceKeyIndexes.join('\n')}

${dreamCoercedInterfaces.join('\n\n')}
${dbTypeMap.join('\n\n')}

export class DBClass {
  ${
    transformedNames.length
      ? transformedNames.map(name => `${snakeify(name)}: ${name}`).join('\n  ')
      : 'placeholder: []'
  }
}

export interface InterpretedDB {
  ${
    transformedNames.length
      ? transformedNames.map(name => `${snakeify(name)}: ${pluralize.singular(name)}Attributes`).join(',\n  ')
      : 'placeholder: []'
  }
}

export class InterpretedDBClass {
  ${
    transformedNames.length
      ? transformedNames.map(name => `${snakeify(name)}: ${pluralize.singular(name)}Attributes`).join('\n  ')
      : 'placeholder: []'
  }
}

export const DBColumns = {
  ${
    transformedNames.length
      ? transformedNames.map(name => `${snakeify(name)}: ${pluralize.singular(name)}Columns`).join(',\n  ')
      : 'placeholder: []'
  }
}

export const DBTypeCache = {
  ${
    transformedNames.length
      ? transformedNames.map(name => `${snakeify(name)}: ${name}DBTypeMap`).join(',\n  ')
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

  const keys = str
    .split('{')[1]
    .split('\n')
    .filter(str => !['', '}'].includes(str.replace(/\s/g, '')))
    .map(attr => attr.split(':')[0].replace(/\s/g, ''))

  return `export const ${pluralize.singular(name)}Columns = [\
${keys.map(key => `'${camelize(key)}'`).join(', ')}]\
`
}

function alphaSortInterfaceProperties(str: string) {
  const replaced = str.replaceAll(/export interface .*? \{(.*?)\}/gs, (match, group1) => {
    const props = group1.split(/\n/).filter((line: string) => !!line)
    let lines = match.split(/\{\n/)
    const name = lines.shift()

    return `${name}{
${props.sort().join('\n')}
}`
  })

  return replaced
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
  ${keysAndValues.map(([key, value]) => `${camelize(key)}: ${coercedTypeString(value)}`).join('\n  ')}
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
