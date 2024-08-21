import DreamApplication, { SingleDbCredential } from '../dream-application'
import { DbConnectionType } from './types'

export default class ConnectionConfRetriever {
  public getConnectionConf(connection: DbConnectionType): SingleDbCredential {
    const dreamApplication = DreamApplication.getOrFail()
    const conf = dreamApplication.dbCredentials?.[connection] || dreamApplication.dbCredentials?.primary

    if (!conf)
      throw new Error(`
      Cannot find a connection config given the following connection and node environment:
        connection: ${connection}
    `)

    return conf
  }

  public hasReplicaConfig() {
    const dreamApplication = DreamApplication.getOrFail()
    return !!dreamApplication.dbCredentials.replica
  }
}
