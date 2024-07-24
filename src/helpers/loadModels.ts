import path from 'path'
import Dream from '../dream'
import getFiles from './getFiles'
import importFileWithDefault from './importFileWithDefault'
import pascalize from './pascalize'
import { modelsPath } from './path'
import relativeDreamPath from './path/relativeDreamPath'

let models: { [key: string]: typeof Dream } | null = null
export default async function loadModels() {
  if (models) return models

  const pathToModels = await modelsPath()
  const modelPaths = (await getFiles(pathToModels)).filter(path =>
    process.env.DREAM_CORE_SPEC_RUN === '1' || process.env.TS_SAFE === '1'
      ? /\.ts$/.test(path) && !/index\.ts$/.test(path)
      : /\.js$/.test(path) && !/index\.js$/.test(path)
  )
  const relativeModelsPath = await relativeDreamPath('models')
  const relativeModelPaths = modelPaths.map(path => path.replace(new RegExp(`^.*${relativeModelsPath}/`), ''))
  models = {}

  const modelsObj: { [key: string]: typeof Dream | { [key: string]: typeof Dream } } = {}
  let currentRef: any = modelsObj
  for (const modelPath of relativeModelPaths) {
    const relativePath = path.join(
      pathToModels,
      modelPath
      // fullPath.replace(new RegExp(`^.*${yamlConf.models_path}\/`), '')
    )

    const PossibleModelClass: typeof Dream | null = await importFileWithDefault(relativePath)

    let hasValidTable = false
    try {
      PossibleModelClass?.prototype?.table
      hasValidTable = true
    } catch (err) {
      // noop
    }

    if (PossibleModelClass?.isDream && hasValidTable) {
      const ModelClass: typeof Dream = PossibleModelClass
      const modelKey = modelPath.replace(/\.[jt]s$/, '')
      const pathParts = modelKey.split('/')
      pathParts.forEach((pathPart, index) => {
        const pascalized = pascalize(pathPart)
        if (index !== pathParts.length - 1) {
          currentRef[pascalized] ||= {}
          currentRef = currentRef[pascalized]
        }
      })

      if (pathParts.length > 1) {
        currentRef[ModelClass.name] = ModelClass
      }
      currentRef = modelsObj

      models[modelKey] = ModelClass!
    }
  }

  return models
}
