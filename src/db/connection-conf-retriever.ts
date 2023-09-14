import { DbConfig, DbConnectionConfig } from '../../shared/helpers/path/types'
import { DbConnectionType } from './types'
import Dreamconf from '../../shared/dreamconf'

export default class ConnectionConfRetriever {
  public dbConfig: DbConfig
  constructor(dreamconf: Dreamconf) {
    this.dbConfig = dreamconf.env.db
  }

  public getConnectionConf(connection: DbConnectionType): DbConnectionConfig {
    const nodeEnv = process.env.NODE_ENV! as 'production' | 'development' | 'test'
    const conf = this.dbConfig[nodeEnv]?.[connection] || this.dbConfig[nodeEnv]?.primary
    if (!conf)
      throw `
      Cannot find a connection config given the following connection and node environment:
        connection: ${connection}
        NODE_ENV: ${nodeEnv}
    `

    return conf
  }

  public hasReplicaConfig() {
    const nodeEnv = process.env.NODE_ENV! as 'production' | 'development' | 'test'
    return !!this.dbConfig[nodeEnv]?.replica
  }
}
