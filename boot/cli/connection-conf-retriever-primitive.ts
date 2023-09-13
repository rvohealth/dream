import { DbConnectionConfig } from '../../shared/helpers/path/types'
import { loadDbConfigYamlFile } from '../../src/helpers/path'

export type DbConnectionType = 'primary' | 'replica'

export default class ConnectionConfRetriever {
  public async getConnectionConf(connection: DbConnectionType): Promise<DbConnectionConfig> {
    const dbConfig = await loadDbConfigYamlFile()

    const nodeEnv = process.env.NODE_ENV! as 'production' | 'development' | 'test'
    const conf = dbConfig[nodeEnv]?.[connection] || dbConfig[nodeEnv]?.primary
    if (!conf)
      throw `
      Cannot find a connection config given the following connection and node environment:
        connection: ${connection}
        NODE_ENV: ${nodeEnv}
    `

    return conf
  }
}
