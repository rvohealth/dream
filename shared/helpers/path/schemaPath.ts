import loadDreamYamlFile from './loadDreamYamlFile'
import projectRootPath from './projectRootPath'

export default async function schemaPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  const yamlConfig = await loadDreamYamlFile()
  return projectRootPath({ filepath: yamlConfig.schema_path, omitDirname })
}
