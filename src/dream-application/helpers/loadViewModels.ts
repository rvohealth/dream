import Dream from '../../dream'
import { ViewModel } from '../../dream/types'
import getFiles from '../../helpers/getFiles'
import importFile from '../../helpers/path/importFile'
import globalNameIsAvailable from './globalNameIsAvailable'

let _viewModels: Record<string, ViewModel>

export default async function loadViewModels(modelsPath: string): Promise<Record<string, ViewModel>> {
  if (_viewModels) return _viewModels

  _viewModels = {}
  const modelPaths = (await getFiles(modelsPath)).filter(path => /\.[jt]s$/.test(path))

  for (const modelPath of modelPaths) {
    const potentialModel = (await importFile(modelPath)).default

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

      _viewModels[model.globalName] = potentialModel
    }
  }

  return _viewModels
}

export function getViewModelsOrFail() {
  if (!_viewModels) throw new Error('Must call loadViewModels before calling getViewModelsOrFail')
  return _viewModels
}

export function getViewModelsOrBlank() {
  return _viewModels || {}
}
