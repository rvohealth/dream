import { ViewModelClass } from '../../dream/types'
import DreamGlobalNameConflict from '../../exceptions/dream-application/dream-global-name-conflict'
import getFiles from '../../helpers/getFiles'
import globalNameIsAvailable from './globalNameIsAvailable'
import pathToGlobalKey from './pathToGlobalKey'

let _viewModels: Record<string, ViewModelClass>

export default async function loadViewModels(
  viewModelsPath: string
): Promise<Record<string, ViewModelClass>> {
  if (_viewModels) return _viewModels

  _viewModels = {}
  const viewModelPaths = (await getFiles(viewModelsPath)).filter(path => /\.[jt]s$/.test(path))

  for (const viewModelPath of viewModelPaths) {
    const potentialViewModel = (await import(viewModelPath)).default

    const viewModelKey = pathToGlobalKey(viewModelPath, /^.*app\/view-models\//)

    if (!globalNameIsAvailable(viewModelKey)) throw new DreamGlobalNameConflict(viewModelKey)

    potentialViewModel.globalName = viewModelKey

    _viewModels[viewModelKey] = potentialViewModel
  }

  return _viewModels
}

export function setCachedViewModels(viewModels: Record<string, ViewModelClass>) {
  _viewModels = viewModels
}

export function getViewModelsOrFail() {
  if (!_viewModels) throw new Error('Must call loadViewModels before calling getViewModelsOrFail')
  return _viewModels
}

export function getViewModelsOrBlank() {
  return _viewModels || {}
}
