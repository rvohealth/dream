import Dream from '../../Dream'
import getFiles from '../../helpers/getFiles'
import globalModelKeyFromPath from './globalModelKeyFromPath'

let _models: Record<string, typeof Dream>

export default async function loadModels(modelsPath: string): Promise<Record<string, typeof Dream>> {
  if (_models) return _models

  /**
   * Certain features (e.g. passing a Dream instance to `create` so that it automatically destructures polymorphic type and primary key)
   * need static access to things set up by decorators (e.g. associations). Stage 3 Decorators change the context that is available
   * at decoration time such that the class of a property being decorated is only avilable during instance instantiation. In order
   * to only apply static values once, on boot, `initializingDecorators` is set to true on Dream, and all Dream models are instantiated.
   */
  Dream.initializingDecorators = true

  _models = {}
  const modelPaths = (await getFiles(modelsPath)).filter(path => /\.[jt]s$/.test(path))

  const modelClasses: [string, typeof Dream][] = []

  for (const modelPath of modelPaths) {
    modelClasses.push([modelPath, (await import(modelPath)).default as typeof Dream])
  }

  for (const [modelPath, modelClass] of modelClasses) {
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

  for (const [, modelClass] of modelClasses) {
    if (modelClass.isDream) {
      try {
        /**
         * Certain features (e.g. passing a Dream instance to `create` so that it automatically destructures polymorphic type and primary key)
         * need static access to things set up by decorators (e.g. associations). Stage 3 Decorators change the context that is available
         * at decoration time such that the class of a property being decorated is only avilable during instance instantiation. In order
         * to only apply static values once, on boot, `initializingDecorators` is set to true on Dream, and all Dream models are instantiated.
         */
        new modelClass({}, { _internalUseOnly: true })
      } catch {
        // ApplicationModel will automatically raise an exception here,
        // since it does not have a table.
      }
    }
  }

  /**
   * Certain features (e.g. passing a Dream instance to `create` so that it automatically destructures polymorphic type and primary key)
   * need static access to things set up by decorators (e.g. associations). Stage 3 Decorators change the context that is available
   * at decoration time such that the class of a property being decorated is only avilable during instance instantiation. In order
   * to only apply static values once, on boot, `initializingDecorators` is set to true on Dream, and all Dream models are instantiated.
   */
  Dream.initializingDecorators = false

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
