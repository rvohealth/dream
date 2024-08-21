import { SingleDbCredential } from '../dream-application';
import { DbConnectionType } from './types';
export default class ConnectionConfRetriever {
    getConnectionConf(connection: DbConnectionType): SingleDbCredential;
    hasReplicaConfig(): boolean;
}
