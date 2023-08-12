import path from 'path'
import YAML from 'yaml'
import { promises as fs } from 'fs'
import compact from './compact'
import importFileWithDefault from './importFileWithDefault'

export async function loadFile(filepath: string) {
  return await fs.readFile(filepath)
}

export async function writeFile(filepath: string, contents: string) {
  return await fs.writeFile(filepath, contents)
}

export async function importFile(filepath: string) {
  return await import(filepath)
}

let _yamlCache: DreamYamlFile | null = null
export async function loadDreamYamlFile() {
  if (_yamlCache) return _yamlCache

  const file = await loadFile(projectRootPath({ filepath: '.dream.yml' }))
  const config = (await YAML.parse(file.toString())) as DreamYamlFile

  // TODO: validate shape of yaml file!

  _yamlCache = config
  return config
}

let _dbConfigCache: DbConfig | null = null
export async function loadDbConfigYamlFile() {
  if (_dbConfigCache) return _dbConfigCache

  const file = await loadFile(await dbConfigPath())
  const dbConfig = (await YAML.parse(file.toString())) as DbConfig
  // const dbConfig = (await importFileWithDefault(await dbConfigPath())) as DbConfig

  // TODO: validate shape of payload!

  _dbConfigCache = dbConfig
  return dbConfig
}

export function projectRootPath({
  filepath,
  omitDirname,
}: { filepath?: string; omitDirname?: boolean } = {}) {
  const dirname = omitDirname ? undefined : __dirname

  if (process.env.DREAM_CORE_DEVELOPMENT === '1') {
    return path.join(...compact([dirname, '..', '..', filepath]))
  } else {
    return path.join(...compact([dirname, '..', '..', '..', '..', filepath]))
  }
}

export async function schemaPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  const yamlConfig = await loadDreamYamlFile()
  return projectRootPath({ filepath: yamlConfig.schema_path, omitDirname })
}

export async function modelsPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  const yamlConfig = await loadDreamYamlFile()
  return projectRootPath({ filepath: yamlConfig.models_path, omitDirname })
}

export async function migrationsPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  const yamlConfig = await loadDreamYamlFile()
  return projectRootPath({ filepath: yamlConfig.migrations_path, omitDirname })
}

export async function dbConfigPath({ omitDirname }: { omitDirname?: boolean } = {}) {
  const yamlConfig = await loadDreamYamlFile()
  return projectRootPath({ filepath: yamlConfig.db_config_path, omitDirname })
}

export interface DreamYamlFile {
  models_path: string
  serializers_path: string
  associations_path: string
  migrations_path: string
  schema_path: string
  db_config_path: string
  unit_spec_path: string
  feature_spec_path: string
}

export interface DreamConfig {
  db: DbConfig
}

export interface DbConfig {
  production: {
    primary: DbConnectionConfig
    replica?: DbConnectionConfig
  }
  development: {
    primary: DbConnectionConfig
    replica?: DbConnectionConfig
  }
  test: {
    primary: DbConnectionConfig
    replica?: DbConnectionConfig
  }
}

export interface DbConnectionConfig {
  user: string
  password: string
  name: string
  host: string
  port: string
  use_ssl?: string
}
