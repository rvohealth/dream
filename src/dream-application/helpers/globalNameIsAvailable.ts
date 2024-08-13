import { getModelsOrBlank } from './loadModels'
import { getSerializersOrBlank } from './loadSerializers'
import { getServicesOrBlank } from './loadServices'
import { getViewModelsOrBlank } from './loadViewModels'

export default function globalNameIsAvailable(globalName: string) {
  return ![
    ...Object.keys(getModelsOrBlank()),
    ...Object.keys(getSerializersOrBlank()),
    ...Object.keys(getViewModelsOrBlank()),
    ...Object.keys(getServicesOrBlank()),
  ].includes(globalName)
}
