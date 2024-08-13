import { getModelsOrFail } from './loadModels'
import { getSerializersOrFail } from './loadSerializers'
import { getServicesOrFail } from './loadServices'
import { getViewModelsOrFail } from './loadViewModels'

export default function lookupGlobalName(globalName: string) {
  const combinedObj = {
    ...getViewModelsOrFail(),
    ...getServicesOrFail(),
    ...getSerializersOrFail(),
    ...getModelsOrFail(),
  }

  return combinedObj[globalName] || null
}
