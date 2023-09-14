import loadDreamconfFile from '../../shared/helpers/path/loadDreamconfFile'
import { DbConnectionConfig } from '../../shared/helpers/path/types'

export type DbConnectionType = 'primary' | 'replica'

export default class ConnectionConfRetriever {
  public async getConnectionConf(connection: DbConnectionType): Promise<DbConnectionConfig> {
    const dreamconf = await loadDreamconfFile()
    const dbConfig = dreamconf.env.db

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
