import * as path from 'path'
import * as YAML from 'yaml'
import { promises as fs } from 'fs'
import compact from './compact'

export async function loadFile(filepath: string) {
  return await fs.readFile(filepath)
}

let _yamlCache: DreamYamlConfig | null = null
export async function dreamYamlConfig() {
  if (_yamlCache) return _yamlCache
  const file = await loadFile(projectRootPath('.dream.yml'))
  const config = (await YAML.parse(file.toString())) as DreamYamlConfig
  _yamlCache = config
  return config
}

export function projectRootPath(filepath?: string) {
  if (process.env.CORE_DEVELOPMENT === '1') {
    return path.join(...compact([__dirname, '..', '..', filepath]))
  } else {
    return path.join(...compact([__dirname, '..', '..', '..', '..', filepath]))
  }
}

export async function modelsPath() {
  const yamlConfig = await dreamYamlConfig()
  return projectRootPath(yamlConfig.models_path)
}

export async function migrationsPath() {
  const yamlConfig = await dreamYamlConfig()
  return projectRootPath(yamlConfig.migrations_path)
}

export interface DreamYamlConfig {
  models_path: string
  migrations_path: string
}
