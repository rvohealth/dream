import { SingleDbCredential } from '../../src/dreamconf'
import { getCachedDreamconfOrFail } from '../../src/dreamconf/cache'

export default class ConnectionConfRetriever {
  public async getConnectionConf(connection: DbConnectionType): Promise<SingleDbCredential> {
    const dreamconf = getCachedDreamconfOrFail()
    const dbConfig = dreamconf.dbCredentials

    const nodeEnv = process.env.NODE_ENV! as 'production' | 'development' | 'test'
    const conf = dbConfig[connection] || dbConfig.primary

    if (!conf)
      throw `
      Cannot find a connection config given the following connection and node environment:
        connection: ${connection}
        NODE_ENV: ${nodeEnv}
    `

    return conf
  }
}

export type DbConnectionType = 'primary' | 'replica'
