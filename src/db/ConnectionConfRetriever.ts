import DreamApplication, { SingleDbCredential } from '../dream-application/index.js.js'
import EnvInternal from '../helpers/EnvInternal.js.js'
import { DbConnectionType } from './types.js.js'

export default class ConnectionConfRetriever {
  public getConnectionConf(connection: DbConnectionType): SingleDbCredential {
    const dreamApplication = DreamApplication.getOrFail()
    const conf = dreamApplication.dbCredentials?.[connection] || dreamApplication.dbCredentials?.primary

    if (!conf)
      throw new Error(`
      Cannot find a connection config given the following connection and node environment:
        connection: ${connection}
        NODE_ENV: ${EnvInternal.nodeEnv}
    `)

    return conf
  }

  public hasReplicaConfig() {
    const dreamApplication = DreamApplication.getOrFail()
    return !!dreamApplication.dbCredentials.replica
  }
}
