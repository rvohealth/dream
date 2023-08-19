import distOrProjectRootPath from './distOrProjectRootPath'
import loadDreamYamlFile from './loadDreamYamlFile'

export default async function migrationsPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  const yamlConfig = await loadDreamYamlFile()
  return distOrProjectRootPath({ filepath: yamlConfig.migrations_path, omitDirname })
}
