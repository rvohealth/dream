import path from 'path'
import loadDreamYamlFile from './loadDreamYamlFile'
import projectRootPath from './projectRootPath'

export default async function dreamconfPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  const yamlConfig = await loadDreamYamlFile()
  return projectRootPath({ filepath: path.join(yamlConfig.conf_path, 'dreamconf.ts'), omitDirname })
}
