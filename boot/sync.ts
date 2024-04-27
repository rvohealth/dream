import '../src/helpers/loadEnv'
import path from 'path'
import { promises as fs } from 'fs'
import sspawn from '../src/helpers/sspawn'
import compact from '../src/helpers/compact'
import snakeify from '../src/helpers/snakeify'
import camelize from '../src/helpers/camelize'
import ConnectionConfRetriever from './cli/connection-conf-retriever-primitive'
import loadDreamYamlFile from '../src/helpers/path/loadDreamYamlFile'
import shouldOmitDistFolder from '../src/helpers/path/shouldOmitDistFolder'
import uniq from 'lodash.uniq'

export default async function sync() {
  console.log('writing schema...')
  await writeSchema()
}
void sync()

async function writeSchema() {
  const yamlConf = await loadDreamYamlFile()
  const dbConf = await new ConnectionConfRetriever().getConnectionConf('primary')

  const updirsToDreamRoot = shouldOmitDistFolder() ? ['..'] : ['..', '..']
  const dbtsFilePath = path.join(yamlConf.db_path, 'types.ts')
  let absoluteDbtsPath = path.join(__dirname, ...updirsToDreamRoot, dbtsFilePath)
  let absoluteDbtsWritePath = path.join(__dirname, ...updirsToDreamRoot, '..', '..', '..', dbtsFilePath)
  if (process.env.DREAM_CORE_DEVELOPMENT === '1') {
    absoluteDbtsWritePath = path.join(__dirname, '..', dbtsFilePath)
    absoluteDbtsPath = path.join(__dirname, '..', dbtsFilePath)
  }

  await sspawn(
    `kysely-codegen --url=postgres://${process.env[dbConf.user]}@${process.env[dbConf.host]}:${
      process.env[dbConf.port]
    }/${process.env[dbConf.name]} --out-file=${absoluteDbtsPath}`
  )

  // intentionally bypassing helpers here, since they often end up referencing
  // from the dist folder, whereas dirname here is pointing to true src folder.
  const file = (await fs.readFile(absoluteDbtsPath)).toString()
  const enhancedSchema = enhanceSchema(file)

  await fs.writeFile(absoluteDbtsWritePath, enhancedSchema)

  console.log('done enhancing schema!')
  process.exit()
}

// begin: schema helpers

function enhanceSchema(file: string) {
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

  const allColumnsString = allColumns(results)

  const transformedNames = compact(results.map(result => transformName(result)))
  const fileWithCoercedTypes = exportedTypesToExportedTypeValues(file)

  // BEGIN FILE CONTENTS BUILDING
  const newFileContents = `${fileWithCoercedTypes}

${allColumnsString}

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
`

  const sortedFileContents = alphaSortInterfaceProperties(newFileContents)
  return sortedFileContents
}

function removeUnwantedExports(file: string) {
  return file.replace(
    '\nexport type Timestamp = ColumnType<Date, Date | string, Date | string>;',
    `\
export type IdType = string | number | bigint | undefined
export type Timestamp = ColumnType<DateTime>`
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

function allColumns(tableInterfaces: string[]) {
  const columns: string[] = uniq(
    compact(tableInterfaces.flatMap(tableInterface => tableInterfaceToColumns(tableInterface)))
  ).sort()

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
  return str.replace(/(export interface [^\n{]+){\n([^}]+)\n}/g, (_match, interfaceDeclaration, lines) => {
    const props = lines.split(/\n/)

    return `${interfaceDeclaration}{
${props.sort().join('\n')}
}`
  })
}

function exportedTypesToExportedTypeValues(str: string) {
  const ommitedTypes = [
    'Generated<T>',
    'Int8',
    'Numeric',
    'Json',
    'JsonArray',
    'JsonObject',
    'JsonPrimitive',
    'JsonValue',
  ]

  return str.replace(/export type ([^=]*) = ([^;\n]*);/g, (_match, typeDeclaration, types) => {
    const originalType = `export type ${typeDeclaration} = ${types};`
    if (ommitedTypes.some(type => type === typeDeclaration)) {
      return originalType
    }

    return `\
${originalType}
export const ${typeDeclaration}Values = [
  ${types.split(' | ').join(',\n  ')}
] as const
`
  })
}

function transformName(str: string): string | null {
  const name = str.split(' {')[0].replace(/\s/g, '')
  if (name === 'DB') return null
  return name
}
