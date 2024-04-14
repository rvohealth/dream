import path from 'path'
import loadDreamYamlFile from './loadDreamYamlFile'
import projectRootPath from './projectRootPath'

export default async function associationsPath() {
  const yamlConfig = await loadDreamYamlFile()
  return projectRootPath({ filepath: path.join(yamlConfig.db_path, 'associations.ts') })
}
