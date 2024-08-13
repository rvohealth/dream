import { ViewModelClass } from '../../dream/types'
import getFiles from '../../helpers/getFiles'
import globalNameIsAvailable from './globalNameIsAvailable'

let _viewModels: Record<string, ViewModelClass>

export default async function loadViewModels(
  viewModelsPath: string
): Promise<Record<string, ViewModelClass>> {
  if (_viewModels) return _viewModels

  _viewModels = {}
  const viewModelPaths = (await getFiles(viewModelsPath)).filter(path => /\.[jt]s$/.test(path))

  for (const viewModelPath of viewModelPaths) {
    const potentialViewModel = (await import(viewModelPath)).default

    const viewModelClass = potentialViewModel as ViewModelClass

    if (!globalNameIsAvailable(viewModelClass.name)) {
      throw new Error(
        `
Attempted to register ${viewModelClass.name}, but something else was detected with the same
name. To fix this, make sure the class name you use for this view model is unique to your system.`
      )
    }

    _viewModels[viewModelClass.name] = potentialViewModel
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
