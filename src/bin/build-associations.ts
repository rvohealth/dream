import '../helpers/loadEnv'
import { promises as fs } from 'fs'
import loadModels from '../helpers/loadModels'
import { associationsPath } from '../helpers/path'
import sortBy from 'lodash.sortby'
import initializeDream from '../../shared/helpers/initializeDream'

export default async function buildAssociations() {
  await initializeDream()

  console.log('writing dream type metadata...')
  let fileStr = await buildAssociationsFile()
  fileStr = await writeVirtualColumns(fileStr)

  const clientFilePath = await associationsPath()
  await fs.writeFile(clientFilePath, fileStr)
  console.log('Done!')
  process.exit()
}

// eslint-disable-next-line
buildAssociations()

async function getDBColumns() {
  const models = sortBy(Object.values(await loadModels()), m => m.prototype.table)
  const dbColumns: any = {}
  models.forEach(m => {
    dbColumns[m.prototype.table] = m.prototype.dreamconf.dbColumns[m.prototype.table]
  })
  return dbColumns
}

async function writeVirtualColumns(fileStr: string) {
  const models = Object.values(await loadModels())
  const modelsBeforeAdaption: { [key: string]: string[] } = {}
  const dbColumns: any = await getDBColumns()

  // eslint-disable-next-line
  const keys = Object.keys(dbColumns)

  keys.forEach(column => {
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
      ...model['virtualAttributes'].map(vc => vc.property),
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

  // eslint-disable-next-line
  const keys = Object.keys(dbColumns)

  keys.forEach(column => {
    finalModels[column] = {}
  })

  for (const model of models) {
    for (const associationName of model.associationNames) {
      // eslint-disable-next-line
      const associationMetaData = model.associationMap()[associationName]
      if (targetAssociationType && associationMetaData.type !== targetAssociationType) continue

      finalModels[model.prototype.table] ||= {}

      // eslint-disable-next-line
      const dreamClassOrClasses = associationMetaData.modelCB()
      if (Array.isArray(dreamClassOrClasses)) {
        // eslint-disable-next-line
        const tables: string[] = (dreamClassOrClasses as any[]).map(dreamClass => dreamClass.prototype.table)
        finalModels[model.prototype.table][associationName] ||= []
        finalModels[model.prototype.table][associationName] = [
          ...finalModels[model.prototype.table][associationName],
          ...tables,
        ]
      } else {
        finalModels[model.prototype.table][associationName] ||= []
        // eslint-disable-next-line
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

  // eslint-disable-next-line
  const keys = Object.keys(dbColumns)

  keys.forEach(column => {
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
