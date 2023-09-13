import '../helpers/loadEnv'
import path from 'path'
import { promises as fs } from 'fs'
import loadModels from '../helpers/loadModels'
import { associationsPath, loadDreamYamlFile } from '../helpers/path'
import Dream from '../dream'
import sortBy from 'lodash.sortby'

export default async function buildAssociations() {
  console.log('writing dream type metadata...')
  let fileStr = await buildAssociationsFile()
  fileStr = await writeVirtualColumns(fileStr)

  const filePath = path.join(__dirname, '..', 'sync', 'associations.ts')
  const clientFilePath = await associationsPath()
  await fs.writeFile(filePath, fileStr)
  await fs.writeFile(clientFilePath, fileStr)
  console.log('Done!')
}
buildAssociations()

async function getDBColumns() {
  const models = sortBy(Object.values(await loadModels()) as (typeof Dream)[], m => m.prototype.table)
  const dbColumns: any = {}
  models.forEach(m => {
    dbColumns[m.prototype.table] = m.prototype.dbColumns
  })
  return dbColumns
}

async function writeVirtualColumns(fileStr: string) {
  const models = Object.values(await loadModels()) as (typeof Dream)[]
  const modelsBeforeAdaption: { [key: string]: string[] } = {}
  const dbColumns: any = await getDBColumns()

  Object.keys(dbColumns).forEach(column => {
    modelsBeforeAdaption[column] = []
  })

  for (const model of models) {
    // do this to avoid running into the ApplicationModel
    try {
      model.prototype.table
    } catch (_) {
      continue
    }

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

async function buildAssociationsFile() {
  const finalModels = await fleshOutAssociations()
  const finalBelongsToModels = await fleshOutAssociations('BelongsTo')

  await setEmptyAssociationObjectsToFalse(finalBelongsToModels)

  return `\
export default ${JSON.stringify(finalModels, null, 2)}

export interface SyncedAssociations ${JSON.stringify(finalModels, null, 2)}

export interface SyncedBelongsToAssociations ${JSON.stringify(finalBelongsToModels, null, 2)}
  `
}

async function fleshOutAssociations(targetAssociationType?: string) {
  const models = Object.values(await loadModels()) as any[]
  const finalModels: { [key: string]: { [key: string]: string[] } } = {}
  const dbColumns: any = await getDBColumns()

  Object.keys(dbColumns).forEach(column => {
    finalModels[column] = {}
  })

  for (const model of models) {
    for (const associationName of model.associationNames) {
      const associationMetaData = model.associationMap()[associationName]
      if (targetAssociationType && associationMetaData.type !== targetAssociationType) continue

      finalModels[model.prototype.table] ||= {}

      const dreamClassOrClasses = associationMetaData.modelCB()
      if (Array.isArray(dreamClassOrClasses)) {
        const tables: string[] = (dreamClassOrClasses as any[]).map(dreamClass => dreamClass.prototype.table)
        finalModels[model.prototype.table][associationName] ||= []
        finalModels[model.prototype.table][associationName] = [
          ...finalModels[model.prototype.table][associationName],
          ...tables,
        ]
      } else {
        finalModels[model.prototype.table][associationName] ||= []
        finalModels[model.prototype.table][associationName].push(dreamClassOrClasses.prototype.table)
      }

      // guarantee unique
      finalModels[model.prototype.table][associationName] = [
        ...new Set(finalModels[model.prototype.table][associationName]),
      ]
    }
  }

  return finalModels
}

async function setEmptyAssociationObjectsToFalse(models: {
  [key: string]: { [key: string]: string[] } | boolean
}) {
  const dbColumns: any = await getDBColumns()
  Object.keys(dbColumns).forEach(column => {
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
