import * as path from 'path'
import * as YAML from 'yaml'
import { promises as fs } from 'fs'
import compact from './compact'

export async function loadFile(filepath: string) {
  return await fs.readFile(filepath)
}

let _yamlCache: DreamYamlFile | null = null
export async function loadDreamYamlFile() {
  if (_yamlCache) return _yamlCache

  const file = await loadFile(projectRootPath('.dream.yml'))
  const config = (await YAML.parse(file.toString())) as DreamYamlFile

  // TODO: validate shape of yaml file!

  _yamlCache = config
  return config
}

let _dreamConfigCache: DreamConfig | null = null
export async function loadDreamConfigFile() {
  if (_dreamConfigCache) return _dreamConfigCache

  const dreamConfig = (await import(await dreamsConfigPath())).default as DreamConfig

  // TODO: validate shape of payload!

  _dreamConfigCache = dreamConfig
  return dreamConfig
}

export function projectRootPath(filepath?: string) {
  if (process.env.CORE_DEVELOPMENT === '1') {
    return path.join(...compact([__dirname, '..', '..', filepath]))
  } else {
    return path.join(...compact([__dirname, '..', '..', '..', '..', filepath]))
  }
}

export async function modelsPath() {
  const yamlConfig = await loadDreamYamlFile()
  return projectRootPath(yamlConfig.models_path)
}

export async function migrationsPath() {
  const yamlConfig = await loadDreamYamlFile()
  return projectRootPath(yamlConfig.migrations_path)
}

export async function dreamsConfigPath() {
  const yamlConfig = await loadDreamYamlFile()
  return projectRootPath(yamlConfig.dream_config_path)
}

export interface DreamYamlFile {
  models_path: string
  migrations_path: string
  schema_path: string
  dream_config_path: string
}

export interface DreamConfig {
  db: {
    user: string
    password: string
    name: string
    host: string
    port: string | number
  }
}
