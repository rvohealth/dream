import DreamApplication from './index.js'

let _dreamApp: DreamApplication | undefined = undefined

export function cacheDreamApplication(dreamconf: DreamApplication) {
  _dreamApp = dreamconf
}

export function getCachedDreamApplicationOrFail() {
  if (!_dreamApp)
    throw new Error(
      'Must call `initializeDreamApplication` or `initializePsychicApplication` before loading cached DreamApplication.getOrFail()'
    )
  return _dreamApp
}
