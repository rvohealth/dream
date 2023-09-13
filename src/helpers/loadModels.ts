import path from 'path'
import Dream from '../dream'
import { loadDreamYamlFile, modelsPath } from './path'
import pascalize from './pascalize'
import getFiles from './getFiles'
import importFileWithDefault from './importFileWithDefault'

let models: { [key: string]: typeof Dream } | null = null
export default async function loadModels() {
  if (models) return models!

  const pathToModels = await modelsPath()
  const yamlConf = await loadDreamYamlFile()
  const modelPaths = (await getFiles(pathToModels)).filter(path =>
    process.env.DREAM_CORE_SPEC_RUN === '1' || process.env.TS_SAFE === '1'
      ? /\.ts$/.test(path) && !/index\.ts$/.test(path)
      : /\.js$/.test(path) && !/index\.js$/.test(path)
  )
  const relativeModelPaths = modelPaths.map(path =>
    path.replace(new RegExp(`^.*${yamlConf.models_path}\/`), '')
  )
  models = {}

  const modelsObj: { [key: string]: typeof Dream | { [key: string]: typeof Dream } } = {}
  let currentRef: any = modelsObj
  for (const modelPath of relativeModelPaths) {
    const fullPath = path.join(pathToModels, modelPath)
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
    } catch (err) {}

    if (PossibleModelClass?.isDream && hasValidTable) {
      const ModelClass: typeof Dream = PossibleModelClass
      const modelKey = modelPath.replace(/\.[jt]s$/, '')
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
    }
  }

  return models
}
