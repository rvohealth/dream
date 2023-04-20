import * as path from 'path'
import Dream, { DreamModel } from '../dream'
import { loadDreamYamlFile, modelsPath } from './path'
import pascalize from './pascalize'
import getFiles from './getFiles'

export default async function loadModels() {
  const pathToModels = await modelsPath()
  const yamlConf = await loadDreamYamlFile()
  const modelPaths = (await getFiles(pathToModels)).filter(
    path => /\.ts$/.test(path) && !/index\.ts$/.test(path)
  )
  const relativeModelPaths = modelPaths.map(path =>
    path.replace(new RegExp(`^.*${yamlConf.models_path}\/`), '')
  )
  const models: { [key: string]: typeof Dream } = {}

  const modelsObj: { [key: string]: DreamModel<any, any> | { [key: string]: DreamModel<any, any> } } = {}
  let currentRef: any = modelsObj
  for (const modelPath of relativeModelPaths) {
    const fullPath = path.join(pathToModels, modelPath)
    const relativePath =
      `../../${process.env.CORE_DEVELOPMENT === '1' ? '' : '../../'}${yamlConf.models_path}/` +
      fullPath.replace(new RegExp(`^.*${yamlConf.models_path}\/`), '')

    let ModelClass: typeof Dream | null = null
    try {
      ModelClass = (await import(relativePath)).default
    } catch (error) {
      throw `Failed to import the following file: ${fullPath}. Error: ${error}`
    }

    if (ModelClass) {
      const modelKey = modelPath.replace(/\.ts$/, '')
      const pathParts = modelKey.split('/')
      pathParts.forEach((pathPart, index) => {
        const pascalized = pascalize(pathPart)
        if (index === pathParts.length - 1) {
        } else {
          currentRef[pascalized] ||= {}
          currentRef = currentRef[pascalized]
        }
      })

      if (pathParts.length > 1) {
        currentRef[ModelClass!.name] = ModelClass!
      }
      currentRef = modelsObj

      models[modelKey] = ModelClass!
    } else {
      console.log('Invalid Model found: ', relativePath)
    }
  }

  return models
}
