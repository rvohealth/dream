import { getModelsOrFail } from './processModels.js'
import { getSerializersOrFail } from './processSerializers.js'
import { getServicesOrFail } from './processServices.js'

let _globalNameMap: any

export default function lookupClassByGlobalName(globalName: string) {
  if (_globalNameMap) return _globalNameMap[globalName] || null

  _globalNameMap = {
    ...getServicesOrFail(),
    ...getSerializersOrFail(),
    ...getModelsOrFail(),
  }

  return lookupClassByGlobalName(globalName)
}
