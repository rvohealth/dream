import '../helpers/loadEnv'
import * as path from 'path'
import { promises as fs } from 'fs'
import loadModels from '../helpers/loadModels'
import { DreamModel } from '../dream'
import { loadDreamYamlFile } from '../helpers/path'

export default async function buildAssociations() {
  console.log('indexing dream associations...')
  await writeAssociationsFile()
  console.log('dream association indexing complete!')
}
buildAssociations()

async function writeAssociationsFile() {
  const models = Object.values(await loadModels()) as any[]
  const finalModels: { [key: string]: { names: string[]; nameTableMap: { [key: string]: string } } } = {}
  for (const model of models) {
    finalModels[model.table] ||= { names: [], nameTableMap: {} }
    finalModels[model.table].names = [
      ...new Set([...finalModels[model.table].names, ...new model().associationNames]),
    ]
    for (const associationName of new model().associationNames) {
      finalModels[model.table].nameTableMap[associationName] = new model().associationMap[associationName].to
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
  ${Object.keys(finalModels)
    .map(
      table => `\
  "${table}": {
    AssociationName: ${finalModels[table].names.map(association => `"${association}"`).join(' | ')},
    AssociationTableMap: {\n${Object.keys(finalModels[table].nameTableMap)
      .map(association => `"${association}": "${finalModels[table].nameTableMap[association]}"`)
      .join('\n  ')}}\n  `
    )
    .join('}\n  ')}
  } 
}
  `
  await fs.writeFile(filePath, str)
  await fs.writeFile(clientFilePath, str)
}
