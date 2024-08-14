import { getModelsOrFail } from './loadModels'
import { getSerializersOrFail } from './loadSerializers'
import { getServicesOrFail } from './loadServices'

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
