import { DbConnectionType } from '../../db/types';
export default function createDb(connection: DbConnectionType, dbName?: string | null): Promise<false | undefined>;
