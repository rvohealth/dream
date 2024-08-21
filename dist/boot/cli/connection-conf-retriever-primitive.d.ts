import { SingleDbCredential } from '../../src/dream-application';
export default class ConnectionConfRetriever {
    getConnectionConf(connection: DbConnectionType): SingleDbCredential;
}
export type DbConnectionType = 'primary' | 'replica';
