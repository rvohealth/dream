import loadDreamYamlFile from './loadDreamYamlFile'

export default async function relativeDreamPath(dreamPathType: DreamPaths) {
  const yamlConfig = await loadDreamYamlFile()
  switch (dreamPathType) {
    case 'models':
      return yamlConfig.models_path || 'app/models'
    case 'serializers':
      return yamlConfig.serializers_path || 'app/serializers'
    case 'db':
      return yamlConfig.db_path || 'db'
    case 'conf':
      return yamlConfig.conf_path || 'app/conf'
    case 'uspec':
      return yamlConfig.unit_spec_path || 'spec/unit'
  }
}

export type DreamPaths = 'models' | 'serializers' | 'db' | 'conf' | 'uspec'
