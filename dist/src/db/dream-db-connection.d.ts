import { Kysely } from 'kysely';
import { DbConnectionType } from './types';
export default class DreamDbConnection {
    static getConnection<DB>(connectionType: DbConnectionType): Kysely<DB>;
}
export declare function dreamDbConnections(): {
    [key: string]: Kysely<any>;
};
export declare function closeAllDbConnections(): Promise<void>;
