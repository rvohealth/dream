import Dream from '../../dream'
import getFiles from '../../helpers/getFiles'
import globalNameIsAvailable from './globalNameIsAvailable'

let _models: Record<string, typeof Dream>

export default async function loadModels(modelsPath: string): Promise<Record<string, typeof Dream>> {
  if (_models) return _models

  _models = {}
  const modelPaths = (await getFiles(modelsPath)).filter(path => /\.[jt]s$/.test(path))

  for (const modelPath of modelPaths) {
    const potentialModel = (await import(modelPath)).default

    if ((potentialModel as typeof Dream)?.isDream) {
      const model = potentialModel as typeof Dream

      if (!globalNameIsAvailable(model.globalName)) {
        throw new Error(
          `
Attempted to register ${model.name}, but another model was detected with the same
name. To fix this, use the "globalName" getter to distinguish one of these models
from the other, i.e.:

export default class ${model.name} extends ApplicationModel {
  public static get globalName() {
    return 'MyCustomGlobalName'
  }
}
`
        )
      }

      let hasTable = false
      try {
        hasTable = !!model.table
      } catch {
        // ApplicationModel will automatically raise an exception here,
        // since it does not have a table.
      }

      if (hasTable && model.globalName) {
        _models[model.globalName] = potentialModel
      }
    }
  }

  return _models
}

export function getModelsOrFail() {
  if (!_models) throw new Error('Must call loadModels before calling getModelsOrFail')
  return _models
}

export function getModelsOrBlank() {
  return _models || {}
}
