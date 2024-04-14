import loadDreamYamlFile from './loadDreamYamlFile'

export default async function factoriesRelativePath() {
  const yamlConfig = await loadDreamYamlFile()
  return yamlConfig.factory_path || 'spec/factories'
}
