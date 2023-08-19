import YAML from 'yaml'
import dbConfigPath from './dbConfigPath'
import loadFile from './loadFile'
import { DbConfig } from './types'

let _dbConfigCache: DbConfig | null = null

export default async function loadDbConfigYamlFile() {
  if (_dbConfigCache) return _dbConfigCache

  const file = await loadFile(await dbConfigPath())
  const dbConfig = (await YAML.parse(file.toString())) as DbConfig
  // const dbConfig = (await importFileWithDefault(await dbConfigPath())) as DbConfig

  // TODO: validate shape of payload!

  _dbConfigCache = dbConfig
  return dbConfig
}
