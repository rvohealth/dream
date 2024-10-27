import '../../helpers/loadEnv'

import fs from 'fs/promises'
import path from 'path'
import ConnectionConfRetriever from '../../db/connection-conf-retriever'
import DreamApplication from '../../dream-application'
import compact from '../../helpers/compact'
import { envBool } from '../../helpers/envHelpers'
import dreamPath from '../../helpers/path/dreamPath'
import snakeify from '../../helpers/snakeify'
import sspawn from '../../helpers/sspawn'

export default async function writeSyncFile() {
  const dbConf = new ConnectionConfRetriever().getConnectionConf('primary')
  const dreamApp = DreamApplication.getOrFail()

  const dbSyncFilePath = path.join(dreamPath('db'), 'sync.ts')
  const absoluteDbSyncPath = path.join(dreamApp.projectRoot, dbSyncFilePath)

  await sspawn(
    `kysely-codegen --url=postgres://${dbConf.user}:${dbConf.password}@${dbConf.host}:${dbConf.port}/${dbConf.name} --out-file=${absoluteDbSyncPath}`
  )

  // intentionally bypassing helpers here, since they often end up referencing
  // from the dist folder, whereas dirname here is pointing to true src folder.
  const file = (await fs.readFile(absoluteDbSyncPath)).toString()
  const enhancedSchema = enhanceSchema(file)

  await fs.writeFile(absoluteDbSyncPath, enhancedSchema)

  DreamApplication.log('done writing dream sync file!')
}

// begin: schema helpers

function enhanceSchema(file: string) {
  file = removeUnwantedExports(file)
  file = replaceJsonType(file)

  const interfaces = file.split(/export interface /g)
  const results = interfaces.slice(1, interfaces.length)
  const dbInterface = results.find(str => /^DB \{/.test(str))!
  const camelDbInterface = camelcasify(dbInterface)

  file = camelcasify(file)
  file = file.replace(camelDbInterface, dbInterface)
  file = addCustomImports(file)

  const transformedNames = compact(results.map(result => transformName(result)))
  const fileWithCoercedTypes = exportedEnumTypesToExportedTypeValues(file)

  // BEGIN FILE CONTENTS BUILDING
  const newFileContents = `${fileWithCoercedTypes}

export class DBClass {
  ${transformedNames
    .map(name => `${snakeify(name)}: ${name}`)
    .sort()
    .join('\n  ')}
}
`

  const sortedFileContents = alphaSortInterfaceProperties(newFileContents)
  return sortedFileContents
}

function removeUnwantedExports(file: string) {
  return file.replace(
    '\nexport type Timestamp = ColumnType<Date, Date | string, Date | string>;',
    `\
export type IdType = string | number | bigint
export type Timestamp = ColumnType<DateTime | CalendarDate>`
  )
}

function addCustomImports(file: string) {
  const calendarDateImportStatement = envBool('DREAM_CORE_DEVELOPMENT')
    ? "import CalendarDate from '../../src/helpers/CalendarDate'"
    : "import { CalendarDate } from '@rvohealth/dream'"

  const customImports = `${calendarDateImportStatement}
import { DateTime } from 'luxon'`

  return `${customImports}
${file}`
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

function alphaSortInterfaceProperties(str: string) {
  return str.replace(/(export interface [^\n{]+){\n([^}]+)\n}/g, (_match, interfaceDeclaration, lines) => {
    const props = lines.split(/\n/)

    return `${interfaceDeclaration}{
${props.sort().join('\n')}
}`
  })
}

function exportedEnumTypesToExportedTypeValues(str: string) {
  const ommitedTypes = ['Generated<T>', 'Json', 'JsonArray', 'JsonObject', 'JsonPrimitive', 'JsonValue']

  return str.replace(/export type ([^=]*) = ((?!ColumnType)[^;\n]*);/g, (_match, typeDeclaration, types) => {
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
