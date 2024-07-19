import path from 'path'
import distOrProjectRootPath from './distOrProjectRootPath'
import loadDreamYamlFile from './loadDreamYamlFile'

export default async function confPath(file?: ConfFile) {
  const yamlConfig = await loadDreamYamlFile()
  return distOrProjectRootPath({
    filepath: file ? path.join(yamlConfig.conf_path, file) : yamlConfig.conf_path,
  })
}

export type ConfFile = 'inflections' | 'env'
