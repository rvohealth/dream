import { getModelsOrFail } from './importers/importModels.js'
import { getSerializersOrFail } from './importers/importSerializers.js'
import { getServicesOrFail } from './importers/importServices.js'

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
