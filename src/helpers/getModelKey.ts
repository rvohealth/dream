import Dream from '../dream'
import loadModels from './loadModels'

export default async function getModelKey(dreamClass: typeof Dream): Promise<string | undefined> {
  const models = await loadModels()
  return Object.keys(models).find(modelKey => models[modelKey] === dreamClass)
}
