import '../helpers/loadEnv'
import * as path from 'path'
import { promises as fs } from 'fs'
import loadModels from '../helpers/loadModels'
import { loadDreamYamlFile } from '../helpers/path'
import { DBColumns } from '../sync/schema'
import absoluteFilePath from '../helpers/absoluteFilePath'

export default async function buildAssociations() {
  console.log('indexing dream associations...')
  await writeAssociationsFile()
  console.log('dream association indexing complete!')
}
buildAssociations()

async function fleshOut(targetAssociationType?: string) {
  const models = Object.values(await loadModels()) as any[]
  const finalModels: { [key: string]: { [key: string]: string[] } } = {}

  Object.keys(DBColumns).forEach(column => {
    finalModels[column] = {}
  })

  for (const model of models) {
    for (const associationName of model.associationNames) {
      const associationMetaData = model.associationMap[associationName]
      if (targetAssociationType && associationMetaData.type !== targetAssociationType) continue

      finalModels[model.prototype.table] ||= {}

      const dreamClassOrClasses = associationMetaData.modelCB()
      if (dreamClassOrClasses.constructor === Array) {
        finalModels[model.prototype.table][associationName] = (dreamClassOrClasses as any[]).map(
          dreamClass => dreamClass.prototype.table
        )
      } else {
        finalModels[model.prototype.table][associationName] = [dreamClassOrClasses.prototype.table]
      }
    }
  }

  return finalModels
}

async function writeAssociationsFile() {
  const finalModels = await fleshOut()
  const finalBelongsToModels = await fleshOut('BelongsTo')

  setEmptyObjectsToFalse(finalBelongsToModels)

  const filePath = path.join(__dirname, '..', 'sync', 'associations.ts')

  const yamlConf = await loadDreamYamlFile()
  const clientFilePath = absoluteFilePath(yamlConf.associations_path)

  const str = `\
export default ${JSON.stringify(finalModels, null, 2)}

export interface SyncedAssociations ${JSON.stringify(finalModels, null, 2)}

export interface SyncedBelongsToAssociations ${JSON.stringify(finalBelongsToModels, null, 2)}
  `
  await fs.writeFile(filePath, str)
  await fs.writeFile(clientFilePath, str)
}

function setEmptyObjectsToFalse(models: { [key: string]: { [key: string]: string[] } | boolean }) {
  Object.keys(DBColumns).forEach(column => {
    if (Object.keys(models[column]).length === 0) models[column] = false
  })
}
