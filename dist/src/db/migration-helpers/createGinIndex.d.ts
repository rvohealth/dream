import { Kysely } from 'kysely';
export default function createGinIndex(tableName: string, column: string, indexName: string, db: Kysely<any>): Promise<void>;
