import Dream from '../../Dream'
import getFiles from '../../helpers/getFiles'
import globalModelKeyFromPath from './globalModelKeyFromPath'

let _models: Record<string, typeof Dream>

export default async function loadModels(modelsPath: string): Promise<Record<string, typeof Dream>> {
  if (_models) return _models

  _models = {}
  const modelPaths = (await getFiles(modelsPath)).filter(path => /\.[jt]s$/.test(path))

  for (const modelPath of modelPaths) {
    const modelClass = (await import(modelPath)) as typeof Dream

    if (modelClass.isDream) {
      try {
        // Don't create a global lookup for ApplicationModel
        // ApplicationModel does not have a table
        if (modelClass.table) {
          const modelKey = globalModelKeyFromPath(modelPath, modelsPath)
          modelClass['setGlobalName'](modelKey)
          _models[modelKey] = modelClass
        }
      } catch {
        // ApplicationModel will automatically raise an exception here,
        // since it does not have a table.
      }
    }
  }

  return _models
}

export function setCachedModels(models: Record<string, typeof Dream>) {
  _models = models
}

export function getModelsOrFail() {
  if (!_models) throw new Error('Must call loadModels before calling getModelsOrFail')
  return _models
}

export function getModelsOrBlank() {
  return _models || {}
}
