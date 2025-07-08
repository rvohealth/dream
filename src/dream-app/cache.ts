import EnvInternal from '../helpers/EnvInternal.js'
import DreamApp from './index.js'

let _dreamApp: DreamApp | undefined = undefined

export function cacheDreamApp(dreamconf: DreamApp) {
  _dreamApp = dreamconf
}

export function getCachedDreamAppOrFail() {
  if (!_dreamApp) {
    const baseErrorMessage =
      'Must call `initializeDreamApp` or `initializePsychicApp` before loading cached DreamApp.getOrFail().'

    if (EnvInternal.isTest) {
      throw new Error(
        `${baseErrorMessage}

Check for specs running directly in a \`describe\` or \`context\` block rather than nested within an \`it\` block.`
      )
    } else {
      throw new Error(baseErrorMessage)
    }
  }

  return _dreamApp
}
