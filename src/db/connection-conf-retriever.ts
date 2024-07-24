import Dreamconf, { SingleDbCredential } from '../dreamconf'
import { DbConnectionType } from './types'

export default class ConnectionConfRetriever {
  public dreamconf: Dreamconf
  constructor(dreamconf: Dreamconf) {
    this.dreamconf = dreamconf
  }

  public getConnectionConf(connection: DbConnectionType): SingleDbCredential {
    const conf = this.dreamconf.dbCredentials?.[connection] || this.dreamconf.dbCredentials?.primary

    if (!conf)
      throw new Error(`
      Cannot find a connection config given the following connection and node environment:
        connection: ${connection}
    `)

    return conf
  }

  public hasReplicaConfig() {
    return !!this.dreamconf.dbCredentials.replica
  }
}
