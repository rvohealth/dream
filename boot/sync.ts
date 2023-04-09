import '../src/helpers/loadEnv'
import * as pluralize from 'pluralize'
import * as path from 'path'
import { promises as fs } from 'fs'
import loadModels from '../src/helpers/loadModels'
import sspawn from '../src/helpers/sspawn'
import { loadDreamYamlFile } from '../src/helpers/path'
import compact from '../src/helpers/compact'
import camelize from '../src/helpers/camelize'
import snakeify from '../src/helpers/snakeify'

export default async function sync() {
  console.log('writing schema...')
  await writeSchema()

  console.log('syncing schema and dream config...')
  const yamlConf = await loadDreamYamlFile()
  console.log('YAML CONF:', yamlConf)
  if (process.env.CORE_DEVELOPMENT === '1') {
    await sspawn(
      'rm src/sync/schema.ts && rm src/sync/dream.ts && ' +
        'cp ./src/test-app/db/schema.ts ./src/sync && ' +
        'cp ./src/test-app/conf/dream.ts ./src/sync'
    )
  } else {
    await sspawn(
      'rm src/sync/schema.ts && rm src/sync/dream.ts && ' +
        `cp ./${yamlConf.schema_path} ./src/sync && ` +
        `cp ./${yamlConf.dream_config_path}.ts ./src/sync`
    )
  }

  console.log('sync complete!')
}
sync()

async function writeSchema() {
  const yamlConf = await loadDreamYamlFile()

  let absoluteSchemaPath = path.join(__dirname, '..', '..', '..', '..', yamlConf.schema_path)
  console.log('ABS PATH', absoluteSchemaPath)
  if (process.env.CORE_DEVELOPMENT === '1') {
    absoluteSchemaPath = path.join(__dirname, '..', yamlConf.schema_path)
  }

  await sspawn(
    `kysely-codegen --url=postgres://${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME} --out-file=${absoluteSchemaPath}`
  )

  // intentionally bypassing helpers here, since they often end up referencing
  // from the dist folder, whereas dirname here is pointing to true src folder.
  const file = await (await fs.readFile(absoluteSchemaPath)).toString()
  const enhancedSchema = await enhanceSchema(file)

  await fs.writeFile(absoluteSchemaPath, enhancedSchema)
  console.log('done enhancing schema!')
}

// begin: schema helpers

async function enhanceSchema(file: string) {
  file = replaceTimestampWithLuxonVariant(file)

  const interfaces = file.split(/export interface/g)
  const results = interfaces.slice(1, interfaces.length)

  const transformedInterfaces = compact(results.map(result => transformInterface(result)))
  const interfaceKeyIndexes = compact(results.map(result => indexInterfaceKeys(result)))
  const transformedNames = compact(results.map(result => transformName(result))) as [string, string][]

  const newFileContents = `
${file}

${transformedInterfaces.join('\n')}

${interfaceKeyIndexes.join('\n')}

export interface DBOpts {
  ${transformedNames.map(([name, newName]) => `${snakeify(name)}: ${newName}`).join('\n  ')}
}

export const DBColumns = {
  ${transformedNames
    .map(([name, newName]) => `${snakeify(name)}: ${pluralize.singular(name)}Columns`)
    .join(',\n  ')}
}
`
  return newFileContents
}

function replaceTimestampWithLuxonVariant(file: string) {
  return `\
import { DateTime } from 'luxon'
${file.replace(
  'export type Timestamp = ColumnType<Date, Date | string, Date | string>',
  'export type Timestamp = ColumnType<DateTime>'
)}`
}

function transformInterface(str: string) {
  const name = str.split(' {')[0].replace(/\s/g, '')
  if (name === 'DB') return null

  const attributes = str
    .split('{')[1]
    .split('\n')
    .filter(str => !['', '}'].includes(str.replace(/\s/g, '')))

  return `\
export interface ${pluralize.singular(name)}Opts {
  ${attributes
    .map(attr => {
      const key = attr.split(':')[0].replace(/\s/g, '')
      const val = attr.split(':')[1]
      return `${camelize(key)}?: ${val}`
    })
    .join('\n  ')}
}\ 
`
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

function transformName(str: string): [string, string] | null {
  const name = str.split(' {')[0].replace(/\s/g, '')
  if (name === 'DB') return null
  return [name, pluralize.singular(name) + 'Opts']
}
