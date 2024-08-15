import compact from '../../helpers/compact'
import lookupModelByGlobalName from './lookupModelByGlobalName'

export default function lookupModelByGlobalNameOrNames(globalName: string | string[]) {
  if (Array.isArray(globalName)) return compact(globalName.map(name => lookupModelByGlobalName(name)))
  return lookupModelByGlobalName(globalName)
}
