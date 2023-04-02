import '../helpers/loadEnv'
import { loadFile, schemaPath, writeFile } from '../helpers/path'
import pluralize = require('pluralize')
import camelize from '../helpers/camelize'
import compact from '../helpers/compact'

export default async function enhanceSchema() {
  const pathToSchema = await schemaPath()
  const file = (await loadFile(pathToSchema)).toString()
  const interfaces = file.split(/export interface/g)
  const results = interfaces.slice(1, interfaces.length)

  const transformedInterfaces = compact(results.map(result => transformInterface(result)))
  const transformedNames = compact(results.map(result => transformName(result))) as [string, string][]

  const newFileContents = `
${file}

${transformedInterfaces.join('\n')}

export interface DBOpts {
  ${transformedNames.map(([name, newName]) => `${name}: ${newName}`).join('\n')}
}
`

  await writeFile(pathToSchema, newFileContents)
  console.log('done enhancing schema!')
}

enhanceSchema()

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

function transformName(str: string): [string, string] | null {
  const name = str.split(' {')[0].replace(/\s/g, '')
  if (name === 'DB') return null
  return [name, pluralize.singular(name) + 'Opts']
}
