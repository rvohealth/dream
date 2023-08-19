import loadDreamYamlFile from './loadDreamYamlFile'
import projectRootPath from './projectRootPath'

export default async function associationsPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  const yamlConfig = await loadDreamYamlFile()
  return projectRootPath({ filepath: yamlConfig.associations_path, omitDirname })
}
