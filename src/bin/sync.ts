import '../src/helpers/loadEnv'
import pluralize from 'pluralize'
import path from 'path'
import { promises as fs } from 'fs'
import sspawn from '../helpers/sspawn'
import { loadDreamYamlFile } from '../helpers/path'
import compact from '../helpers/compact'
import snakeify from '../helpers/snakeify'
import ConnectionConfRetriever from '../db/connection-conf-retriever'

export default async function sync() {
  console.log('writing schema...')
  const [schema, transformedNames] = await writeSchema()

  console.log('syncing schema, associations, and dream config files...')
  const yamlConf = await loadDreamYamlFile()
  if (process.env.DREAM_CORE_DEVELOPMENT === '1') {
    await sspawn(
      'rm -f src/sync/schema.ts && rm -f src/sync/dream.ts && ' +
        'cp ./test-app/db/schema.ts ./src/sync && ' +
        'cp ./test-app/db/associations.ts ./src/sync'
    )
  } else {
    await sspawn(
      'rm -f src/sync/schema.ts && rm -f src/sync/dream.ts && ' +
        `cp ../../${yamlConf.schema_path} ./src/sync/schema.ts && ` +
        `cp ../../${yamlConf.associations_path} ./src/sync/associations.ts`
    )
  }

  console.log('sync complete!')
}
sync()

async function writeSchema() {
  const yamlConf = await loadDreamYamlFile()
  const dbConf = new ConnectionConfRetriever().getConnectionConf('primary')

  let absoluteSchemaPath = path.join(__dirname, '..', yamlConf.schema_path)
  let absoluteSchemaWritePath = path.join(__dirname, '..', '..', '..', yamlConf.schema_path)
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
  const [enhancedSchema, transformedNames] = await enhanceSchema(file)

  await fs.writeFile(absoluteSchemaWritePath, enhancedSchema as string)

  console.log('done enhancing schema!')
  return [enhancedSchema, transformedNames] as [string, [string, string][]]
}

// begin: schema helpers

async function enhanceSchema(file: string) {
  file = removeUnwantedExports(file)
  file = replaceBlankExport(file)
  file = addCustomImports(file)

  const interfaces = file.split(/export interface/g)
  const results = interfaces.slice(1, interfaces.length)

  const interfaceKeyIndexes = compact(results.map(result => indexInterfaceKeys(result)))
  const dreamCoercedInterfaces = results.map(result => buildDreamCoercedInterfaces(result))
  const cachedInterfaces = results.map(result => buildCachedInterfaces(result))
  let transformedNames = compact(results.map(result => transformName(result))) as [string, string][]

  const newFileContents = `${file}

${interfaceKeyIndexes.join('\n')}

${dreamCoercedInterfaces.join('\n\n')}
${cachedInterfaces.join('\n\n')}

export interface InterpretedDB {
  ${
    transformedNames.length
      ? transformedNames
          .map(([name, newName]) => `${snakeify(name)}: ${pluralize.singular(name)}Attributes`)
          .join(',\n  ')
      : 'placeholder: []'
  }
}

export const DBColumns = {
  ${
    transformedNames.length
      ? transformedNames
          .map(([name, newName]) => `${snakeify(name)}: ${pluralize.singular(name)}Columns`)
          .join(',\n  ')
      : 'placeholder: []'
  }
}

export const DBTypeCache = {
  ${
    transformedNames.length
      ? transformedNames.map(([name, newName]) => `${snakeify(name)}: ${name}TypeCache`).join(',\n  ')
      : 'placeholder: []'
  }
} as Partial<Record<keyof DB, any>>
`
  return [newFileContents, transformedNames] as [string, [string, string][]]
}

function removeUnwantedExports(file: string) {
  return file.replace('\nexport type Timestamp = ColumnType<Date, Date | string, Date | string>;', '')
}

function addCustomImports(file: string) {
  let dreamTypesSource: string

  if (process.env.DREAM_CORE_DEVELOPMENT === '1') {
    dreamTypesSource = '../../src/dream/types'
  } else {
    dreamTypesSource = 'dream'
  }

  const customImports = `import { DateTime } from 'luxon'
import { IdType, Timestamp } from '${dreamTypesSource}'`

  return `${customImports}
${file}`
}

function replaceBlankExport(str: string) {
  return str.replace(/export interface DB \{\}/, 'export interface DB { placeholder: {} }')
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
${keys.map(key => `'${key}'`).join(', ')}]\
`
}

function buildCachedInterfaces(str: string) {
  const name = str.split(' {')[0].replace(/\s/g, '')
  if (name === 'DB') return null

  const keysAndValues = str
    .split('{')[1]
    .split('\n')
    .filter(str => !['', '}'].includes(str.replace(/\s/g, '')))
    .map(attr => [
      attr.split(':')[0].replace(/\s/g, ''),
      attr.split(':')[1].replace(/\s/g, '').replace(/;$/, ''),
    ])

  return `export const ${name}TypeCache = {
  ${keysAndValues.map(([key, value]) => `${key}: '${value}'`).join(',\n  ')}
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
  ${keysAndValues.map(([key, value]) => `${key}: ${coercedTypeString(value)}`).join('\n  ')}
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

function transformName(str: string): [string, string] | null {
  const name = str.split(' {')[0].replace(/\s/g, '')
  if (name === 'DB') return null
  return [name, pluralize.singular(name) + 'Opts']
}
