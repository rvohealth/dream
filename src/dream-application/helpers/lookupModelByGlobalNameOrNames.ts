import compact from '../../helpers/compact.js.js'
import lookupModelByGlobalName from './lookupModelByGlobalName.js.js'

export default function lookupModelByGlobalNameOrNames(globalName: string | string[]) {
  if (Array.isArray(globalName)) return compact(globalName.map(name => lookupModelByGlobalName(name)))
  return lookupModelByGlobalName(globalName)
}
