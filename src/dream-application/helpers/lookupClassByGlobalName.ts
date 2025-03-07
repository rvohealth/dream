import { getModelsOrFail } from './loadModels.js'
import { getSerializersOrFail } from './loadSerializers.js'
import { getServicesOrFail } from './loadServices.js'

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
