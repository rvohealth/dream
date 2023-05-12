import '../src/helpers/loadEnv'
import * as pluralize from 'pluralize'
import * as path from 'path'
import { promises as fs } from 'fs'
import sspawn from '../src/helpers/sspawn'
import { loadDreamYamlFile } from '../src/helpers/path'
import compact from '../src/helpers/compact'
import camelize from '../src/helpers/camelize'
import snakeify from '../src/helpers/snakeify'

export default async function sync() {
  console.log('writing schema...')
  const [schema, transformedNames] = await writeSchema()

  console.log('syncing schema, associations, and dream config files...')
  const yamlConf = await loadDreamYamlFile()
  if (process.env.DREAM_CORE_DEVELOPMENT === '1') {
    await sspawn(
      'rm -f src/sync/schema.ts && rm -f src/sync/dream.ts && ' +
        'cp ./test-app/db/schema.ts ./src/sync && ' +
        'cp ./test-app/conf/dream.ts ./src/sync && ' +
        'cp ./test-app/db/associations.ts ./src/sync'
    )
  } else {
    await sspawn(
      'rm -f src/sync/schema.ts && rm -f src/sync/dream.ts && ' +
        `cp ../../${yamlConf.schema_path} ./src/sync && ` +
        `cp ../../${yamlConf.dream_config_path} ./src/sync && ` +
        `cp ../../${yamlConf.associations_path} ./src/sync`
    )
  }

  console.log('sync complete!')
}
sync()

async function writeSchema() {
  const yamlConf = await loadDreamYamlFile()

  let absoluteSchemaPath = path.join(__dirname, '..', yamlConf.schema_path)
  let absoluteSchemaWritePath = path.join(__dirname, '..', '..', '..', yamlConf.schema_path)
  if (process.env.DREAM_CORE_DEVELOPMENT === '1') {
    absoluteSchemaWritePath = path.join(__dirname, '..', yamlConf.schema_path)
    let absoluteSchemaPath = path.join(__dirname, '..', yamlConf.schema_path)
  }

  await sspawn(
    `kysely-codegen --url=postgres://${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME} --out-file=${absoluteSchemaPath}`
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
  file = replaceTimestampWithLuxonVariant(file)
  file = replaceBlankExport(file)
  file = addCustomImports(file)

  const interfaces = file.split(/export interface/g)
  const results = interfaces.slice(1, interfaces.length)

  const interfaceKeyIndexes = compact(results.map(result => indexInterfaceKeys(result)))
  const cachedInterfaces = results.map(result => buildCachedInterfaces(result))
  let transformedNames = compact(results.map(result => transformName(result))) as [string, string][]

  const newFileContents = `
${file}

${interfaceKeyIndexes.join('\n')}

${cachedInterfaces.join('\n')}

${transformedNames
  .map(([name]) => `export type ${pluralize.singular(name)}Attributes = Updateable<DB['${snakeify(name)}']>`)
  .join('\n')}

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
}
`
  return [newFileContents, transformedNames] as [string, [string, string][]]
}

function replaceTimestampWithLuxonVariant(file: string) {
  return `\
${file.replace(
  'export type Timestamp = ColumnType<Date, Date | string, Date | string>',
  'export type Timestamp = ColumnType<DateTime>'
)}`
}

function addCustomImports(file: string) {
  return `\
import { DateTime } from 'luxon'
import type { Updateable } from 'kysely'
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

function transformName(str: string): [string, string] | null {
  const name = str.split(' {')[0].replace(/\s/g, '')
  if (name === 'DB') return null
  return [name, pluralize.singular(name) + 'Opts']
}
