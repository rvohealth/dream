import { DbConnectionType } from '../../db/types';
export default function dropDb(connection: DbConnectionType, dbName?: string | null): Promise<false | undefined>;
