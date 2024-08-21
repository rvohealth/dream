import { Kysely, Transaction as KyselyTransaction } from 'kysely';
import Dream from '../dream';
import DreamTransaction from '../dream/transaction';
import { DreamConstructorType, SqlCommandType } from '../dream/types';
import { DbConnectionType } from './types';
export default class ConnectedToDB<DreamInstance extends Dream> {
    dreamInstance: DreamInstance;
    readonly dreamClass: DreamConstructorType<DreamInstance>;
    dreamTransaction: DreamTransaction<Dream> | null;
    connectionOverride?: DbConnectionType;
    constructor(dreamInstance: DreamInstance, opts?: ConnectedToDBOpts);
    dbConnectionType(sqlCommandType: SqlCommandType): DbConnectionType;
    dbFor(sqlCommandType: SqlCommandType): Kysely<DreamInstance['DB']> | KyselyTransaction<DreamInstance['DB']>;
}
export interface ConnectedToDBOpts {
    transaction?: DreamTransaction<Dream> | null | undefined;
    connection?: DbConnectionType;
}
