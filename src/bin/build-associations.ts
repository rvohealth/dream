import '../helpers/loadEnv'
import * as path from 'path'
import { promises as fs } from 'fs'
import loadModels from '../helpers/loadModels'
import { loadDreamYamlFile } from '../helpers/path'
import { DBColumns } from '../sync/schema'
import absoluteFilePath from '../helpers/absoluteFilePath'
import Dream from '../dream'

export default async function buildAssociations() {
  console.log('writing dream type metadata...')
  let fileStr = await writeAssociationsFile()
  fileStr = await writeVirtualColumns(fileStr)

  const filePath = path.join(__dirname, '..', 'sync', 'associations.ts')
  const yamlConf = await loadDreamYamlFile()
  const clientFilePath = absoluteFilePath(yamlConf.associations_path)
  await fs.writeFile(filePath, fileStr)
  await fs.writeFile(clientFilePath, fileStr)
}
buildAssociations()

async function writeVirtualColumns(fileStr: string) {
  const models = Object.values(await loadModels()) as (typeof Dream)[]
  const finalModels: { [key: string]: string[] } = {}

  Object.keys(DBColumns).forEach(column => {
    finalModels[column] = []
  })

  for (const model of models) {
    finalModels[model.prototype.table] ||= []
    finalModels[model.prototype.table] = [
      ...finalModels[model.prototype.table],
      ...model.virtualAttributes.map(vc => vc.property),
    ]
  }

  return `\
${fileStr}

export interface VirtualColumns ${JSON.stringify(finalModels, null, 2)}
`
}

async function writeAssociationsFile() {
  const finalModels = await fleshOutAssociations()
  const finalBelongsToModels = await fleshOutAssociations('BelongsTo')

  setEmptyObjectsToFalse(finalBelongsToModels)

  return `\
export default ${JSON.stringify(finalModels, null, 2)}

export interface SyncedAssociations ${JSON.stringify(finalModels, null, 2)}

export interface SyncedBelongsToAssociations ${JSON.stringify(finalBelongsToModels, null, 2)}
  `
}

async function fleshOutAssociations(targetAssociationType?: string) {
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

function setEmptyObjectsToFalse(models: { [key: string]: { [key: string]: string[] } | boolean }) {
  Object.keys(DBColumns).forEach(column => {
    if (Object.keys(models[column]).length === 0) models[column] = false
  })
}
