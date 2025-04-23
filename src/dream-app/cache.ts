import DreamApp from './index.js'

let _dreamApp: DreamApp | undefined = undefined

export function cacheDreamApp(dreamconf: DreamApp) {
  _dreamApp = dreamconf
}

export function getCachedDreamAppOrFail() {
  if (!_dreamApp)
    throw new Error(
      'Must call `initializeDreamApp` or `initializePsychicApp` before loading cached DreamApp.getOrFail()'
    )
  return _dreamApp
}
