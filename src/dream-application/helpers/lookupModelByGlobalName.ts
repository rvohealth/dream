import { getModelsOrFail } from './processModels.js'

let _globalNameMap: any

export default function lookupModelByGlobalName(globalName: string) {
  if (_globalNameMap) return _globalNameMap[globalName] || null

  _globalNameMap = {
    ...getModelsOrFail(),
  }

  return lookupModelByGlobalName(globalName)
}
