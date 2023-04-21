import '../helpers/loadEnv'
import * as path from 'path'
import { promises as fs } from 'fs'
import loadModels from '../helpers/loadModels'
import { DreamModel } from '../dream'
import { modelsPath } from '../helpers/path'
import pascalize from '../helpers/pascalize'

export default async function buildModelIndexes() {
  console.log('indexing dream model indexes...')
  await writeModelIndexes()
  console.log('dream model indexing complete!')
}
buildModelIndexes()

async function writeModelIndexes() {
  const models = await loadModels()

  const modelsObj: { [key: string]: DreamModel<any, any> | { [key: string]: DreamModel<any, any> } } = {}
  let currentRef: any = modelsObj
  const finalModelsObj: { [key: string]: DreamModel<any, any> | { [key: string]: DreamModel<any, any> } } = {}
  let currentFinalRef: any = finalModelsObj
  Object.keys(models).forEach(modelKey => {
    const pathParts = modelKey.split('/')
    if (pathParts.length > 1) {
      pathParts.forEach((pathPart, index) => {
        if (index !== pathParts.length - 1) {
          const pascalized = pascalize(pathPart)
          currentRef[pathPart] ||= {}
          currentRef = currentRef[pathPart]
          currentFinalRef[pascalized] ||= {}
          currentFinalRef = currentFinalRef[pascalized]
        }
      })

      currentRef[pathParts[pathParts.length - 1]] = models[modelKey]
      currentFinalRef[pascalize(pathParts[pathParts.length - 1])] = models[modelKey]
      currentRef = modelsObj
    }
  })

  await recursivelyWriteIndexes(modelsObj)
}

async function recursivelyWriteIndexes(obj: any) {
  const rootPath = await modelsPath()
  let currentPath = rootPath
  const doRecursiveWrite = async (obj: any) => {
    for (const key of Object.keys(obj)) {
      if (obj[key]?.constructor?.name === 'Object') {
        currentPath = path.join(currentPath, key)
        const indexFilePath = path.join(currentPath, 'index.ts')

        const indexStr = generateIndexContent(obj[key])
        await fs.writeFile(indexFilePath, indexStr)
        doRecursiveWrite(obj[key])
      } else {
      }
    }
  }
}

function generateIndexContent(obj: any) {
  return `\
${Object.keys(obj)
  .map(relativeModelPath => {
    return `import ${pascalize(relativeModelPath)} from './${relativeModelPath}'`
  })
  .join('\n')}

export default {
  ${Object.keys(obj)
    .map(relativeModelPath => {
      return `${pascalize(relativeModelPath)}`
    })
    .join(',\n  ')}
}`
}
