import '../helpers/loadEnv'
import * as path from 'path'
import { promises as fs } from 'fs'
import loadModels from '../helpers/loadModels'
import { DreamModel } from '../dream'
import { loadDreamYamlFile } from '../helpers/path'
import { DBColumns } from '../sync/schema'

export default async function buildAssociations() {
  console.log('indexing dream associations...')
  await writeAssociationsFile()
  console.log('dream association indexing complete!')
}
buildAssociations()

async function writeAssociationsFile() {
  const models = Object.values(await loadModels()) as any[]
  const finalModels: { [key: string]: { [key: string]: string } } = {}

  Object.keys(DBColumns).forEach(column => {
    finalModels[column] = {}
  })

  for (const model of models) {
    for (const associationName of new model().associationNames) {
      finalModels[model.table][associationName] = new model().associationMap[associationName].to
    }
  }
  const filePath = path.join(__dirname, '..', 'sync', 'associations.ts')

  const yamlConf = await loadDreamYamlFile()
  const clientFilePath =
    process.env.CORE_DEVELOPMENT === '1'
      ? path.join(__dirname, '..', '..', yamlConf.associations_path)
      : path.join(__dirname, '..', '..', '..', '..', yamlConf.associations_path)

  const str = `\
export default ${JSON.stringify(finalModels, null, 2)}

export interface SyncedAssociations {
  ${Object.keys(finalModels).map(
    table => `\
  "${table}": {\n${Object.keys(finalModels[table])
      .map(association => `"${association}": "${finalModels[table][association]}"`)
      .join('\n  ')}}\n  `
  )} 
}
  `
  await fs.writeFile(filePath, str)
  await fs.writeFile(clientFilePath, str)
}
