import YAML from 'yaml'
import loadFile from './loadFile'
import projectRootPath from './projectRootPath'
import { DreamYamlFile } from './types'

let _yamlCache: DreamYamlFile | null = null

export default async function loadDreamYamlFile() {
  if (_yamlCache) return _yamlCache

  const file = await loadFile(projectRootPath({ filepath: '.dream.yml' }))
  const config = (await YAML.parse(file.toString())) as DreamYamlFile

  // TODO: validate shape of yaml file!

  _yamlCache = config
  return config
}
