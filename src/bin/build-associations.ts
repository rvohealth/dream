import '../helpers/loadEnv'
import path from 'path'
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
  const modelsBeforeAdaption: { [key: string]: string[] } = {}

  Object.keys(DBColumns).forEach(column => {
    modelsBeforeAdaption[column] = []
  })

  for (const model of models) {
    modelsBeforeAdaption[model.prototype.table] ||= []
    modelsBeforeAdaption[model.prototype.table] = [
      ...modelsBeforeAdaption[model.prototype.table],
      ...model.virtualAttributes.map(vc => vc.property),
    ]
  }
  const finalModels = setEmptyVirtualObjectsToFalse(modelsBeforeAdaption)

  return `\
${fileStr}

export interface VirtualColumns ${JSON.stringify(finalModels, null, 2)}
`
}

async function writeAssociationsFile() {
  const finalModels = await fleshOutAssociations()

  const associationsAndTheirTables: { [key: string]: string[] } = {}
  Object.values(finalModels).forEach(associationToTables => {
    Object.keys(associationToTables).forEach(
      associationName => (associationsAndTheirTables[associationName] = associationToTables[associationName])
    )
  })
  const finalBelongsToModels = await fleshOutAssociations('BelongsTo')

  setEmptyAssociationObjectsToFalse(finalBelongsToModels)

  return `\
export default ${JSON.stringify(finalModels, null, 2)}

export interface SyncedAssociations ${JSON.stringify(finalModels, null, 2)}

export interface SyncedBelongsToAssociations ${JSON.stringify(finalBelongsToModels, null, 2)}

export interface SyncedAssociationsToTables ${JSON.stringify(associationsAndTheirTables, null, 2)}
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

function setEmptyAssociationObjectsToFalse(models: { [key: string]: { [key: string]: string[] } | boolean }) {
  Object.keys(DBColumns).forEach(column => {
    if (Object.keys(models[column]).length === 0) models[column] = false
  })
}

function setEmptyVirtualObjectsToFalse(models: { [key: string]: string[] }) {
  const newObj: { [key: string]: string[] | false } = { ...models }
  Object.keys(models).forEach(column => {
    if (models[column].length === 0) newObj[column] = false
  })
  return newObj
}
