import DreamApplication, { SingleDbCredential } from '../../src/dream-application'
export default class ConnectionConfRetriever {
  public getConnectionConf(connection: DbConnectionType): SingleDbCredential {
    const dreamconf = DreamApplication.getOrFail()
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
