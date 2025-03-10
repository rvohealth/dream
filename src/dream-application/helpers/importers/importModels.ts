import Dream from '../../../Dream.js'
import MissingTable from '../../../errors/MissingTable.js'
import DreamImporter from '../DreamImporter.js'
import globalModelKeyFromPath from '../globalModelKeyFromPath.js'

let _models: Record<string, typeof Dream>

export default async function importModels(
  modelsPath: string,
  modelImportCb: (path: string) => Promise<any>
): Promise<Record<string, typeof Dream>> {
  if (_models) return _models

  const modelClasses = await DreamImporter.importDreams(modelsPath, modelImportCb)

  /**
   * Certain features (e.g. passing a Dream instance to `create` so that it automatically destructures polymorphic type and primary key)
   * need static access to things set up by decorators (e.g. associations). Stage 3 Decorators change the context that is available
   * at decoration time such that the class of a property being decorated is only avilable during instance instantiation. In order
   * to only apply static values once, on boot, `globallyInitializingDecorators` is set to true on Dream, and all Dream models are instantiated.
   */
  Dream['globallyInitializingDecorators'] = true

  _models = {}

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
      } catch (error) {
        // ApplicationModel will automatically raise an exception here,
        // since it does not have a table.
        if (!(error instanceof MissingTable)) throw error
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
         * to only apply static values once, on boot, `globallyInitializingDecorators` is set to true on Dream, and all Dream models are instantiated.
         */
        new modelClass({}, { _internalUseOnly: true })
      } catch (error) {
        // ApplicationModel will automatically raise an exception here,
        // since it does not have a table.
        if (!(error instanceof MissingTable)) throw error
      }
    }
  }

  /**
   * Certain features (e.g. passing a Dream instance to `create` so that it automatically destructures polymorphic type and primary key)
   * need static access to things set up by decorators (e.g. associations). Stage 3 Decorators change the context that is available
   * at decoration time such that the class of a property being decorated is only avilable during instance instantiation. In order
   * to only apply static values once, on boot, `globallyInitializingDecorators` is set to true on Dream, and all Dream models are instantiated.
   */
  Dream['globallyInitializingDecorators'] = false

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
