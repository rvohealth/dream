import loadDreamYamlFile from './loadDreamYamlFile'
import projectRootPath from './projectRootPath'

export default async function dreamconfPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  const yamlConfig = await loadDreamYamlFile()
  return projectRootPath({ filepath: yamlConfig.dreamconf_path, omitDirname })
}
