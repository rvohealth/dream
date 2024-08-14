import Dream from '../../dream'
import DreamGlobalNameConflict from '../../exceptions/dream-application/dream-global-name-conflict'
import getFiles from '../../helpers/getFiles'
import globalNameIsAvailable from './globalNameIsAvailable'
import pathToGlobalKey from './pathToGlobalKey'

let _models: Record<string, typeof Dream>

export default async function loadModels(modelsPath: string): Promise<Record<string, typeof Dream>> {
  if (_models) return _models

  _models = {}
  const modelPaths = (await getFiles(modelsPath)).filter(path => /\.[jt]s$/.test(path))

  for (const modelPath of modelPaths) {
    const potentialModel = (await import(modelPath)).default

    if ((potentialModel as typeof Dream)?.isDream) {
      const model = potentialModel as typeof Dream
      const modelKey = pathToGlobalKey(modelPath, /^.*app\/models\//)

      if (!globalNameIsAvailable(modelKey)) throw new DreamGlobalNameConflict(modelKey)

      let hasTable = false
      try {
        hasTable = !!model.table
      } catch {
        // ApplicationModel will automatically raise an exception here,
        // since it does not have a table.
      }

      model.setGlobalName(modelKey)

      if (hasTable && modelKey) {
        _models[modelKey] = model
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
