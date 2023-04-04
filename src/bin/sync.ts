import '../helpers/loadEnv'
import * as path from 'path'
import { promises as fs } from 'fs'
import loadModels from '../helpers/loadModels'
import sspawn from '../helpers/sspawn'
import { loadDreamYamlFile } from '../helpers/path'
import compact from '../helpers/compact'
import pluralize = require('pluralize')
import camelize from '../helpers/camelize'
import snakeify from '../helpers/snakeify'

export default async function sync() {
  console.log('copying schema and dream config...')
  await sspawn(
    'rm -rf src/sync && mkdir src/sync && ' +
      'cp ./src/test-app/db/schema.ts ./src/sync && ' +
      'cp ./src/test-app/conf/dream.ts ./src/sync'
  )

  console.log('writing schema...')
  await writeSchema()

  console.log('syncing models...')
  await writeModels()

  console.log('sync complete!')
}
sync()

async function writeModels() {
  const models = await loadModels()
  const filePath = path.join(__dirname, '..', 'sync', 'models.ts')
  const relativePathToModels =
    process.env.CORE_DEVELOPMENT === '1'
      ? path.join('..', 'test-app', 'app', 'models')
      : path.join('..', '..', '..', 'src', 'app', 'models')

  const importStatements = Object.keys(models)
    .map(key => `import ${models[key].name} from '${relativePathToModels + '/' + key.replace(/\.ts$/, '')}'`)
    .join('\n')

  const str = `\
${importStatements}

export default {
${Object.keys(models).map(key => `  "${key.replace(/\.ts/, '')}": ${models[key].name}`)}
}
`
  await fs.writeFile(filePath, str)
}

async function writeSchema() {
  const yamlConf = await loadDreamYamlFile()

  let absoluteSchemaPath = path.join(__dirname, '..', '..', '..', yamlConf.schema_path)
  if (process.env.CORE_DEVELOPMENT === '1') {
    absoluteSchemaPath = path.join(__dirname, '..', '..', yamlConf.schema_path)
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
