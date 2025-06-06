import Dream from '../../Dream.js'
import compact from '../../helpers/compact.js'
import lookupModelByGlobalName from './lookupModelByGlobalName.js'

export default function lookupModelByGlobalNameOrNames(
  globalName: string | string[] | (() => typeof Dream) | (() => (typeof Dream)[])
) {
  if (typeof globalName === 'function') {
    const modelOrModels = globalName()
    return modelOrModels
  } else {
    if (Array.isArray(globalName)) return compact(globalName.map(name => lookupModelByGlobalName(name)))
    return lookupModelByGlobalName(globalName)
  }
}
