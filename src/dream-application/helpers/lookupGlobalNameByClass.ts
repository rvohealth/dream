import Dream from '../../dream'
import DreamSerializer from '../../serializer'
import { getModelsOrFail } from './loadModels'
import { getSerializersOrFail } from './loadSerializers'
import { getServicesOrFail } from './loadServices'
import { getViewModelsOrFail } from './loadViewModels'

export default function lookupGlobalNameByClass(classDef: any): string | null {
  if ((classDef as typeof Dream).isDream) {
    const models = getModelsOrFail()
    return Object.keys(models).find(key => models[key] === classDef) || null
  } else if (classDef as typeof DreamSerializer) {
    const serializers = getSerializersOrFail()
    return Object.keys(serializers).find(key => serializers[key] === classDef) || null
  } else {
    const combinedObj = {
      ...getViewModelsOrFail(),
      ...getServicesOrFail(),
    }
    return Object.keys(combinedObj).find(key => combinedObj[key] === classDef) || null
  }
}
