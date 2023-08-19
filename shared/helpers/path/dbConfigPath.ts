import loadDreamYamlFile from './loadDreamYamlFile'
import projectRootPath from './projectRootPath'

export default async function dbConfigPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  const yamlConfig = await loadDreamYamlFile()
  return projectRootPath({ filepath: yamlConfig.db_config_path, omitDirname })
}
