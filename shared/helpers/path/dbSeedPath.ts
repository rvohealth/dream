import distOrProjectRootPath from './distOrProjectRootPath'
import loadDreamYamlFile from './loadDreamYamlFile'
import transformExtension from './transformExtension'

export default async function dbSeedPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  const yamlConfig = await loadDreamYamlFile()
  return distOrProjectRootPath({ filepath: transformExtension(yamlConfig.db_seed_path), omitDirname })
}
